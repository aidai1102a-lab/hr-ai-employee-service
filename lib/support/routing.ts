import { AgentType, SupportDepartment, TicketPriority } from "@prisma/client";
import { routeAgent } from "@/lib/ai/agents";

export function departmentFromQuestion(question: string): SupportDepartment {
  const agent = routeAgent(question);
  const map: Partial<Record<AgentType, SupportDepartment>> = {
    HR_POLICY: SupportDepartment.HR,
    PAYROLL: SupportDepartment.FINANCE,
    LEAVE: SupportDepartment.HR,
    ONBOARDING: SupportDepartment.HR,
    VISA: SupportDepartment.HR,
    TRAINING: SupportDepartment.HR,
    IT_SUPPORT: SupportDepartment.IT,
    FINANCE: SupportDepartment.FINANCE,
    ADMIN_SERVICE: SupportDepartment.ADMIN,
    LEGAL: SupportDepartment.LEGAL
  };
  return map[agent] ?? SupportDepartment.HR;
}

export function priorityFromQuestion(question: string): TicketPriority {
  const text = question.toLowerCase();
  if (["紧急", "无法工作", "宕机", "urgent", "blocked"].some((word) => text.includes(word))) return TicketPriority.URGENT;
  if (["今天", "马上", "严重", "high"].some((word) => text.includes(word))) return TicketPriority.HIGH;
  return TicketPriority.MEDIUM;
}

export function slaDueAt(priority: TicketPriority) {
  const hours = {
    LOW: 72,
    MEDIUM: 48,
    HIGH: 24,
    URGENT: 4
  }[priority];
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

