import Link from "next/link";
import { notFound } from "next/navigation";
import { Armchair, ArrowLeft, CheckCircle2, Clock3, Mail, Phone, QrCode, UserRound } from "lucide-react";
import { EstadoInvitado, EstadoReserva } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CancelarForm } from "./cancelar-form";
import { ReactivarButton } from "./action-buttons";

export const metadata = { title: "Detalle de invitados | Administración" };

export default async function ReservaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reserva = await prisma.reserva.findUnique({ where: { id }, include: { user: true, invitados: { orderBy: { numero: "asc" }, include: { mesa: true } } } });
  if (!reserva) notFound();
  return (
    <main className="px-3 py-5 md:px-8 md:py-8">
      <Link href="/admin/reservas" className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-ash hover:text-cream"><ArrowLeft className="h-4 w-4" />Volver a invitados</Link>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-ash">Confirmación</p><h1 className="mt-1 font-display text-4xl text-cream">{reserva.user.nombreCompleto}</h1><p className="mt-1 text-bone">{reserva.invitados.length} {reserva.invitados.length === 1 ? "invitado" : "invitados"}</p></div><span className={`w-fit rounded-full border px-4 py-2 text-[9px] font-bold uppercase tracking-[.16em] ${reserva.estado === EstadoReserva.CANCELADO ? "border-signal-rust/30 text-signal-rust" : "border-signal-green/30 text-signal-green"}`}>{reserva.estado === EstadoReserva.CANCELADO ? "Cancelada" : reserva.estado === EstadoReserva.ASISTIO ? "Asistió" : "Confirmada"}</span></div>
      <section className="mb-6 grid gap-3 sm:grid-cols-2"><Info icon={Phone} label="Celular" value={reserva.user.telefono} /><Info icon={Mail} label="Correo" value={reserva.user.email} /></section>
      <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[.2em] text-ash">Grupo familiar</p><h2 className="mt-1 font-display text-3xl text-cream">Pases y mesas</h2></div><Link href="/admin/mesas" className="rounded-full border border-taller-iron px-4 py-2 text-[9px] font-bold uppercase tracking-[.14em] text-bone">Asignar mesas</Link></div>
      <div className="grid gap-3 lg:grid-cols-2">{reserva.invitados.map((invitado) => <article key={invitado.id} className="rounded-2xl border border-taller-iron bg-taller-steel/45 p-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/8 text-ember-bright"><UserRound className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-ash">Invitado {String(invitado.numero).padStart(2, "0")}</p><h3 className="truncate text-lg font-semibold text-cream">{invitado.nombreCompleto}</h3><p className="text-xs text-ash">{invitado.telefono}</p></div></div><div className="mt-4 grid gap-2 rounded-xl bg-taller-shadow/45 p-3 text-sm"><p className="flex items-center gap-2 text-bone"><QrCode className="h-4 w-4 text-ember-bright" />{invitado.codigo ?? "Código no emitido"}</p><p className="flex items-center gap-2 text-bone"><Armchair className="h-4 w-4 text-ember-bright" />{invitado.mesa && invitado.silla ? `Mesa ${invitado.mesa.numero} · Silla ${invitado.silla}` : "Mesa pendiente"}</p><p className={`flex items-center gap-2 ${invitado.estado === EstadoInvitado.ASISTIO ? "text-signal-green" : "text-ash"}`}>{invitado.estado === EstadoInvitado.ASISTIO ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}{invitado.estado === EstadoInvitado.ASISTIO ? `Ingresó ${invitado.registradoEn?.toLocaleString("es-CO") ?? ""}` : "Aún no ha ingresado"}</p></div></article>)}</div>
      {reserva.estado === EstadoReserva.CANCELADO && reserva.motivoCancelacion && <div className="mt-6 rounded-2xl border border-signal-rust/25 bg-signal-rust/5 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-signal-rust">Motivo de cancelación</p><p className="mt-2 text-bone">{reserva.motivoCancelacion}</p></div>}
      <section className="mt-6">
        {reserva.estado === EstadoReserva.CANCELADO
          ? <ReactivarButton reservaId={reserva.id} />
          : !reserva.invitados.some(i => i.registradoEn) && <CancelarForm reservaId={reserva.id} />}
      </section>
    </main>
  );
}

function Info({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) { return <div className="rounded-2xl border border-taller-iron bg-taller-steel/45 p-4"><Icon className="h-4 w-4 text-ember-bright" /><p className="mt-3 text-[9px] font-bold uppercase tracking-[.16em] text-ash">{label}</p><p className="mt-1 break-all text-bone">{value}</p></div>; }
