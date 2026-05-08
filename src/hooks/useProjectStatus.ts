"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectStatusPayload } from "@/types/projectStatus";

export async function fetchProjectStatus(projectId: string): Promise<ProjectStatusPayload> {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/status`, {
    cache: "no-store",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Statut projet indisponible (${response.status})`);
  }
  return (await response.json()) as ProjectStatusPayload;
}

export function useProjectStatus(projectId: string, initialData?: ProjectStatusPayload | null) {
  const [data, setData] = useState<ProjectStatusPayload | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/status`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Statut projet indisponible (${response.status})`);
      setData((await response.json()) as ProjectStatusPayload);
      setError(null);
    } catch (err) {
      if ((err as { name?: string }).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Erreur de polling projet");
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }, [projectId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, 4_000);

    return () => {
      window.clearInterval(interval);
      abortRef.current?.abort();
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
