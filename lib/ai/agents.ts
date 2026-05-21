import { AgentType } from "@prisma/client";

const agentKeywords: Record<AgentType, string[]> = {
  HR_POLICY: ["制度", "政策", "员工手册", "合规", "policy", "handbook"],
  PAYROLL: ["薪资", "工资", "社保", "个税", "payroll", "salary", "bonus"],
  LEAVE: ["请假", "年假", "病假", "调休", "假期", "leave", "vacation"],
  ONBOARDING: ["入职", "离职", "转正", "onboarding", "offboarding", "probation"],
  VISA: ["签证", "工签", "居留", "visa", "work permit"],
  TRAINING: ["培训", "学习", "课程", "training", "learning"],
  IT_SUPPORT: ["电脑", "网络", "vpn", "邮箱", "设备", "故障", "it", "laptop", "wifi"],
  FINANCE: ["报销", "发票", "付款", "预算", "finance", "expense", "reimbursement"],
  ADMIN_SERVICE: ["工位", "门禁", "办公用品", "快递", "会议室", "admin", "facility"],
  LEGAL: ["合同", "法务", "保密", "合规审查", "legal", "nda"],
  GENERAL: []
};

export function routeAgent(question: string): AgentType {
  const lower = question.toLowerCase();
  const ranked = Object.entries(agentKeywords)
    .filter(([agent]) => agent !== "GENERAL")
    .map(([agent, words]) => ({
      agent: agent as AgentType,
      score: words.reduce((sum, word) => sum + (lower.includes(word.toLowerCase()) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score ? ranked[0].agent : AgentType.GENERAL;
}

export function agentLabel(agent: AgentType) {
  const labels: Record<AgentType, string> = {
    HR_POLICY: "HR 政策 Agent",
    PAYROLL: "Payroll Agent",
    LEAVE: "Leave Agent",
    ONBOARDING: "Onboarding Agent",
    VISA: "Visa Agent",
    TRAINING: "Training Agent",
    IT_SUPPORT: "IT Support Agent",
    FINANCE: "Finance Agent",
    ADMIN_SERVICE: "Admin Service Agent",
    LEGAL: "Legal Agent",
    GENERAL: "General HR Agent"
  };
  return labels[agent];
}
