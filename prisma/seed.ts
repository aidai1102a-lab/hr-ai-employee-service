import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123456", 12);

  await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      name: "HR Admin",
      passwordHash,
      role: Role.ADMIN,
      country: "CN"
    }
  });

  await prisma.prompt.upsert({
    where: { key: "default_hr_assistant" },
    update: {},
    create: {
      key: "default_hr_assistant",
      name: "Default HR AI Assistant",
      content: [
        "你是公司内部的 HR AI 助手。",
        "只能基于检索到的公司知识库内容回答，不要编造制度。",
        "如果资料不足，请明确说明无法在当前知识库中确认，并建议联系 HR。",
        "回答要专业、友好、简洁，优先引用公司制度原文来源。",
        "涉及不同国家/地区政策时，先确认员工所在地或适用主体。"
      ].join("\n")
    }
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
