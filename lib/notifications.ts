import { NotificationChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendDingTalkRobotMessage } from "@/lib/integrations/dingtalk";

export async function notify(input: {
  channel: NotificationChannel;
  title: string;
  content: string;
  target?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}) {
  const notification = await prisma.notification.create({
    data: {
      channel: input.channel,
      title: input.title,
      content: input.content,
      target: input.target,
      userId: input.userId,
      metadata: input.metadata
    }
  });

  try {
    if (input.channel === NotificationChannel.DINGTALK) {
      await sendDingTalkRobotMessage({
        text: `### ${input.title}\n${input.content}`,
        webhook: input.target
      });
    }
    return prisma.notification.update({
      where: { id: notification.id },
      data: { status: "SENT", sentAt: new Date() }
    });
  } catch (error) {
    return prisma.notification.update({
      where: { id: notification.id },
      data: { status: "FAILED", metadata: { ...(input.metadata ?? {}), error: error instanceof Error ? error.message : String(error) } }
    });
  }
}

