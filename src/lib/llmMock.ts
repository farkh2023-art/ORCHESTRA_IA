import type { AgentRole } from "@prisma/client";

// Réponses valides par rôle pour MOCK_LLM=true — satisfont les schémas Zod de chaque agent
export const MOCK_LLM_RESPONSES: Record<AgentRole, unknown> = {
  COORDINATOR: {
    objectives: ["Analyser le brief et produire un plan d'exécution structuré"],
    constraints: ["Budget limité", "Délai de deux semaines"],
    deliverables: ["Document de spécification", "Plan d'exécution agentique"],
    executionPlan: [
      { step: 1, agent: "ANALYST", task: "Analyse SWOT et identification des risques" },
      { step: 2, agent: "ARCHITECT", task: "Conception de l'architecture technique" },
      { step: 3, agent: "RESEARCHER", task: "Recherche documentaire et état de l'art" },
      { step: 4, agent: "WRITER", task: "Rédaction du rapport final", dependsOn: [1, 2, 3] },
      { step: 5, agent: "CRITIC", task: "Validation du rapport", dependsOn: [4] },
      { step: 6, agent: "INTEGRATOR", task: "Intégration et livraison", dependsOn: [5] },
    ],
    humanCheckpoints: [{ afterStep: 3, reason: "Validation humaine du plan avant rédaction" }],
    complexity: "MEDIUM",
    gaps: ["Données historiques manquantes"],
  },

  ANALYST: {
    swot: {
      strengths: ["Équipe expérimentée", "Technologie éprouvée"],
      weaknesses: ["Budget serré", "Délai court"],
      opportunities: ["Marché en croissance", "Partenariats potentiels"],
      threats: ["Concurrence active", "Risques réglementaires"],
    },
    risks: [
      { description: "Retard de livraison", severity: "MEDIUM", mitigation: "Planification avec buffer 20%" },
    ],
    opportunities: ["Expansion internationale possible", "ROI estimé à 6 mois"],
    kpis: [{ name: "Délai livraison", target: "14 jours", measurement: "Date de mise en production" }],
    assumptions: ["Budget approuvé par la direction", "Équipe disponible à 80%"],
    gaps: ["Données marché Q3 manquantes"],
    researchPriorities: ["Analyse concurrentielle", "Benchmark technologique", "Veille réglementaire"],
  },

  ARCHITECT: {
    components: [
      { name: "Frontend", responsibility: "Interface utilisateur et interactions", technology: "Next.js 15" },
      { name: "Backend API", responsibility: "Logique métier et orchestration", technology: "Node.js" },
      { name: "Base de données", responsibility: "Persistance et requêtes vectorielles", technology: "PostgreSQL + pgvector" },
      { name: "File d'agents", responsibility: "Exécution asynchrone des agents", technology: "BullMQ + Redis" },
    ],
    interactions: [
      { from: "Frontend", to: "Backend API", type: "sync" },
      { from: "Backend API", to: "Base de données", type: "sync" },
      { from: "Backend API", to: "File d'agents", type: "async" },
    ],
    technicalChoices: [
      { option: "Next.js App Router", rationale: "SSR natif et server components", tradeoffs: "Complexité initiale plus élevée" },
      { option: "BullMQ", rationale: "File de tâches robuste avec Redis", tradeoffs: "Dépendance Redis" },
    ],
    architecturalRisks: [
      { risk: "Scalabilité des workers", severity: "LOW", mitigation: "Scaling horizontal des workers BullMQ" },
    ],
    implementationPhases: [
      { phase: 1, description: "Infrastructure et base de données", components: ["Base de données", "Backend API"] },
      { phase: 2, description: "Interface utilisateur", components: ["Frontend"] },
      { phase: 3, description: "Déploiement des agents", components: ["File d'agents"] },
    ],
    assumptions: ["Cloud provider disponible", "CI/CD configuré"],
  },

  RESEARCHER: {
    findings: [
      { topic: "Orchestration multi-agents LLM", summary: "Les frameworks comme LangChain et AutoGen ont démontré la viabilité des pipelines multi-agents. Les approches modulaires avec queues de tâches sont les plus robustes.", reliability: "HIGH" },
      { topic: "Coûts d'inférence Claude", summary: "Claude Sonnet offre le meilleur ratio qualité/coût pour les tâches complexes. Claude Haiku est adapté pour les tâches simples.", reliability: "HIGH" },
    ],
    sources: [
      { title: "Anthropic API Documentation", url: null, date: "2025", type: "official" },
      { title: "BullMQ Documentation", url: null, date: "2024", type: "official" },
    ],
    synthesis: "Les technologies choisies pour ORCHESTRA_IA sont matures, bien documentées et adaptées aux besoins d'orchestration multi-agents à grande échelle.",
    dataGaps: ["Benchmarks de performance en production manquants"],
    recommendations: ["Utiliser les versions LTS stables", "Implémenter un monitoring de coûts dès le début", "Documenter les décisions d'architecture"],
  },

  WRITER: {
    title: "Rapport ORCHESTRA_IA — Analyse et Recommandations [MOCK]",
    sections: [
      {
        heading: "Résumé exécutif",
        content: "Ce rapport présente les résultats de l'analyse complète du projet menée par l'équipe d'agents ORCHESTRA_IA. Les conclusions sont globalement positives : le projet est techniquement viable, les risques sont maîtrisables et le ROI attendu est atteint en 6 mois.",
      },
      {
        heading: "Analyse de situation",
        content: "L'analyse SWOT révèle des forces significatives (équipe expérimentée, technologie éprouvée) contrebalancées par des contraintes temporelles et budgétaires. Les opportunités de marché justifient l'investissement.",
      },
      {
        heading: "Architecture proposée",
        content: "L'architecture retenue s'appuie sur Next.js 15, PostgreSQL avec pgvector, et BullMQ pour l'orchestration asynchrone des agents. Cette stack garantit la scalabilité et la maintenabilité du système.",
      },
      {
        heading: "Recommandations",
        content: "1. Procéder immédiatement à la phase de développement.\n2. Implémenter un monitoring de coûts LLM dès le jour 1.\n3. Mettre en place des checkpoints humains aux étapes critiques.\n4. Prévoir un buffer de 20% sur les délais estimés.",
      },
    ],
    summary: "Projet viable avec ROI à 6 mois. Architecture solide, risques maîtrisés. Recommandation : démarrer le développement avec les technologies proposées.",
    wordCount: 198,
  },

  CRITIC: {
    overallScore: 8.5,
    alignmentScore: 92,
    issues: [
      {
        severity: "LOW",
        description: "La section budget manque de détails chiffrés",
        agent: "WRITER",
        recommendation: "Ajouter un tableau de coûts estimatifs par phase",
      },
    ],
    strengths: [
      "Structure du rapport claire et logique",
      "Recommandations actionnables et priorisées",
      "Alignement fort avec les objectifs initiaux",
      "Risques bien identifiés et mitigations proposées",
    ],
    recommendations: [
      "Compléter la section budget avec des estimations chiffrées",
      "Ajouter des métriques de succès mesurables",
      "Inclure un plan de rollback en cas d'échec",
    ],
    approved: true,
  },

  INTEGRATOR: {
    deliveryPackage: {
      mainReport: "# Rapport Final ORCHESTRA_IA\n\n> Généré en mode mock LLM — `MOCK_LLM=true`\n\n## Résumé Exécutif\n\nL'équipe d'agents ORCHESTRA_IA a complété l'analyse du projet. Les résultats sont positifs et le projet peut passer en phase de développement.\n\n## Points Clés\n\n- **Faisabilité** : Confirmée par l'analyse technique\n- **Délai estimé** : 14 jours\n- **ROI projeté** : 6 mois\n- **Risque principal** : Dérive de délai (mitigé)\n\n## Architecture Recommandée\n\nStack : Next.js 15 + PostgreSQL + BullMQ + Claude\n\n## Prochaines Étapes\n\n1. Valider le budget avec la direction\n2. Démarrer le développement (Phase 1)\n3. Mettre en place le monitoring\n4. Planifier le premier checkpoint humain\n",
      annexes: [
        { id: "annex-swot", title: "Analyse SWOT Détaillée", content: "Forces : équipe expérimentée. Faiblesses : budget serré. Opportunités : marché en croissance. Menaces : concurrence." },
        { id: "annex-arch", title: "Schéma d'Architecture", content: "Frontend (Next.js) → API (Node.js) → DB (PostgreSQL) + Queue (BullMQ/Redis)" },
      ],
      metadata: {
        instanceId: "mock-orchestration-001",
        duration: "0:00:01",
        agentsInvolved: ["COORDINATOR", "ANALYST", "ARCHITECT", "RESEARCHER", "WRITER", "CRITIC"],
        totalTokens: 0,
        estimatedCostUsd: 0,
      },
    },
    integrationLog: [
      { source: "ANALYST", section: "SWOT et risques", status: "integrated" },
      { source: "ARCHITECT", section: "Architecture technique", status: "integrated" },
      { source: "RESEARCHER", section: "État de l'art", status: "integrated" },
      { source: "WRITER", section: "Rapport narratif", status: "integrated" },
      { source: "CRITIC", section: "Validation et scores", status: "integrated" },
    ],
    conflicts: [],
    coverageCheck: { total: 5, covered: 5, missing: [] },
  },
};
