"use client";

import { useMemo, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const answers: Record<string, string> = {
  "年假": "根据员工手册 Demo：员工可在系统中提交年假申请，主管审批后生效。正式上线后会接入真实知识库并显示来源文件。",
  "报销": "报销流程 Demo：员工上传发票和申请单，财务审核后进入付款流程。正式版可按国家、部门和费用类型配置规则。",
  "入职": "入职流程 Demo：HR 创建入职任务，新员工完成资料提交、合同签署、设备领取和培训。",
  "离职": "离职流程 Demo：员工提交离职申请，HR、IT、Finance 依次完成交接、账号关闭和费用结算。",
  "钉钉": "钉钉集成 Demo：这里展示机器人配置入口。正式版可接收钉钉消息、群聊 @机器人、OAuth 登录和消息卡片。",
  "电脑": "已识别为 IT 支持问题。Demo 会建议转人工到 IT 部门；正式版会自动创建工单并跟踪 SLA。"
};

function getAnswer(input: string) {
  const found = Object.keys(answers).find((key) => input.includes(key));
  if (found) return answers[found];
  return "当前 Demo 知识库没有找到明确答案。你可以点击“转人工”，系统会创建工单并分配给对应支持部门。";
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "你好，我是 HR AI 员工服务助手 Demo。你可以问：年假、报销、入职、离职、钉钉、电脑坏了。" }
  ]);
  const [input, setInput] = useState("");
  const [rating, setRating] = useState(0);

  const stats = useMemo(
    () => [
      ["今日咨询", "128"],
      ["AI 解决率", "82%"],
      ["转人工率", "12%"],
      ["满意度", "4.6/5"]
    ],
    []
  );

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((items) => [...items, { role: "user", content: text }, { role: "assistant", content: getAnswer(text) }]);
    setInput("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 lg:block">
        <div className="mb-8">
          <div className="text-lg font-semibold">HR AI Portal</div>
          <div className="text-sm text-slate-500">员工服务门户 Demo</div>
        </div>
        <nav className="space-y-2 text-sm">
          {["AI 咨询", "知识库", "工单中心", "Analytics", "钉钉机器人", "Admin 后台"].map((item, index) => (
            <a key={item} href={`#section-${index}`} className="block rounded-md px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700">
              {item}
            </a>
          ))}
        </nav>
      </aside>

      <section className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">AI + HR + IT + Finance 员工服务门户</h1>
              <p className="text-sm text-slate-500">简单 Demo 版：可打开、可演示、可给老板/同事看</p>
            </div>
            <div className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white">Demo 在线版</div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-6 p-5 xl:grid-cols-[1.4fr_0.8fr]">
          <section id="section-0" className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-4">
              <h2 className="font-semibold">AI 聊天页面</h2>
              <p className="text-sm text-slate-500">模拟 HR 知识库问答、来源提示、转人工入口</p>
            </div>
            <div className="h-[520px] space-y-4 overflow-y-auto p-5">
              {messages.map((message, index) => (
                <div key={index} className={message.role === "user" ? "text-right" : "text-left"}>
                  <div className={`inline-block max-w-[78%] rounded-lg px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                    {message.content}
                    {message.role === "assistant" && <div className="mt-2 text-xs text-slate-500">来源：员工手册 Demo / HR 政策 Demo</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 p-4">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && send()}
                  placeholder="请输入你的问题，例如：年假怎么算？报销多久到账？电脑坏了怎么办？"
                  className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
                <button onClick={send} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">发送</button>
                <button className="rounded-md border border-slate-300 px-4 py-2 text-sm">转人工</button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                满意度：
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => setRating(star)} className={star <= rating ? "text-amber-500" : "text-slate-300"}>★</button>
                ))}
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section id="section-3" className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="mb-4 font-semibold">Analytics Dashboard</h2>
              <div className="grid grid-cols-2 gap-3">
                {stats.map(([label, value]) => (
                  <div key={label} className="rounded-md border border-slate-200 p-3">
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="mt-1 text-2xl font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section id="section-1" className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="font-semibold">知识库上传</h2>
              <div className="mt-4 rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                上传 PDF / Word / Excel / Markdown
                <div className="mt-3 text-xs">Demo 展示入口；正式版会自动分块、向量化、RAG 检索。</div>
              </div>
            </section>

            <section id="section-4" className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="font-semibold">钉钉机器人配置</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="rounded-md bg-slate-100 p-2">Webhook URL：/api/dingtalk/webhook</div>
                <div className="rounded-md bg-slate-100 p-2">OAuth 回调：/api/dingtalk/oauth</div>
              </div>
            </section>
          </div>

          <section id="section-2" className="rounded-lg border border-slate-200 bg-white p-4 xl:col-span-2">
            <h2 className="font-semibold">Support Ticket 工单中心</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                ["HR", "年假余额咨询", "Open"],
                ["IT", "电脑无法开机", "In Progress"],
                ["Finance", "报销付款时间", "Pending"]
              ].map(([dept, title, status]) => (
                <div key={title} className="rounded-md border border-slate-200 p-4">
                  <div className="text-xs text-blue-600">{dept}</div>
                  <div className="mt-1 font-medium">{title}</div>
                  <div className="mt-3 inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{status}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
