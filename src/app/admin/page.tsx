import Link from "next/link";
import { EstadoInvitado, EstadoReserva } from "@prisma/client";
import { Armchair, ArrowRight, CheckCircle2, Grid3x3, QrCode, UsersRound } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/ui/animated-number";

export const metadata = { title: "Administración | Alejandro & Ana" };

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user) return null;
  const [reservas, ultimas, mesas] = await Promise.all([
    prisma.reserva.findMany({ where: { estado: { not: EstadoReserva.CANCELADO } }, select: { id: true, invitados: { select: { estado: true, mesaId: true } } } }),
    prisma.reserva.findMany({ where: { estado: { not: EstadoReserva.CANCELADO } }, take: 8, orderBy: { confirmadaEn: "desc" }, include: { user: { select: { nombreCompleto: true, telefono: true } }, invitados: { select: { estado: true, mesaId: true } } } }),
    prisma.mesa.findMany({ select: { capacidad: true, _count: { select: { invitados: true } } } }),
  ]);
  const invitados = reservas.flatMap((reserva) => reserva.invitados);
  const confirmados = invitados.filter((invitado) => invitado.estado === EstadoInvitado.CONFIRMADO || invitado.estado === EstadoInvitado.ASISTIO).length;
  const asistieron = invitados.filter((invitado) => invitado.estado === EstadoInvitado.ASISTIO).length;
  const conMesa = invitados.filter((invitado) => invitado.mesaId).length;
  const capacidad = mesas.reduce((total, mesa) => total + mesa.capacidad, 0);
  const ocupados = mesas.reduce((total, mesa) => total + mesa._count.invitados, 0);

  return (
    <main className="px-4 py-7 md:px-8 md:py-9">
      <div className="mb-7"><p className="text-xs uppercase tracking-[.22em] text-ash">Panel de organización</p><h1 className="mt-1 font-display text-4xl text-cream">Hola, {session.user.name ?? "Administrador"}</h1><p className="mt-1 text-bone">Resumen en tiempo real de la boda de Alejandro y Ana.</p></div>
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric icon={UsersRound} label="Confirmaciones" value={reservas.length} />
        <Metric icon={CheckCircle2} label="Invitados" value={confirmados} />
        <Metric icon={Armchair} label="Con mesa" value={conMesa} sub={`${Math.max(confirmados - conMesa, 0)} pendientes`} />
        <Metric icon={QrCode} label="Ingresaron" value={asistieron} />
        <Metric icon={Grid3x3} label="Mesas" value={mesas.length} sub={`${ocupados}/${capacidad} lugares`} />
      </div>
      <Card>
        <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="text-xl">Confirmaciones recientes</CardTitle><Link href="/admin/reservas" className="flex items-center gap-1 text-sm font-semibold text-ember-bright">Ver todas <ArrowRight className="h-4 w-4" /></Link></div></CardHeader>
        <CardContent>{ultimas.length === 0 ? <p className="py-7 text-center text-ash">Aún no hay confirmaciones.</p> : <ul className="divide-y divide-taller-iron">{ultimas.map((reserva) => <li key={reserva.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><p className="truncate font-semibold text-cream">{reserva.user.nombreCompleto}</p><p className="text-sm text-ash">{reserva.invitados.length} {reserva.invitados.length === 1 ? "invitado" : "invitados"} · {reserva.user.telefono}</p></div><span className="rounded-full border border-signal-green/30 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-signal-green">Confirmada</span><Link href={`/admin/reservas/${reserva.id}`} className="text-xs font-semibold text-ember-bright">Ver</Link></li>)}</ul>}</CardContent>
      </Card>
    </main>
  );
}

function Metric({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; sub?: string }) {
  return <Card className="hover-lift"><CardContent className="p-4 md:p-5"><Icon className="h-5 w-5 text-ember-bright" /><p className="mt-4 text-[9px] font-bold uppercase tracking-[.16em] text-ash">{label}</p><p className="mt-1 font-display text-4xl text-cream"><AnimatedNumber value={value} /></p>{sub && <p className="mt-1 text-xs text-ash">{sub}</p>}</CardContent></Card>;
}
