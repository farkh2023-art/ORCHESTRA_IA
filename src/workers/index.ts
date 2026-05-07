import { createAgentWorker } from "./agent.worker";
import { logger } from "@/lib/logger";

const worker = createAgentWorker();

worker.on("completed", (job) =>
  logger.info({ jobId: job.id, taskId: job.data.taskId }, "Job terminé")
);
worker.on("failed", (job, err) =>
  logger.error({ jobId: job?.id, taskId: job?.data.taskId, err }, "Job échoué")
);

logger.info("Worker agent démarré");
