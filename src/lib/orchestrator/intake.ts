import { z } from "zod";

export const IntakeInputSchema = z.object({
  title: z.string().min(3).max(200),
  brief: z.string().min(20).max(10_000),
});

export function buildProjectSpecContent(input: z.infer<typeof IntakeInputSchema>) {
  const parsed = IntakeInputSchema.parse(input);

  return {
    title: parsed.title,
    brief: parsed.brief,
    objectives: [parsed.title],
    constraints: [],
    deliverables: ["Livrable final Markdown"],
    status: "DRAFT",
  };
}
