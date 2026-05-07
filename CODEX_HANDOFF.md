\# CODEX\_HANDOFF — ORCHESTRA\_IA



\## État validé



Phases terminées :

\- Phase 1 : Next.js 15 + TypeScript strict + Tailwind + pnpm.

\- Phase 2C : Prisma ORCHESTRA\_IA conforme.

\- Phase 3 : runtime universel agent + costGuard + Trace obligatoire + fallback modèle.

\- Phase 4C : BullMQ Queue + Worker + Dispatcher DAG corrigés.



Tests actuels :

\- typecheck OK

\- lint OK

\- tests OK : 22/22



\## Architecture validée



Modèles Prisma importants :

\- Organization

\- User

\- Account

\- Session

\- VerificationToken

\- Project

\- ProjectSpec

\- AgentTemplate

\- AgentInstance

\- Task

\- Message

\- KnowledgeChunk

\- Trace

\- ValidationReport



Agents noyau :

\- COORDINATOR

\- ANALYST

\- ARCHITECT

\- RESEARCHER

\- WRITER

\- CRITIC

\- INTEGRATOR



Points d’architecture à respecter :

\- Le worker BullMQ appelle uniquement `runAgentTask(taskId)`.

\- Le worker ne route jamais par `agentSlug`.

\- Le payload BullMQ contient seulement :

&nbsp; `{ taskId, projectId, organizationId, attempt? }`

\- Le DAG utilise `Task.dependsOn\[]`, jamais `task.input.dependsOn`.

\- Une tâche dispatchée passe à `QUEUED`.

\- Après succès, le worker appelle `unlockDependents(taskId)`.

\- Le runtime résout le rôle depuis la DB via Task → AgentInstance → AgentTemplate.

\- Trace LLM obligatoire.

\- MAX\_PROJECT\_USD obligatoire comme garde budgétaire.



\## Prochaine phase



Lancer Phase 5 :

\- Orchestrateur minimal

\- Intake

\- Recruiter

\- Planner DAG

\- Integrator Markdown

\- ProjectOrchestrator

\- Schémas Zod des 7 agents

\- Adaptation runAgentTask multi-rôles si nécessaire



\## Commandes de vérification



```bash

pnpm prisma generate

pnpm typecheck

pnpm lint

pnpm test

