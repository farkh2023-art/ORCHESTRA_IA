import { createHash } from "node:crypto";
import type { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { type AgentSlug, type Prisma } from "@prisma/client";
import { anthropic, estimateCostUsd } from "@/lib/llm";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { costGuard } from "@/lib/costGuard";

const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];
const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1; // 4 tentatives au total
const FALLBACK_MODEL = "claude-haiku-4-5-20251001";

function toLegacyAgentSlug(role: string): AgentSlug {
  return role as AgentSlug;
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(err: unknown): boolean {
  if (err instanceof Anthropic.APIError) {
    return err.status !== 401 && err.status !== 403;
  }
  return true;
}

function buildRetryInstruction(attempt: number, err: unknown): string {
  if (err instanceof SyntaxError) {
    return attempt === 1
      ? "\n\nTon message précédent n'était pas du JSON valide. Réponds UNIQUEMENT avec du JSON valide, sans markdown ni balises."
      : "\n\nRéponds UNIQUEMENT avec le JSON demandé, rien d'autre. Pas de ```json, pas de texte avant ou après.";
  }
  if (err instanceof Error && err.name === "ZodError") {
    return "\n\nLe JSON fourni ne correspond pas au schéma attendu. Vérifie les clés obligatoires et les types, puis réponds avec un JSON valide.";
  }
  return "";
}

export async function runAgentTask<T>({
  taskId,
  schema,
}: {
  taskId: string;
  schema: z.ZodType<T>;
}): Promise<T> {
  // ── 1. Charger la Task ─────────────────────────────────────────────────
  const task = await db.task.findUniqueOrThrow({
    where: { id: taskId },
    include: {
      agentInstance: { include: { project: true, agentTemplate: true } },
    },
  });

  const { agentInstance } = task;
  const agentTemplate = agentInstance.agentTemplate;
  // Official ORCHESTRA_IA routing. Task.agentSlug is legacy and must not drive execution.
  const role = agentInstance.role ?? agentTemplate?.role;
  if (!role || !agentTemplate) {
    const err = new Error("Role AgentInstance ou AgentTemplate manquant");
    await db.task.update({
      where: { id: taskId },
      data: { status: "FAILED", error: err.message, completedAt: new Date() },
    });
    throw err;
  }
  const orgId = agentInstance.project.organizationId;
  const inputStr = JSON.stringify(task.input ?? {});

  // ── 2. organizationId requis — Trace obligatoire ───────────────────────
  if (!orgId) {
    const err = new Error("organizationId manquant — Trace LLM obligatoire");
    await db.task.update({
      where: { id: taskId },
      data: { status: "FAILED", error: err.message, completedAt: new Date() },
    });
    throw err;
  }

  // ── 3. Task → RUNNING ──────────────────────────────────────────────────
  await db.task.update({
    where: { id: taskId },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  logger.info({ taskId, role }, "Agent demarre");

  // ── 4. Garde budgétaire ────────────────────────────────────────────────
  try {
    await costGuard(agentInstance.projectId);
  } catch (err) {
    await db.task.update({
      where: { id: taskId },
      data: { status: "FAILED", error: String(err), completedAt: new Date() },
    });
    throw err;
  }

  let lastError: unknown;
  let currentModel = agentTemplate.model;
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: inputStr },
  ];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      const retryHint = buildRetryInstruction(attempt, lastError);
      if (retryHint) {
        messages.push(
          { role: "assistant", content: "Je vais corriger ma réponse." },
          { role: "user", content: retryHint.trim() }
        );
      }
      await sleep(RETRY_DELAYS_MS[attempt - 1]);
      logger.warn({ taskId, attempt, model: currentModel, err: String(lastError) }, "Retry agent");
    }

    try {
      const t0 = Date.now();

      // ── 5. Appel LLM ──────────────────────────────────────────────────
      const response = await anthropic.messages.create({
        model: currentModel,
        max_tokens: 4_096,
        system: agentTemplate.systemPrompt,
        messages,
      });

      const latencyMs = Date.now() - t0;
      const block = response.content[0];
      if (block.type !== "text") throw new Error("Réponse LLM inattendue (non-text)");
      const outputStr = block.text;

      const tokensIn = response.usage.input_tokens;
      const tokensOut = response.usage.output_tokens;

      // ── 6. Persister Message ───────────────────────────────────────────
      await db.message.create({
        data: {
          agentInstanceId: agentInstance.id,
          taskId: task.id,
          role: "ASSISTANT",
          content: outputStr,
          metadata: { attempt, model: currentModel },
        },
      });

      // ── 7. Persister Trace LLM (orgId garanti non-null) ───────────────
      await db.trace.create({
        data: {
          organizationId: orgId,
          projectId: agentInstance.projectId,
          agentSlug: toLegacyAgentSlug(role),
          taskId: task.id,
          provider: "anthropic",
          model: currentModel,
          tokensIn,
          tokensOut,
          costUsd: estimateCostUsd(currentModel, tokensIn, tokensOut),
          latencyMs,
          inputHash: sha256(inputStr),
          outputHash: sha256(outputStr),
          metadata: { attempt },
        },
      });

      // ── 8. Parser + valider avec Zod ───────────────────────────────────
      const parsed = JSON.parse(outputStr) as unknown;
      const validated = schema.parse(parsed);

      // ── 9. Task → DONE ─────────────────────────────────────────────────
      await db.task.update({
        where: { id: taskId },
        data: {
          status: "DONE",
          output: validated as Prisma.InputJsonValue,
          tokensUsed: tokensIn + tokensOut,
          completedAt: new Date(),
        },
      });

      logger.info({ taskId, role, attempt, model: currentModel }, "Agent termine OK");
      return validated;
    } catch (err) {
      lastError = err;

      // Fallback vers Haiku sur surcharge (529) ou service indisponible (503)
      const statusCode = (err as { status?: number })?.status;
      if ((statusCode === 529 || statusCode === 503) && currentModel !== FALLBACK_MODEL) {
        logger.warn(
          { taskId, from: currentModel, to: FALLBACK_MODEL },
          "Surcharge détectée — fallback modèle"
        );
        currentModel = FALLBACK_MODEL;
      }

      if (!isRetryable(err)) break;
    }
  }

  // ── Toutes tentatives épuisées → Task FAILED ──────────────────────────
  await db.task.update({
    where: { id: taskId },
    data: {
      status: "FAILED",
      error: String(lastError),
      completedAt: new Date(),
    },
  });

  logger.error({ taskId, err: lastError }, "Agent échoué après tous les retries");
  throw lastError;
}
