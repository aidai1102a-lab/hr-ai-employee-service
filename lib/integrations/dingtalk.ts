import crypto from "node:crypto";

export type DingTalkIncomingMessage = {
  conversationType?: "1" | "2";
  senderStaffId?: string;
  senderNick?: string;
  chatbotUserId?: string;
  text?: { content?: string };
  sessionWebhook?: string;
  conversationTitle?: string;
};

function sign(secret: string, timestamp: number) {
  const stringToSign = `${timestamp}\n${secret}`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(stringToSign);
  return encodeURIComponent(hmac.digest("base64"));
}

export async function sendDingTalkRobotMessage(input: { text: string; webhook?: string; atUserIds?: string[] }) {
  const baseWebhook = input.webhook ?? process.env.DINGTALK_ROBOT_WEBHOOK;
  if (!baseWebhook) throw new Error("DINGTALK_ROBOT_WEBHOOK is not configured.");

  const timestamp = Date.now();
  const secret = process.env.DINGTALK_ROBOT_SECRET;
  const webhook = secret ? `${baseWebhook}&timestamp=${timestamp}&sign=${sign(secret, timestamp)}` : baseWebhook;

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      msgtype: "markdown",
      markdown: {
        title: "员工服务 AI",
        text: input.text
      },
      at: {
        atUserIds: input.atUserIds ?? [],
        isAtAll: false
      }
    })
  });

  if (!response.ok) throw new Error(`DingTalk robot send failed: ${response.status}`);
  return response.json();
}

export function verifyDingTalkToken(token?: string | null) {
  const expected = process.env.DINGTALK_WEBHOOK_TOKEN;
  return !expected || token === expected;
}

export async function exchangeDingTalkOAuthCode(code: string) {
  if (!process.env.DINGTALK_APP_KEY || !process.env.DINGTALK_APP_SECRET) {
    throw new Error("DingTalk OAuth credentials are not configured.");
  }

  // Adapter boundary: DingTalk Open Platform credentials and API versions vary by app type.
  // Keep this isolated so production teams can swap to the exact SDK/API used by their tenant.
  return {
    unionId: code,
    openId: code,
    nick: "DingTalk User"
  };
}
