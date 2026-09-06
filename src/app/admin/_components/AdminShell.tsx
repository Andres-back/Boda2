"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV as NAV } from "@/components/brand/admin-navigation";

export function AdminShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const currentPath = usePathname();
  const pathname = currentPath.startsWith("/admin/usuarios") || currentPath.startsWith("/admin/inscripciones") ? "/admin/reservas" : currentPath;
  return (
    <div className="flex flex-1 flex-col pt-16 md:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#403735] md:flex"><div className="border-b border-white/10 p-6"><Link href="/" className="font-display text-3xl text-[#fff9ee]">A <span className="font-[var(--font-parisienne)] text-[#f4d36f]">&</span> A</Link><p className="mt-3 text-[9px] font-bold uppercase tracking-[.25em] text-[#f4d36f]">Administración de boda</p><p className="mt-1 truncate text-sm text-[#f1ddd9]">{userName}</p></div><nav className="flex-1 space-y-1 p-3">{NAV.map((item) => { const active = item.exact ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 text-[10px] font-bold uppercase tracking-[.14em] transition", active ? "bg-[#b9726f] text-white shadow-lg" : "text-[#f1ddd9] hover:bg-white/8")}><item.icon className="h-4 w-4" />{item.label}</Link>; })}</nav><form action="/logout" method="POST" className="border-t border-white/10 p-3"><button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#f1ddd9] hover:bg-white/8"><LogOut className="h-4 w-4" />Salir</button></form></aside>
      <div className="sticky top-16 z-30 flex min-h-14 items-center justify-between gap-3 border-b border-white/10 bg-[#403735] px-4 md:hidden">
        <p className="min-w-0 text-xs text-[#f1ddd9]"><span className="block text-[9px] uppercase tracking-[.16em] text-[#f4d36f]">Administración</span>{NAV.find(item => item.exact ? pathname === item.href : pathname.startsWith(item.href))?.label ?? "Invitados"}</p>
        <form action="/logout" method="POST"><button type="submit" className="flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-xs font-medium text-[#fff9ee]"><LogOut className="h-4 w-4" />Salir</button></form>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
