-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "AgentSlug" AS ENUM ('COORDINATOR', 'ANALYST', 'ARCHITECT', 'RESEARCHER', 'WRITER', 'CRITIC', 'INTEGRATOR');

-- CreateEnum
CREATE TYPE "AgentInstanceStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT', 'TOOL');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('TASK', 'FILE', 'URL', 'MANUAL');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdById" TEXT,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSpec" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "content" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTemplate" (
    "id" TEXT NOT NULL,
    "slug" "AgentSlug" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "systemPrompt" TEXT NOT NULL,
    "pipelineOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentInstance" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "AgentInstanceStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "agentInstanceId" TEXT NOT NULL,
    "agentSlug" "AgentSlug" NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "tokensUsed" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "agentInstanceId" TEXT NOT NULL,
    "taskId" TEXT,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "sourceType" "KnowledgeSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trace" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT,
    "agentSlug" "AgentSlug",
    "taskId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tokensIn" INTEGER NOT NULL,
    "tokensOut" INTEGER NOT NULL,
    "costUsd" DOUBLE PRECISION NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "inputHash" TEXT NOT NULL,
    "outputHash" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationReport" (
    "id" TEXT NOT NULL,
    "agentInstanceId" TEXT,
    "taskId" TEXT,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "alignmentScore" DOUBLE PRECISION NOT NULL,
    "issues" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "approved" BOOLEAN NOT NULL,
    "rejectedOutputs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ValidationReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");

-- CreateIndex
CREATE INDEX "Project_createdById_idx" ON "Project"("createdById");

-- CreateIndex
CREATE INDEX "ProjectSpec_projectId_version_idx" ON "ProjectSpec"("projectId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "AgentTemplate_slug_key" ON "AgentTemplate"("slug");

-- CreateIndex
CREATE INDEX "AgentTemplate_pipelineOrder_idx" ON "AgentTemplate"("pipelineOrder");

-- CreateIndex
CREATE INDEX "AgentInstance_projectId_idx" ON "AgentInstance"("projectId");

-- CreateIndex
CREATE INDEX "AgentInstance_status_idx" ON "AgentInstance"("status");

-- CreateIndex
CREATE INDEX "Task_agentInstanceId_agentSlug_idx" ON "Task"("agentInstanceId", "agentSlug");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Message_agentInstanceId_idx" ON "Message"("agentInstanceId");

-- CreateIndex
CREATE INDEX "Message_taskId_idx" ON "Message"("taskId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_organizationId_idx" ON "KnowledgeChunk"("organizationId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_projectId_idx" ON "KnowledgeChunk"("projectId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_sourceType_sourceId_idx" ON "KnowledgeChunk"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "Trace_organizationId_idx" ON "Trace"("organizationId");

-- CreateIndex
CREATE INDEX "Trace_projectId_idx" ON "Trace"("projectId");

-- CreateIndex
CREATE INDEX "Trace_taskId_idx" ON "Trace"("taskId");

-- CreateIndex
CREATE INDEX "Trace_agentSlug_idx" ON "Trace"("agentSlug");

-- CreateIndex
CREATE INDEX "ValidationReport_agentInstanceId_idx" ON "ValidationReport"("agentInstanceId");

-- CreateIndex
CREATE INDEX "ValidationReport_taskId_idx" ON "ValidationReport"("taskId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSpec" ADD CONSTRAINT "ProjectSpec_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentInstance" ADD CONSTRAINT "AgentInstance_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_agentInstanceId_fkey" FOREIGN KEY ("agentInstanceId") REFERENCES "AgentInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_agentSlug_fkey" FOREIGN KEY ("agentSlug") REFERENCES "AgentTemplate"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_agentInstanceId_fkey" FOREIGN KEY ("agentInstanceId") REFERENCES "AgentInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trace" ADD CONSTRAINT "Trace_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationReport" ADD CONSTRAINT "ValidationReport_agentInstanceId_fkey" FOREIGN KEY ("agentInstanceId") REFERENCES "AgentInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationReport" ADD CONSTRAINT "ValidationReport_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

