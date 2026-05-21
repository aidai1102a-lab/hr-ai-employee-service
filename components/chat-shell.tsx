"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, LifeBuoy, Plus, Send, Sparkles } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FeedbackWidget } from "@/components/feedback-widget";

type Citation = { fileName: string; preview: string; score: number; category: string; country: string };
type Message = { id?: string; role: "user" | "assistant"; content: string; citations?: Citation[] };
type Chat = { id: string; title: string };

export function ChatShell() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatId, setChatId] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me").then(async (res) => {
      const data = await res.json();
      if (!data.user) window.location.href = "/login";
    });
    fetch("/api/chats").then((res) => res.json()).then((data) => setChats(data.chats ?? []));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function openChat(id: string) {
    const data = await fetch(`/api/chats/${id}`).then((res) => res.json());
    setChatId(id);
    setMessages((data.chat?.messages ?? []).map((message: any) => ({
      id: message.id,
      role: message.role === "ASSISTANT" ? "assistant" : "user",
      content: message.content,
      citations: message.citations
    })));
  }

  async function send() {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setLoading(true);
    setMessages((current) => [...current, { role: "user", content: question }, { role: "assistant", content: "" }]);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatId, message: question })
    });
    const nextChatId = response.headers.get("x-chat-id") ?? chatId;
    setChatId(nextChatId);
    const citations = JSON.parse(decodeURIComponent(response.headers.get("x-citations") ?? "%5B%5D"));
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;
    let answer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      answer += decoder.decode(value);
      setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, content: answer, citations } : message));
    }
    setLoading(false);
    if (nextChatId) setTimeout(() => openChat(nextChatId), 500);
  }

  async function handoff() {
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: lastUser?.content.slice(0, 80) || "员工咨询转人工",
        description: messages.map((message) => `${message.role}: ${message.content}`).join("\n\n"),
        chatId
      })
    });
    const data = await response.json();
    if (data.ticket?.id) window.location.href = `/tickets?ticket=${data.ticket.id}`;
  }

  return (
    <main className="flex min-h-screen bg-background">
      <div className="hidden md:block"><AppNav /></div>
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden"><AppNav compact /></div>
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_1fr]">
          <aside className="hidden border-r bg-card p-3 lg:block">
            <Button className="mb-3 w-full justify-start" onClick={() => { setChatId(undefined); setMessages([]); }}>
              <Plus className="h-4 w-4" /> 新建聊天
            </Button>
            <div className="space-y-1">
              {chats.map((chat) => (
                <Button key={chat.id} variant="ghost" className="w-full justify-start truncate" onClick={() => openChat(chat.id)}>
                  {chat.title}
                </Button>
              ))}
            </div>
          </aside>
          <div className="flex min-h-0 flex-col">
            <header className="flex items-center justify-between border-b bg-card px-5 py-3">
              <div>
                <h1 className="text-base font-semibold">员工服务 AI</h1>
                <p className="text-sm text-muted-foreground">HR、IT、Finance、Admin 多 Agent 自动路由</p>
              </div>
              <Button variant="outline" onClick={handoff}><LifeBuoy className="h-4 w-4" />转人工</Button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              <div className="mx-auto max-w-3xl space-y-5">
                {messages.length === 0 ? (
                  <div className="rounded-lg border bg-card p-6">
                    <Sparkles className="mb-3 h-6 w-6 text-primary" />
                    <h2 className="text-xl font-semibold">可以问我年假、报销、设备、入离职、签证和培训政策。</h2>
                    <p className="mt-2 text-sm text-muted-foreground">我会优先检索公司知识库；资料不足时会明确说明，并支持一键转人工。</p>
                  </div>
                ) : null}
                {messages.map((message, index) => (
                  <div key={index} className={message.role === "user" ? "ml-auto max-w-[85%] rounded-lg bg-primary px-4 py-3 text-primary-foreground" : "rounded-lg border bg-card px-4 py-3"}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    {message.role === "assistant" && message.citations?.length ? (
                      <div className="mt-4 space-y-2 border-t pt-3">
                        <div className="text-xs font-medium text-muted-foreground">引用来源</div>
                        {message.citations.slice(0, 4).map((citation, citationIndex) => (
                          <div key={citationIndex} className="rounded-md bg-secondary p-2 text-xs">
                            <Badge>{citation.category} · {citation.country}</Badge>
                            <div className="mt-1 font-medium">{citation.fileName}</div>
                            <div className="text-muted-foreground">{citation.preview}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {message.role === "assistant" ? (
                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(message.content)}><Copy className="h-4 w-4" />复制</Button>
                        <FeedbackWidget messageId={message.id} />
                      </div>
                    ) : null}
                  </div>
                ))}
                {loading ? <div className="text-sm text-muted-foreground">AI 正在检索知识库并组织回答...</div> : null}
                <div ref={endRef} />
              </div>
            </div>
            <div className="border-t bg-card p-4">
              <div className="mx-auto flex max-w-3xl gap-2">
                <Textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入你的问题，例如：报销多久到账？" onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }} />
                <Button className="h-auto" onClick={send}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
