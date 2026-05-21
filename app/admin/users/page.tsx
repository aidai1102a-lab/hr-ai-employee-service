"use client";

import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  async function load() {
    const data = await fetch("/api/admin/users").then((res) => res.json());
    setUsers(data.users ?? []);
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries()))
    });
    event.currentTarget.reset();
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <Shell>
      <div className="space-y-6 p-5">
        <h1 className="text-2xl font-semibold">用户与权限</h1>
        <Card>
          <CardHeader><CardTitle>新增用户</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-6" onSubmit={create}>
              <Input name="email" placeholder="email" required />
              <Input name="name" placeholder="姓名" required />
              <Input name="password" placeholder="初始密码" defaultValue="Welcome@123" />
              <Input name="role" placeholder="ADMIN/HR/MANAGER/SUPPORT/EMPLOYEE" />
              <Input name="country" placeholder="CN" />
              <Input name="department" placeholder="部门" />
              <Button>创建</Button>
            </form>
          </CardContent>
        </Card>
        <div className="grid gap-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex flex-col justify-between gap-3 p-4 md:flex-row md:items-center">
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
                <div className="flex gap-2">
                  <Badge>{user.role}</Badge>
                  <Badge>{user.country}</Badge>
                  <Badge>{user.department ?? "未分配"}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
