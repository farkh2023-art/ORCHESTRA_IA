# SAVOIR_IA / ORCHESTRA_IA

Plateforme d'orchestration multi-agents IA construite avec Next.js 15, Auth.js v5, Prisma, BullMQ et Claude.

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 15.3 App Router, React 19, Tailwind CSS v4 |
| Auth | Auth.js v5 (next-auth beta) + PrismaAdapter |
| DB | PostgreSQL 16 + pgvector via Prisma 6 |
| Queue | BullMQ 5 + Redis 7 |
| Agents | Claude (Anthropic SDK) — Sonnet 4.6 par défaut |
| Tests unitaires | Vitest 4 |
| Tests E2E | Playwright 1.59 + Chromium |

## Démarrage rapide

### Prérequis

- Node.js 20+, pnpm 10+
- Docker (pour PostgreSQL + Redis)

### Installation

```bash
# Démarrer les services
docker compose up -d

# Installer les dépendances
pnpm install

# Appliquer le schéma DB
pnpm prisma db push

# Alimenter les AgentTemplates
pnpm db:seed

# Démarrer le serveur de développement
pnpm dev
```

### Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner :

```bash
DATABASE_URL="postgresql://savoir_ia:savoir_ia_secret@localhost:5432/savoir_ia"
REDIS_URL="redis://localhost:6379"

# Anthropic (obligatoire en production, optionnel avec MOCK_LLM=true)
ANTHROPIC_API_KEY="sk-ant-..."

# Auth.js — générer avec : openssl rand -base64 32
AUTH_SECRET="..."
AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

## Commandes de développement

```bash
pnpm dev           # Serveur Next.js (port 3000)
pnpm worker:dev    # Worker BullMQ avec hot-reload
pnpm typecheck     # Vérification TypeScript
pnpm lint          # ESLint (Next.js ruleset)
pnpm test          # Vitest (tests unitaires, 21 fichiers)
pnpm test:e2e      # Playwright (23 scénarios Chromium)
pnpm test:coverage # Couverture v8
```

## Mode mock LLM

Pour développer sans clé API Anthropic, activer le mode mock :

```bash
# .env.local
MOCK_LLM=true
```

Les agents retournent des réponses prédéfinies valides (conformes aux schémas Zod) sans appeler l'API. Les traces sont enregistrées avec `provider: "mock"` et `costUsd: 0`. Le rapport final généré contient la mention `[MOCK]`.

Réponses mock définies dans `src/lib/llmMock.ts` pour les 7 rôles :
`COORDINATOR`, `ANALYST`, `ARCHITECT`, `RESEARCHER`, `WRITER`, `CRITIC`, `INTEGRATOR`

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (auth, status)
│   ├── actions/            # Server actions (projets, HITL)
│   ├── projects/           # Pages projet (liste, détail, rapport)
│   ├── registry/           # Catalogue des agents
│   ├── sign-in/            # Page d'authentification
│   └── account/            # Page compte utilisateur
├── agents/                 # Implémentation des agents LLM
│   ├── base.ts             # Runner générique (retry, traces, mock)
│   └── analyst.ts          # Agent Analyste (exemple)
├── components/
│   ├── dag/                # Visualisation DAG (React Flow)
│   ├── projects/           # Composants dashboard projet
│   └── savoir/             # Design system SAVOIR_IA
├── lib/
│   ├── auth/               # Tenant (ensureUserOrganization)
│   ├── llm.ts              # Client Anthropic + estimation coûts
│   ├── llmMock.ts          # Réponses mock par rôle agent
│   ├── orchestrator/       # Création projet, DAG, recrutement
│   ├── projects/           # Status polling, ownership
│   └── validation/         # Validateur final
├── middleware.ts            # Garde Auth.js (routes protégées)
├── auth.ts                  # Config Auth.js v5 (providers, adapter)
└── workers/                # BullMQ workers
```

## Multi-tenant

Chaque utilisateur est rattaché à une `Organization` dérivée du domaine de son email (ex. `alice@acme.com` → org `acme-com`). La logique de provisionnement est dans `src/lib/auth/tenant.ts:ensureUserOrganization`.

Les projets et les données sont toujours filtrés par `organizationId`. L'ownership est vérifié avant toute action mutante.

## Rapport final

Le rapport final est généré par l'agent `INTEGRATOR` et stocké dans `Project.finalOutput.markdown`. La page `/projects/[id]/report` offre :
- Rendu du Markdown brut
- Export `.md` (téléchargement)
- Export `.json` (données brutes)
- Impression via `window.print()` avec CSS `@media print`

## Tests

```bash
# Unitaires (node env, sans browser)
pnpm test
# → 22 fichiers, 119 tests

# E2E (Chromium, dev server requis)
pnpm test:e2e
# → 30 tests, parcours authentifié/non-authentifié
```

Les tests unitaires mockent `@/auth`, `@/lib/db` et `@/lib/projects/ownership` via `vi.mock` + `vi.hoisted`. Les tests E2E testent uniquement le parcours non authentifié (redirections middleware) et les pages publiques.
