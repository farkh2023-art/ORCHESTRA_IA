Phase 2 v2 presque validée, mais il reste 2 écarts bloquants avant la Phase 3.



Ne lance pas encore le runtime Analyst.



Corrections obligatoires Phase 2C :



1\. Modèle mémoire vectorielle



Le cahier des charges ORCHESTRA\_IA impose un modèle nommé exactement :



KnowledgeChunk



Actuellement tu as créé :

\- Knowledge

\- Chunk



Ce découpage est techniquement défendable, mais il ne respecte pas le contrat d’architecture demandé.



Action :

\- Remplacer Knowledge + Chunk par un modèle principal unique KnowledgeChunk.

\- KnowledgeChunk doit contenir :

&nbsp; - id

&nbsp; - organizationId

&nbsp; - projectId optionnel

&nbsp; - sourceType

&nbsp; - sourceId

&nbsp; - title

&nbsp; - content

&nbsp; - metadata Json?

&nbsp; - embedding Unsupported("vector(1536)")

&nbsp; - createdAt

\- Conserver CREATE EXTENSION IF NOT EXISTS "vector";

\- Conserver vector(1536).



2\. Seed des 7 agents noyau



Le seed actuel contient :

\- INTAKE\_PLANNER

\- ANALYST

\- RESEARCHER

\- RECRUITER

\- DISPATCHER

\- WRITER

\- REVIEWER



Ce n’est pas conforme.



Le seed final doit contenir exactement ces 7 AgentTemplate noyau :

\- Coordinator

\- Analyst

\- Architect

\- Researcher

\- Writer

\- Critic

\- Integrator



Action :

\- Remplacer INTAKE\_PLANNER par Coordinator.

\- Remplacer RECRUITER par Architect ou supprimer RECRUITER.

\- Remplacer DISPATCHER par Integrator ou supprimer DISPATCHER.

\- Remplacer REVIEWER par Critic.

\- Ajouter Architect si absent.

\- Ajouter Integrator si absent.

\- Garder Analyst, Researcher, Writer.



Les rôles AgentRole doivent permettre :

\- COORDINATOR

\- ANALYST

\- ARCHITECT

\- RESEARCHER

\- WRITER

\- CRITIC

\- INTEGRATOR



3\. Trace



Vérifie que Trace correspond bien à une trace d’appel LLM, pas seulement à un log applicatif.



Trace doit contenir au minimum :

\- id

\- organizationId

\- projectId

\- agentId optionnel

\- taskId optionnel

\- provider

\- model

\- tokensIn

\- tokensOut

\- costUsd

\- latencyMs

\- inputHash

\- outputHash

\- metadata Json?

\- createdAt



Les niveaux DEBUG/INFO/WARN/ERROR peuvent exister ailleurs si tu veux, mais Trace doit d’abord servir à tracer les appels LLM.



4\. ValidationReport



Vérifie que ValidationReport peut stocker :

\- validation par tâche

\- validation finale projet



Il ne doit pas être limité par un @unique qui empêcherait plusieurs rapports de validation par projet ou par tâche.



5\. Migration



Comme la base est encore en développement local et sans données métier réelles, tu peux proposer un reset si nécessaire.



Commandes attendues :

pnpm prisma migrate reset --force --skip-seed

pnpm prisma migrate dev --name align\_knowledgechunk\_and\_core\_agents

pnpm prisma generate

pnpm db:seed

pnpm typecheck

pnpm lint



Rapport final attendu :

1\. Confirmation que Knowledge et Chunk ont été remplacés par KnowledgeChunk.

2\. Confirmation que les 7 agents seedés sont exactement :

&nbsp;  - Coordinator

&nbsp;  - Analyst

&nbsp;  - Architect

&nbsp;  - Researcher

&nbsp;  - Writer

&nbsp;  - Critic

&nbsp;  - Integrator

3\. Confirmation que Trace contient bien les champs LLM.

4\. Confirmation que ValidationReport accepte plusieurs rapports.

5\. Résultat migrate/reset.

6\. Résultat typecheck.

7\. Résultat lint.

8\. Confirmation que la Phase 3 Runtime Analyst peut démarrer.

