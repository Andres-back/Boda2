import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Heart, LogOut, MapPin, Pencil, UsersRound } from "lucide-react";
import { EstadoReserva } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { InvitadoTicketCard } from "@/components/brand/InvitadoTicketCard";
import { AccionesReserva } from "./acciones-reserva";

export const metadata = { title: "Mi confirmación | Alejandro & Ana" };

export default async function MiReservaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/mi-reserva");
  const reserva = await prisma.reserva.findUnique({
    where: { userId: session.user.id },
    include: { user: true, invitados: { orderBy: { numero: "asc" }, include: { mesa: true } } },
  });
  if (!reserva) redirect("/reservar");

  const cancelada = reserva.estado === EstadoReserva.CANCELADO;
  const asistieron = reserva.invitados.filter((invitado) => invitado.estado === "ASISTIO").length;
  const tieneMesa = reserva.invitados.some((invitado) => Boolean(invitado.mesaId));

  return (
    <main id="main-content" className="relative min-h-svh overflow-hidden bg-[#fff9ee] px-4 py-8 text-[#4b403d] md:py-14">
      <Image src="/wedding/photo-flowers.webp" alt="" fill priority className="object-cover opacity-[.12]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,249,238,.84),rgba(255,249,238,.98))]" />
      <div className="relative mx-auto w-full max-w-3xl">
        <Link href="/" className="mx-auto mb-7 flex w-fit items-center gap-2 font-display text-2xl text-[#5f4d49]">A <span className="font-[var(--font-parisienne)] text-[#a97718]">&</span> A</Link>
        <header className="text-center">
          <Heart className="mx-auto h-8 w-8 text-[#b9726f]" strokeWidth={1.35} />
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.3em] text-[#a97718]">{cancelada ? "Confirmación cancelada" : "Asistencia confirmada"}</p>
          <h1 className="mt-2 font-display text-5xl leading-none text-[#403735] md:text-6xl">Hola, {reserva.user.nombreCompleto.split(" ")[0]}</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#7e716d]">{cancelada ? "Lamentamos que no puedas acompañarnos. Si tus planes cambian, puedes confirmar nuevamente." : "Gracias por ser parte de este día. Aquí encontrarás los pases individuales y, cuando esté lista, la asignación de mesa."}</p>
        </header>

        {cancelada ? (
          <div className="mx-auto mt-8 max-w-lg rounded-[28px] border border-white/70 bg-[#fffdf9]/95 p-7 text-center shadow-xl">
            {reserva.motivoCancelacion && <p className="text-sm italic text-[#7e716d]">“{reserva.motivoCancelacion}”</p>}
            <Link href="/reservar" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#5f4d49] px-6 text-[10px] font-bold uppercase tracking-[.16em] text-white">Confirmar nuevamente</Link>
          </div>
        ) : (
          <>
            <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Info icon={<CalendarDays />} label="Fecha" value="10 oct. 2026" />
              <Info icon={<MapPin />} label="Lugar" value="Mocoa" />
              <Info icon={<UsersRound />} label="Invitados" value={String(reserva.invitados.length)} />
              <Info icon={<Heart />} label="Ingresaron" value={`${asistieron}/${reserva.invitados.length}`} />
            </section>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#a97718]">Pases personales</p><h2 className="mt-1 font-display text-4xl text-[#403735]">Tu grupo</h2></div>
              {!tieneMesa && reserva.estado !== EstadoReserva.ASISTIO && <Link href="/reservar?editar=1" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#7b625d]/25 px-5 text-[10px] font-bold uppercase tracking-[.15em] text-[#5f4d49]"><Pencil className="h-3.5 w-3.5" />Editar acompañantes</Link>}
            </div>
            <div className="mt-4 grid gap-4">
              {reserva.invitados.map((invitado) => <InvitadoTicketCard key={invitado.id} numero={invitado.numero} nombreCompleto={invitado.nombreCompleto} telefono={invitado.telefono} codigo={invitado.codigo} registradoEn={invitado.registradoEn} ultimoReingresoEn={invitado.ultimoReingresoEn} reingresos={invitado.reingresos} mesaNumero={invitado.mesa?.numero ?? null} silla={invitado.silla} estado={invitado.estado} />)}
            </div>
            {reserva.estado !== EstadoReserva.ASISTIO && <AccionesReserva />}
          </>
        )}

        <div className="mt-10 flex flex-col items-center gap-3 border-t border-[#7b625d]/15 pt-7 text-center">
          <p className="font-display text-2xl text-[#5f4d49]">Alejandro & Ana</p>
          <form action="/logout" method="POST"><button className="inline-flex items-center gap-2 text-xs text-[#7e716d]"><LogOut className="h-3.5 w-3.5" />Cerrar sesión</button></form>
        </div>
      </div>
    </main>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl border border-white/70 bg-[#fffdf9]/90 p-4 text-center shadow-sm"><span className="mx-auto grid h-8 w-8 place-items-center text-[#b9726f] [&>svg]:h-4 [&>svg]:w-4">{icon}</span><p className="mt-1 text-[9px] font-semibold uppercase tracking-[.16em] text-[#7e716d]">{label}</p><p className="mt-1 font-display text-xl text-[#403735]">{value}</p></div>;
}
