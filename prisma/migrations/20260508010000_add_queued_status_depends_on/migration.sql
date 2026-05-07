-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'QUEUED';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "dependsOn" TEXT[] DEFAULT ARRAY[]::TEXT[];
