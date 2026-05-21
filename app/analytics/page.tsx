"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Shell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>();
  const [report, setReport] = useState("");

  useEffect(() => {
    fetch("/api/analytics").then((res) => res.json()).then(setData);
  }, []);

  async function createReport(type: "WEEKLY" | "MONTHLY") {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type })
    });
    const payload = await response.json();
    setReport(payload.report?.summary ?? "");
  }

  const metrics = data?.metrics ?? {};
  return (
    <Shell>
      <div className="space-y-6 p-5">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">AI 咨询、转人工、SLA、满意度和知识库缺口分析。</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => createReport("WEEKLY")}>生成周报</Button>
            <Button onClick={() => createReport("MONTHLY")}>生成月报</Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["总咨询次数", metrics.questionCount ?? 0],
            ["AI解决率", `${Math.round((metrics.aiResolutionRate ?? 0) * 100)}%`],
            ["转人工率", `${Math.round((metrics.handoffRate ?? 0) * 100)}%`],
            ["满意度", Number(metrics.satisfaction ?? 0).toFixed(1)]
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="mt-2 text-3xl font-semibold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle>支持部门工单数量</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byDepartment ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="_count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>AI质量分析</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data?.failures?.map((item: any) => (
              <div key={item.id} className="rounded-lg border p-3">
                <Badge>知识库缺失</Badge>
                <p className="mt-2 text-sm">{item.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        {report ? <Card><CardHeader><CardTitle>AI 自动报告</CardTitle></CardHeader><CardContent className="max-w-none whitespace-pre-wrap text-sm leading-7">{report}</CardContent></Card> : null}
      </div>
    </Shell>
  );
}
