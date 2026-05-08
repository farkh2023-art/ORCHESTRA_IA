"use client";

import { SavoirButton } from "@/components/savoir/SavoirButton";
import { SavoirCard } from "@/components/savoir/SavoirCard";

function stringifyReport(report: unknown): string {
  if (!report) return "";
  if (typeof report === "string") return report;
  if (typeof report === "object" && "markdown" in report && typeof report.markdown === "string") {
    return report.markdown;
  }
  return JSON.stringify(report, null, 2);
}

export function FinalReportViewer({ finalOutput }: { finalOutput: unknown }) {
  const markdown = stringifyReport(finalOutput);

  function copyMarkdown() {
    void navigator.clipboard?.writeText(markdown);
  }

  function downloadMarkdown() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "orchestra-report.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <SavoirCard className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-xl font-semibold">Rapport final</h2>
        <div className="flex gap-2">
          <SavoirButton type="button" variant="secondary" onClick={copyMarkdown}>
            Copier
          </SavoirButton>
          <SavoirButton type="button" onClick={downloadMarkdown}>
            Markdown
          </SavoirButton>
        </div>
      </div>
      <pre className="mt-5 max-h-[70vh] overflow-auto rounded-lg bg-black/35 p-4 font-mono text-sm leading-6 text-white/78">
        {markdown || "Aucun rapport final disponible."}
      </pre>
    </SavoirCard>
  );
}
