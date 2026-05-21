"use client";

import { useEffect, useState } from "react";
import { FileUp, Search, Trash2 } from "lucide-react";
import { Shell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function KnowledgePage() {
  const [files, setFiles] = useState<any[]>([]);
  const [query, setQuery] = useState("");

  async function load() {
    const data = await fetch("/api/knowledge").then((res) => res.json());
    setFiles(data.files ?? []);
  }

  useEffect(() => { load(); }, []);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/knowledge", { method: "POST", body: form });
    if (response.ok) {
      event.currentTarget.reset();
      load();
    }
  }

  async function remove(id: string) {
    await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = files.filter((file) => `${file.originalName} ${file.category} ${file.tags?.join(" ")}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <Shell>
      <div className="space-y-6 p-5">
        <div>
          <h1 className="text-2xl font-semibold">知识库管理</h1>
          <p className="text-sm text-muted-foreground">支持 HR、IT、Finance、Admin、Legal 多知识库与权限可见性。</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>上传制度文件</CardTitle>
            <CardDescription>PDF、DOCX、TXT、Markdown、Excel 上传后自动解析、分块、embedding 并进入 pgvector。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-6" onSubmit={upload}>
              <Input className="md:col-span-2" type="file" name="file" required />
              <Input name="category" placeholder="分类，如报销流程" />
              <Input name="department" placeholder="部门 HR/IT/FINANCE" />
              <Input name="country" placeholder="国家 GLOBAL/CN/US" />
              <Input name="visibility" placeholder="EMPLOYEE/MANAGER/HR_ONLY" />
              <Input className="md:col-span-5" name="tags" placeholder="标签，逗号分隔" />
              <Button type="submit"><FileUp className="h-4 w-4" />上传</Button>
            </form>
          </CardContent>
        </Card>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="搜索文件、分类、标签" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="grid gap-3">
          {filtered.map((file) => (
            <Card key={file.id}>
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium">{file.originalName}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>{file.status}</Badge>
                    <Badge>{file.department}</Badge>
                    <Badge>{file.visibility}</Badge>
                    <Badge>{file.country}</Badge>
                    <Badge>{file._count?.chunks ?? 0} chunks</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(file.id)}><Trash2 className="h-4 w-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
