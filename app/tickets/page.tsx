"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { Shell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [active, setActive] = useState<any>();
  const [reply, setReply] = useState("");

  async function load() {
    const data = await fetch("/api/tickets").then((res) => res.json());
    setTickets(data.tickets ?? []);
  }

  async function open(id: string) {
    const data = await fetch(`/api/tickets/${id}`).then((res) => res.json());
    setActive(data.ticket);
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch("/api/tickets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        department: form.get("department") || undefined
      })
    });
    event.currentTarget.reset();
    load();
  }

  async function sendReply() {
    if (!active || !reply.trim()) return;
    await fetch(`/api/tickets/${active.id}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: reply })
    });
    setReply("");
    open(active.id);
  }

  useEffect(() => { load(); }, []);

  return (
    <Shell>
      <div className="grid min-h-screen gap-5 p-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>创建转人工工单</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={create}>
                <Input name="title" placeholder="标题" required />
                <Input name="department" placeholder="部门 HR/IT/FINANCE/ADMIN/LEGAL" />
                <Textarea name="description" placeholder="问题描述" required />
                <Button className="w-full"><LifeBuoy className="h-4 w-4" />提交</Button>
              </form>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <Card key={ticket.id} className="cursor-pointer hover:bg-secondary/60" onClick={() => open(ticket.id)}>
                <CardContent className="p-4">
                  <div className="font-medium">{ticket.title}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>{ticket.status}</Badge>
                    <Badge>{ticket.department}</Badge>
                    <Badge>{ticket.priority}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">SLA: {new Date(ticket.slaDueAt).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{active?.title ?? "选择一个工单"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {active ? (
              <>
                <div className="grid gap-2 text-sm md:grid-cols-4">
                  <Badge>{active.status}</Badge>
                  <Badge>{active.department}</Badge>
                  <Badge>{active.priority}</Badge>
                  <Badge>{new Date(active.slaDueAt) < new Date() ? "SLA 超时" : "SLA 正常"}</Badge>
                </div>
                <div className="rounded-lg bg-secondary p-3 text-sm whitespace-pre-wrap">{active.description}</div>
                <div className="space-y-2">
                  {active.messages?.map((message: any) => (
                    <div key={message.id} className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">{message.author.name} · {message.author.role}</div>
                      <div className="mt-1">{message.content}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="人工回复" />
                  <Button onClick={sendReply}><Send className="h-4 w-4" /></Button>
                </div>
              </>
            ) : <p className="text-sm text-muted-foreground">左侧选择工单后，可查看会话记录、SLA、状态并继续回复。</p>}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
