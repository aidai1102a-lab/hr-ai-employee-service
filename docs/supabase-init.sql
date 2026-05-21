-- Supabase SQL Editor 初始化脚本
-- 用法：Supabase Project -> SQL Editor -> New query -> 粘贴全部内容 -> Run

create extension if not exists vector;
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

do $$ begin
  create type "Role" as enum ('ADMIN','HR','MANAGER','SUPPORT','EMPLOYEE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "ChatStatus" as enum ('ACTIVE','ARCHIVED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "MessageRole" as enum ('USER','ASSISTANT','SYSTEM','TOOL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "FileStatus" as enum ('UPLOADED','PROCESSING','READY','FAILED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "AgentType" as enum ('HR_POLICY','PAYROLL','LEAVE','ONBOARDING','VISA','TRAINING','IT_SUPPORT','FINANCE','ADMIN_SERVICE','LEGAL','GENERAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "SupportDepartment" as enum ('HR','IT','FINANCE','ADMIN','LEGAL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "TicketStatus" as enum ('OPEN','PENDING','IN_PROGRESS','RESOLVED','CLOSED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "TicketPriority" as enum ('LOW','MEDIUM','HIGH','URGENT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "KnowledgeVisibility" as enum ('EMPLOYEE','MANAGER','HR_ONLY','ADMIN_ONLY');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "NotificationChannel" as enum ('SYSTEM','EMAIL','DINGTALK');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "NotificationStatus" as enum ('PENDING','SENT','FAILED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "ReportType" as enum ('WEEKLY','MONTHLY');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "ReportStatus" as enum ('QUEUED','RUNNING','READY','FAILED');
exception when duplicate_object then null; end $$;

create table if not exists "User" (
  "id" text primary key default gen_random_uuid()::text,
  "email" text unique not null,
  "name" text not null,
  "passwordHash" text not null,
  "role" "Role" not null default 'EMPLOYEE',
  "country" text not null default 'CN',
  "department" text,
  "isActive" boolean not null default true,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);

create table if not exists "Chat" (
  "id" text primary key default gen_random_uuid()::text,
  "title" text not null,
  "status" "ChatStatus" not null default 'ACTIVE',
  "agent" "AgentType" not null default 'GENERAL',
  "userId" text not null references "User"("id") on delete cascade,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);

create table if not exists "Message" (
  "id" text primary key default gen_random_uuid()::text,
  "role" "MessageRole" not null,
  "content" text not null,
  "citations" jsonb,
  "metadata" jsonb,
  "chatId" text not null references "Chat"("id") on delete cascade,
  "userId" text references "User"("id") on delete set null,
  "createdAt" timestamp(3) not null default now()
);

create table if not exists "KnowledgeFile" (
  "id" text primary key default gen_random_uuid()::text,
  "name" text not null,
  "originalName" text not null,
  "mimeType" text not null,
  "size" integer not null,
  "path" text not null,
  "category" text not null default 'General',
  "tags" text[] not null default '{}',
  "country" text not null default 'GLOBAL',
  "department" "SupportDepartment" not null default 'HR',
  "visibility" "KnowledgeVisibility" not null default 'EMPLOYEE',
  "status" "FileStatus" not null default 'UPLOADED',
  "checksum" text,
  "uploadedBy" text,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);

create table if not exists "KnowledgeChunk" (
  "id" text primary key default gen_random_uuid()::text,
  "content" text not null,
  "chunkIndex" integer not null,
  "tokenCount" integer not null,
  "metadata" jsonb,
  "fileId" text not null references "KnowledgeFile"("id") on delete cascade,
  "createdAt" timestamp(3) not null default now()
);

create table if not exists "Embedding" (
  "id" text primary key default gen_random_uuid()::text,
  "model" text not null,
  "vector" vector(3072) not null,
  "chunkId" text unique not null references "KnowledgeChunk"("id") on delete cascade,
  "createdAt" timestamp(3) not null default now()
);

create table if not exists "Prompt" (
  "id" text primary key default gen_random_uuid()::text,
  "key" text unique not null,
  "name" text not null,
  "content" text not null,
  "role" "AgentType" not null default 'GENERAL',
  "country" text not null default 'GLOBAL',
  "isActive" boolean not null default true,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);

create table if not exists "Feedback" (
  "id" text primary key default gen_random_uuid()::text,
  "rating" integer not null,
  "stars" integer,
  "comment" text,
  "messageId" text unique not null references "Message"("id") on delete cascade,
  "userId" text not null references "User"("id") on delete cascade,
  "createdAt" timestamp(3) not null default now()
);

create table if not exists "SupportTicket" (
  "id" text primary key default gen_random_uuid()::text,
  "title" text not null,
  "description" text not null,
  "status" "TicketStatus" not null default 'OPEN',
  "priority" "TicketPriority" not null default 'MEDIUM',
  "department" "SupportDepartment" not null,
  "slaDueAt" timestamp(3) not null,
  "resolvedAt" timestamp(3),
  "chatId" text references "Chat"("id") on delete set null,
  "requesterId" text not null references "User"("id") on delete cascade,
  "assigneeId" text references "User"("id") on delete set null,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);

create table if not exists "TicketMessage" (
  "id" text primary key default gen_random_uuid()::text,
  "content" text not null,
  "isInternal" boolean not null default false,
  "ticketId" text not null references "SupportTicket"("id") on delete cascade,
  "authorId" text not null references "User"("id") on delete cascade,
  "createdAt" timestamp(3) not null default now()
);

create table if not exists "Notification" (
  "id" text primary key default gen_random_uuid()::text,
  "channel" "NotificationChannel" not null,
  "status" "NotificationStatus" not null default 'PENDING',
  "title" text not null,
  "content" text not null,
  "target" text,
  "metadata" jsonb,
  "userId" text references "User"("id") on delete set null,
  "createdAt" timestamp(3) not null default now(),
  "sentAt" timestamp(3)
);

create table if not exists "DingTalkAccount" (
  "id" text primary key default gen_random_uuid()::text,
  "unionId" text unique not null,
  "openId" text,
  "staffId" text,
  "corpId" text,
  "nick" text,
  "avatar" text,
  "userId" text unique references "User"("id") on delete set null,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);

create table if not exists "AiReport" (
  "id" text primary key default gen_random_uuid()::text,
  "type" "ReportType" not null,
  "status" "ReportStatus" not null default 'QUEUED',
  "title" text not null,
  "summary" text,
  "metrics" jsonb,
  "fileUrl" text,
  "createdAt" timestamp(3) not null default now(),
  "updatedAt" timestamp(3) not null default now()
);

create table if not exists "AuditLog" (
  "id" text primary key default gen_random_uuid()::text,
  "action" text not null,
  "entity" text not null,
  "entityId" text,
  "metadata" jsonb,
  "userId" text references "User"("id") on delete set null,
  "ip" text,
  "createdAt" timestamp(3) not null default now()
);

create index if not exists "Chat_userId_updatedAt_idx" on "Chat"("userId","updatedAt");
create index if not exists "Message_chatId_createdAt_idx" on "Message"("chatId","createdAt");
create index if not exists "KnowledgeFile_department_category_country_idx" on "KnowledgeFile"("department","category","country");
create index if not exists "KnowledgeChunk_fileId_chunkIndex_idx" on "KnowledgeChunk"("fileId","chunkIndex");
create index if not exists "SupportTicket_department_status_slaDueAt_idx" on "SupportTicket"("department","status","slaDueAt");
create index if not exists embedding_vector_hnsw_idx on "Embedding" using hnsw ("vector" vector_cosine_ops);
create index if not exists knowledge_chunk_content_trgm_idx on "KnowledgeChunk" using gin ("content" gin_trgm_ops);

insert into "User" ("email", "name", "passwordHash", "role", "country")
values
  ('admin@company.com', 'HR Admin', '$2b$12$FvxNtut6PfkZcck2P55hTOhtUfxDTvYH7FwJuj1ZKck7b8y9E7gaO', 'ADMIN', 'CN'),
  ('employee@company.com', 'Test Employee', '$2b$12$MoAWU8glbR7WbfKC6wSlQ.8imX9qvXJrclRufyG/ZI/HAo6CEOPXq', 'EMPLOYEE', 'CN')
on conflict ("email") do nothing;

insert into "Prompt" ("key", "name", "content", "role", "country")
values (
  'default_hr_assistant',
  'Default HR AI Assistant',
  '你是公司内部员工服务 AI 助手。只能依据知识库回答，不确定时明确说明并建议转人工。回答要专业、友好、简洁，并标注来源。',
  'GENERAL',
  'GLOBAL'
) on conflict ("key") do nothing;

