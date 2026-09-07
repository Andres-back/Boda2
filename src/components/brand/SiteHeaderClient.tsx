"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, LogOut, Menu, X } from "lucide-react";
import { ADMIN_NAV } from "./admin-navigation";

const links = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/#historia", label: "Nuestra historia" },
  { href: "/#momentos", label: "Momentos" },
  { href: "/#fecha", label: "Fecha" },
];
const menuItem = "flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#f8f1fc] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#d9b9e9]";

export function SiteHeaderClient({ ctaHref, isLoggedIn, isAdmin }: { ctaHref: string; isLoggedIn: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); buttonRef.current?.focus(); } };
    const onPointer = (event: PointerEvent) => { if (!headerRef.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKeyDown); document.removeEventListener("pointerdown", onPointer); };
  }, [open]);

  return (
    <header ref={headerRef} className="fixed top-0 z-40 w-full border-b border-white/10 bg-[#3f2d4b]/95 text-[#f8f1fc] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Inicio · Jans y Yurleydi" className="flex min-h-11 items-center font-display text-2xl">J <span className="mx-1.5 font-[var(--font-parisienne)] text-[#d9b9e9]">&</span> Y</Link>
        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Navegación principal">{links.map(link => <Link key={link.href} href={link.href} className="rounded-full px-3 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#eadff0] hover:bg-white/10">{link.label}</Link>)}</nav>
        <div className="flex items-center gap-3">
          {!isAdmin && <Link href={ctaHref} className="hidden min-h-11 items-center gap-2 rounded-full bg-[#9a68b3] px-4 text-[10px] font-bold uppercase tracking-[.14em] text-white sm:inline-flex"><Heart className="h-4 w-4" />Confirmar</Link>}
          <button ref={buttonRef} type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/25 focus-visible:outline-2 focus-visible:outline-[#d9b9e9]" aria-expanded={open} aria-controls="account-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen(value => !value)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      {open && <div id="account-menu" className="absolute right-3 left-3 top-[calc(100%+8px)] max-h-[calc(100dvh-88px)] overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-[#3f2d4b] p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-2xl sm:left-auto sm:w-80">
        <nav aria-label={isAdmin ? "Menú de administración" : "Menú de la invitación"}>
          {isAdmin ? <>
            <p className="px-4 py-2 text-[10px] uppercase tracking-[.2em] text-[#d9b9e9]">Organización de la boda</p>
            {ADMIN_NAV.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={menuItem}><item.icon className="h-4 w-4 shrink-0" />{item.exact ? "Abrir administración" : item.label}</Link>)}
            <Link href="/" onClick={() => setOpen(false)} className={`${menuItem} mt-2 border-t border-white/10`}>Ver invitación</Link>
          </> : <>
            {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={menuItem}>{link.label}</Link>)}
            <Link href={ctaHref} onClick={() => setOpen(false)} className={`${menuItem} mt-2 bg-[#9a68b3]`}>Confirmar asistencia</Link>
            <Link href={isLoggedIn ? "/mi-reserva" : "/login"} onClick={() => setOpen(false)} className={menuItem}>{isLoggedIn ? "Mi confirmación" : "Iniciar sesión"}</Link>
          </>}
          {isLoggedIn && <form action="/logout" method="POST" className="mt-2 border-t border-white/15 pt-2"><button type="submit" className={`${menuItem} w-full`}><LogOut className="h-4 w-4" />Salir</button></form>}
        </nav>
      </div>}
    </header>
  );
}
