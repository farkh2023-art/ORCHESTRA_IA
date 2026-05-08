import type { ProjectStatus } from "@prisma/client";
import { ProjectStatusBadge } from "@/components/projects/ProjectStatusBadge";

export function ProjectHeader({
  title,
  brief,
  status,
}: {
  title: string;
  brief: string;
  status: ProjectStatus | string;
}) {
  return (
    <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-3xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#00E5D1]">Project command</p>
        <h1 className="font-display text-3xl font-bold sm:text-5xl">{title}</h1>
        <p className="mt-4 line-clamp-3 text-base leading-7 text-white/68">{brief}</p>
      </div>
      <ProjectStatusBadge status={status} />
    </section>
  );
}
