"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<any[]>([]);

  async function load() {
    const data = await fetch("/api/admin/prompts").then((res) => res.json());
    setPrompts(data.prompts ?? []);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch("/api/admin/prompts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries()))
    });
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <Shell>
      <div className="space-y-6 p-5">
        <h1 className="text-2xl font-semibold">Prompt 配置</h1>
        <Card>
          <CardHeader><CardTitle>系统 Prompt</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={save}>
              <div className="grid gap-3 md:grid-cols-3">
                <Input name="key" placeholder="default_hr_assistant" defaultValue="default_hr_assistant" />
                <Input name="name" placeholder="名称" defaultValue="Default HR AI Assistant" />
                <Input name="country" placeholder="GLOBAL/CN/US" defaultValue="GLOBAL" />
              </div>
              <Textarea name="content" className="min-h-48" defaultValue="你是公司内部员工服务 AI 助手。只能依据知识库回答，不确定时明确说明并建议转人工。" />
              <Button>保存 Prompt</Button>
            </form>
          </CardContent>
        </Card>
        <div className="grid gap-3">
          {prompts.map((prompt) => (
            <Card key={prompt.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{prompt.name}</div>
                  <Badge>{prompt.country}</Badge>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{prompt.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
