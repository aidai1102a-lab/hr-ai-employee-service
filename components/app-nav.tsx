"use client";

import Link from "next/link";
import { BarChart3, Bot, Files, LifeBuoy, Settings, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "AI 咨询", icon: Bot },
  { href: "/knowledge", label: "知识库", icon: Files },
  { href: "/tickets", label: "工单", icon: LifeBuoy },
  { href: "/analytics", label: "分析", icon: BarChart3 },
  { href: "/admin/users", label: "用户", icon: Users },
  { href: "/admin/prompts", label: "Prompt", icon: Settings }
];

export function AppNav({ compact = false }: { compact?: boolean }) {
  return (
    <aside className={cn("flex border-r bg-card", compact ? "h-14 w-full flex-row items-center px-2" : "h-screen w-64 flex-col")}>
      <div className={cn("flex items-center gap-2 p-4", compact && "p-2")}>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
        {!compact ? <div className="font-semibold">Employee Service AI</div> : null}
      </div>
      <nav className={cn("flex gap-1 p-2", compact ? "flex-1 overflow-x-auto" : "flex-col")}>
        {items.map((item) => (
          <Button key={item.href} asChild variant="ghost" className={cn("justify-start", compact && "shrink-0")}>
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className={cn("mt-auto p-3", compact && "mt-0")}>
        <ThemeToggle />
      </div>
    </aside>
  );
}
