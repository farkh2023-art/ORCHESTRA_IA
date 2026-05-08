import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("Phase 10 UI contracts", () => {
  it("FinalReportViewer expose téléchargement Markdown, JSON et impression", () => {
    const source = read("src/components/projects/FinalReportViewer.tsx");
    expect(source).toContain("downloadMarkdown");
    expect(source).toContain("downloadJson");
    expect(source).toContain("window.print");
  });

  it("FinalReportViewer marque la barre d'outils no-print et le contenu report-print", () => {
    const source = read("src/components/projects/FinalReportViewer.tsx");
    expect(source).toContain("no-print");
    expect(source).toContain("report-print");
  });

  it("la page rapport intègre FinalReportViewer et le titre du projet", () => {
    const source = read("src/app/projects/[id]/report/page.tsx");
    expect(source).toContain("FinalReportViewer");
    expect(source).toContain("project.title");
  });

  it("llmMock couvre les 7 rôles agents avec leurs schémas Zod", () => {
    const source = read("src/lib/llmMock.ts");
    for (const role of ["COORDINATOR", "ANALYST", "ARCHITECT", "RESEARCHER", "WRITER", "CRITIC", "INTEGRATOR"]) {
      expect(source).toContain(role);
    }
  });

  it("base agent supporte MOCK_LLM env var et importe MOCK_LLM_RESPONSES", () => {
    const source = read("src/agents/base.ts");
    expect(source).toContain("MOCK_LLM");
    expect(source).toContain("MOCK_LLM_RESPONSES");
    expect(source).toContain("Agent termine OK [MOCK_LLM]");
  });

  it("globals.css contient les règles @media print pour impression rapport", () => {
    const source = read("src/app/globals.css");
    expect(source).toContain("@media print");
    expect(source).toContain("no-print");
    expect(source).toContain("report-print");
  });

  it("CLAUDE.md existe et documente le projet", () => {
    const source = read("CLAUDE.md");
    expect(source).toContain("ORCHESTRA_IA");
    expect(source).toContain("MOCK_LLM");
    expect(source).toContain("pnpm");
  });
});
