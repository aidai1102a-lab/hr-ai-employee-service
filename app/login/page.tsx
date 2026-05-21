"use client";

import { useState } from "react";
import { Bot, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@company.com");
  const [password, setPassword] = useState("Admin@123456");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      setError("登录失败，请检查账号或密码。");
      return;
    }
    window.location.href = "/";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-6 w-6" />
          </div>
          <CardTitle>员工服务 AI 门户</CardTitle>
          <CardDescription>HR、IT、Finance、Admin 的统一智能咨询入口</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <label className="space-y-2 text-sm font-medium">
              <span>邮箱</span>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span>密码</span>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" type="submit">登录</Button>
            <Button className="w-full" type="button" variant="outline" onClick={() => (window.location.href = "/api/dingtalk/oauth?code=demo")}>
              钉钉免登演示
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
