Avant Phase 5, fais une micro-correction finale Phase 4C.



Objectif :

Le worker BullMQ ne doit plus router vers runAnalyst directement.



Correction obligatoire :

\- Dans src/workers/agent.worker.ts, remplace toute logique du type :

&nbsp; agentSlug → runAnalyst(...)

par :

&nbsp; import { runAgentTask } from "@/lib/agents/runtime"

&nbsp; await runAgentTask(taskId)



Le rôle de l’agent doit être résolu par runAgentTask à partir de :

\- Task

\- AgentInstance

\- AgentTemplate



Le payload BullMQ ne doit pas décider quel agent exécuter.

Il doit seulement transporter :

{

&nbsp; taskId,

&nbsp; projectId,

&nbsp; organizationId,

&nbsp; attempt?

}



Vérifie aussi :

\- Task.dependsOn\[] est bien utilisé, pas task.input.dependsOn.

\- enqueue passe bien Task.status à QUEUED.

\- unlockDependents est appelé après succès.

\- les tests worker sont adaptés à runAgentTask universel.



Lance ensuite :

pnpm typecheck

pnpm lint

pnpm test



Si tout est vert, enchaîne directement avec Phase 5 — Orchestrateur minimal + autres agents.

