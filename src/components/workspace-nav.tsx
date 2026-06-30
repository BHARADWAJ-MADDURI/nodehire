"use client";

import { Circle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function WorkspaceNav({ contextId }: { contextId?: string }) {
  const pathname = usePathname();
  const items = [
    { label: "Prep contexts", href: "/app", active: pathname === "/app" },
    { label: "Topic map", href: contextId ? `/app/topics/${contextId}` : "/app", active: pathname.startsWith("/app/topics/") },
    { label: "Drill", href: contextId ? `/app/drill/${contextId}` : "/app", active: pathname.startsWith("/app/drill/") },
    { label: "Progress", href: "/app/progress", active: pathname === "/app/progress" },
    { label: "Mock interview", href: contextId ? `/app/mock/${contextId}` : "/app", active: pathname.startsWith("/app/mock/") },
  ];
  return <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1" aria-label="Workspace">{items.map((item) => <Link key={item.label} href={item.href} aria-current={item.active ? "page" : undefined} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${item.active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Circle className={`size-2.5 ${item.active ? "fill-current" : ""}`} />{item.label}</Link>)}</nav>;
}
