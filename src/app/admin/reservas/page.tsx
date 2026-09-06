import Link from "next/link";
import { EstadoInvitado, EstadoReserva } from "@prisma/client";
import { Check, ChevronRight, QrCode, Search, UsersRound } from "lucide-react";
import { prisma } from "@/lib/db";
import { PeopleTabs } from "../_components/PeopleTabs";

export const metadata = { title: "Invitados | Administración" };

export default async function AdminReservasPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams;
  const estado = params.estado as EstadoReserva | undefined;
  const search = (params.search ?? "").trim();
  const reservas = await prisma.reserva.findMany({
    where: {
      ...(estado && Object.values(EstadoReserva).includes(estado) ? { estado } : {}),
      ...(search ? { OR: [{ user: { nombreCompleto: { contains: search, mode: "insensitive" } } }, { user: { telefono: { contains: search } } }, { invitados: { some: { nombreCompleto: { contains: search, mode: "insensitive" } } } }] } : {}),
    },
    orderBy: { creadaEn: "desc" },
    include: { user: { select: { nombreCompleto: true, telefono: true, email: true } }, invitados: { orderBy: { numero: "asc" }, include: { mesa: true } } },
  });
  const totalInvitados = reservas.reduce((total, reserva) => total + reserva.invitados.length, 0);
  const tabs = [{ value: "", label: "Todos" }, { value: EstadoReserva.CONFIRMADA, label: "Confirmados" }, { value: EstadoReserva.ASISTIO, label: "Asistieron" }, { value: EstadoReserva.CANCELADO, label: "Cancelados" }];

  return (
    <main className="px-3 py-5 md:px-8 md:py-8">
      <PeopleTabs active="invitados" />
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-ash">Gestión de boda</p><h1 className="mt-1 font-display text-4xl text-cream">Invitados</h1><p className="mt-1 text-bone">{reservas.length} confirmaciones · {totalInvitados} personas</p></div><Link href="/admin/reservas/export" className="inline-flex min-h-11 w-fit items-center rounded-full border border-taller-iron px-4 text-[10px] font-bold uppercase tracking-[.14em] text-bone">Exportar CSV</Link></div>
      <form className="relative mb-4"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ash" /><input name="search" defaultValue={search} className="h-12 w-full rounded-xl border border-taller-iron bg-taller-shadow pl-10 pr-4 text-bone outline-none focus:border-ember-bright" placeholder="Buscar titular, acompañante o celular" />{estado && <input type="hidden" name="estado" value={estado} />}</form>
      <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">{tabs.map((tab) => <Link key={tab.value} href={tab.value ? `/admin/reservas?estado=${tab.value}` : "/admin/reservas"} className={`shrink-0 rounded-full border px-4 py-2 text-[9px] font-bold uppercase tracking-[.14em] ${((estado ?? "") === tab.value) ? "border-ember-rust bg-ember-rust text-white" : "border-taller-iron text-ash"}`}>{tab.label}</Link>)}</nav>
      <div className="grid gap-3">{reservas.length === 0 ? <div className="rounded-2xl border border-taller-iron p-8 text-center text-ash">No hay confirmaciones con este filtro.</div> : reservas.map((reserva) => { const ingresaron = reserva.invitados.filter((invitado) => invitado.estado === EstadoInvitado.ASISTIO).length; const mesas = [...new Set(reserva.invitados.flatMap((invitado) => invitado.mesa?.numero ? [invitado.mesa.numero] : []))]; return <Link key={reserva.id} href={`/admin/reservas/${reserva.id}`} className="group rounded-2xl border border-taller-iron bg-taller-steel/45 p-4 transition hover:border-ember-bright/60"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ember-rust/15 text-ember-bright"><UsersRound className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h2 className="truncate font-semibold text-cream">{reserva.user.nombreCompleto}</h2><p className="text-xs text-ash">{reserva.user.telefono} · {reserva.user.email}</p></div><ChevronRight className="h-5 w-5 shrink-0 text-ash transition group-hover:translate-x-1" /></div><div className="mt-3 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-[.12em]"><span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-bone"><UsersRound className="h-3 w-3" />{reserva.invitados.length} invitados</span><span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-bone"><Check className="h-3 w-3" />{ingresaron}/{reserva.invitados.length} ingresaron</span><span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-bone"><QrCode className="h-3 w-3" />{mesas.length ? `Mesa ${mesas.join(", ")}` : "Mesa pendiente"}</span><span className={`rounded-full border px-3 py-1.5 ${reserva.estado === EstadoReserva.CANCELADO ? "border-signal-rust/30 text-signal-rust" : "border-signal-green/30 text-signal-green"}`}>{reserva.estado === EstadoReserva.CANCELADO ? "Cancelada" : reserva.estado === EstadoReserva.ASISTIO ? "Asistió" : "Confirmada"}</span></div></div></div></Link>; })}</div>
    </main>
  );
}
