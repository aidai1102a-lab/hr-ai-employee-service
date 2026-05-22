"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = ["年假怎么算？", "报销多久到款？", "电脑坏了怎么办？", "钉钉机器人怎么配置？"];

const answers: Record<string, string> = {
  年假: "年假问题已路由到 Leave Agent。Demo 规则：员工可提交年假申请，主管审批后生效；正式版会展示余额、适用地区、政策来源和申请入口。",
  报销: "报销问题已路由到 Finance Agent。Demo 流程：上传发票和申请单后，财务审核进入付款流程；正式版可按费用类型配置审批链。",
  电脑: "电脑、账号、设备问题已路由到 IT Support Agent。建议点击“转人工”创建 IT 工单，并保留聊天记录。",
  入职: "入职流程已路由到 Onboarding Agent。Demo 流程包括资料收集、合同签署、设备领取、入职培训和试用期提醒。",
  离职: "离职流程 Demo：提交申请后，由 HR、IT、Finance 完成交接、账号关闭、费用结算和证明开具。",
  钉钉: "钉钉集成 Demo 支持群聊 @机器人、单聊、消息卡片、OAuth 登录和转人工工单提醒。",
  签证: "签证和工签问题已路由到 Visa Agent。Demo 会提示需要 HR 根据国家地区和员工身份确认具体政策。"
};

const stats = [
  ["今日咨询", "328", "+18%", "blue"],
  ["AI 解决率", "86%", "+6%", "green"],
  ["转人工率", "9.8%", "-3%", "orange"],
  ["满意度", "4.7/5", "+0.3", "purple"]
];

const agents = [
  ["HR Policy", "制度、员工手册、福利政策", "98", "blue"],
  ["Leave Agent", "年假、病假、调休和余额", "76", "green"],
  ["Finance Agent", "报销、付款、发票规则", "42", "purple"],
  ["IT Support", "电脑、账号、设备故障", "31", "orange"],
  ["Admin Agent", "门禁、办公用品、行政支持", "24", "cyan"]
];

const tickets = [
  ["HR", "年假余额异常", "Open", "SLA 3h", "blue"],
  ["IT", "电脑无法开机", "In Progress", "SLA 1h", "orange"],
  ["Finance", "报销到账时间", "Pending", "SLA 8h", "purple"],
  ["Admin", "门禁权限申请", "Resolved", "已完成", "green"]
];

const knowledge = [
  ["员工手册", "HR", "238 chunks", "已向量化"],
  ["报销制度", "Finance", "89 chunks", "已向量化"],
  ["IT 服务目录", "IT", "64 chunks", "已向量化"],
  ["钉钉 FAQ", "Admin", "41 chunks", "已向量化"]
];

function getAnswer(question: string) {
  const key = Object.keys(answers).find((item) => question.includes(item));
  return key
    ? answers[key]
    : "Demo 知识库没有找到明确答案。你可以点击“转人工”，系统会创建工单并分配到 HR / IT / Finance / Admin 支持部门。";
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "你好，我是芽宝，智慧芽员工服务 AI 助手。你可以问我：年假怎么算、报销多久到账、电脑坏了怎么办、入职流程、钉钉机器人配置。"
    }
  ]);
  const [input, setInput] = useState("");
  const [rating, setRating] = useState(0);
  const [companyName, setCompanyName] = useState("智慧芽");
  const [logoUrl, setLogoUrl] = useState("/brand-logo.svg");
  const [mascotUrl, setMascotUrl] = useState("/yabao.svg");

  function send(text = input) {
    const question = text.trim();
    if (!question) return;
    setMessages((items) => [
      ...items,
      { role: "user", content: question },
      { role: "assistant", content: getAnswer(question) }
    ]);
    setInput("");
  }

  return (
    <main className="portal">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-image" src={logoUrl || "/brand-logo.svg"} alt={`${companyName} logo`} />
        </div>

        <nav className="nav">
          {["AI 服务台", "知识库", "工单中心", "Agent 路由", "数据分析", "钉钉集成", "品牌配置"].map((item, index) => (
            <a key={item} href={`#section-${index}`}>
              {item}
            </a>
          ))}
        </nav>

        <div className="sidebar-card">
          <span>当前版本</span>
          <strong>Demo Preview</strong>
          <p>可演示、可点击、不消耗 AI 额度。</p>
        </div>
      </aside>

      <section className="content">
        <header className="hero">
          <section className="hero-copy">
            <div className="eyebrow">AI + HR + IT + Finance + Admin</div>
            <h1>{companyName} 员工智能服务门户</h1>
            <p>
              一个面向员工的 AI 服务入口：政策咨询、知识库检索、钉钉问答、转人工工单、满意度反馈和管理数据看板。
            </p>
            <div className="hero-actions">
              <a href="#section-0">开始咨询</a>
              <a className="secondary" href="#section-5">
                配置钉钉
              </a>
            </div>
          </section>

          <section className="mascot-card">
            <div className="mascot-stage">
              <img className="mascot-image" src={mascotUrl || "/yabao.svg"} alt="芽宝" />
            </div>
            <div>
              <strong>芽宝在线</strong>
              <p>欢迎咨询 HR 政策、IT 支持、报销流程和员工服务问题。</p>
            </div>
          </section>
        </header>

        <section className="stats-grid">
          {stats.map(([label, value, trend, tone]) => (
            <div className={`stat-card ${tone}`} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <em>{trend}</em>
            </div>
          ))}
        </section>

        <div className="main-grid">
          <section id="section-0" className="panel chat-panel">
            <div className="panel-header">
              <div>
                <h2>AI 员工服务台</h2>
                <p>模拟 RAG 问答、来源引用、满意度评分和转人工入口</p>
              </div>
              <span className="status-pill">Live Demo</span>
            </div>

            <div className="chat-window">
              {messages.map((message, index) => (
                <div key={index} className={`message-row ${message.role}`}>
                  <div className="message-bubble">
                    {message.content}
                    {message.role === "assistant" ? (
                      <div className="source-line">来源：员工手册 Demo / HR 政策 Demo / 智慧芽知识库</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="quick-prompts">
              {suggestions.map((item) => (
                <button key={item} onClick={() => send(item)}>
                  {item}
                </button>
              ))}
            </div>

            <div className="composer">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && send()}
                placeholder="输入员工问题，例如：年假怎么算？"
              />
              <button onClick={() => send()}>发送</button>
              <button className="handoff">转人工</button>
            </div>

            <div className="rating-row">
              <span>满意度：</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className={star <= rating ? "active" : ""}>
                  ★
                </button>
              ))}
            </div>
          </section>

          <section id="section-3" className="panel">
            <div className="panel-header compact">
              <h2>Agent 路由</h2>
              <span className="status-pill green">自动识别</span>
            </div>
            <div className="agent-list">
              {agents.map(([name, desc, count, tone]) => (
                <div className="agent-item" key={name}>
                  <span className={`agent-mark ${tone}`} />
                  <div>
                    <strong>{name}</strong>
                    <p>{desc}</p>
                  </div>
                  <em>{count}</em>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section id="section-1" className="panel">
          <div className="panel-header">
            <div>
              <h2>知识库管理</h2>
              <p>按部门管理 HR、IT、Finance、Admin、Legal 文件</p>
            </div>
            <button className="primary-light">上传文件</button>
          </div>
          <div className="knowledge-grid">
            {knowledge.map(([name, dept, chunks, status]) => (
              <div className="knowledge-card" key={name}>
                <div className="doc-icon">DOC</div>
                <strong>{name}</strong>
                <p>
                  {dept} · {chunks}
                </p>
                <span>{status}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="section-2" className="panel">
          <div className="panel-header">
            <div>
              <h2>Support Ticket 工单中心</h2>
              <p>AI 无法回答或员工不满意时，自动转人工并分配部门</p>
            </div>
            <span className="status-pill orange">SLA Tracking</span>
          </div>
          <div className="ticket-grid">
            {tickets.map(([dept, title, status, sla, tone]) => (
              <div className="ticket-card" key={title}>
                <span className={tone}>{dept}</span>
                <strong>{title}</strong>
                <div>
                  <em>{status}</em>
                  <small>{sla}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="bottom-grid">
          <section id="section-4" className="panel analytics-panel">
            <div className="panel-header compact">
              <h2>Analytics 看板</h2>
              <span className="status-pill purple">Weekly Report</span>
            </div>
            <div className="bar-list">
              {[
                ["HR 政策咨询", "72%"],
                ["IT 支持", "48%"],
                ["报销付款", "39%"],
                ["入职离职", "28%"]
              ].map(([label, width]) => (
                <div className="bar-row" key={label}>
                  <div>
                    <span>{label}</span>
                    <em>{width}</em>
                  </div>
                  <div className="bar-track">
                    <span style={{ width }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="section-5" className="panel dingtalk-panel">
            <div className="panel-header compact">
              <h2>钉钉机器人</h2>
              <span className="status-pill blue">Webhook Ready</span>
            </div>
            <div className="integration-card">
              <div className="ding-icon">钉</div>
              <div>
                <strong>群聊 @芽宝机器人</strong>
                <p>支持单聊、群聊、消息卡片、快捷按钮、OAuth 登录。</p>
              </div>
            </div>
            <code>/api/dingtalk/webhook</code>
            <code>/api/dingtalk/oauth</code>
          </section>

          <section id="section-6" className="panel brand-config">
            <div className="panel-header compact">
              <h2>品牌配置</h2>
              <span className="status-pill green">可替换</span>
            </div>
            <label>
              公司名称
              <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
            </label>
            <label>
              Logo 图片 URL
              <input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} />
            </label>
            <label>
              芽宝图片 URL
              <input value={mascotUrl} onChange={(event) => setMascotUrl(event.target.value)} />
            </label>
          </section>
        </div>
      </section>
    </main>
  );
}
