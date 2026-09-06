import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ReservarForm } from "./reservar-form";

export const metadata = { title: "Confirmar asistencia | Alejandro & Ana" };

export default async function ReservarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/registro?next=/reservar");
  const params = await searchParams;
  const editar = params.editar === "1";
  const [reserva, user] = await Promise.all([
    prisma.reserva.findUnique({ where: { userId: session.user.id }, include: { invitados: { orderBy: { numero: "asc" }, select: { numero: true, nombreCompleto: true, telefono: true, mesaId: true } } } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { nombreCompleto: true, telefono: true } }),
  ]);
  if (reserva && reserva.estado !== "CANCELADO" && !editar) redirect("/mi-reserva");

  return (
    <main id="main-content" className="relative min-h-svh overflow-hidden bg-[#fff9ee] px-4 py-8 text-[#4b403d] md:py-14">
      <Image src="/wedding/scene-rsvp.webp" alt="" fill priority className="object-cover opacity-20" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,249,238,.72),rgba(255,249,238,.97))]" />
      <div className="relative mx-auto w-full max-w-2xl">
        <Link href="/" className="mx-auto mb-7 flex w-fit items-center gap-2 font-display text-2xl text-[#5f4d49]">A <span className="font-[var(--font-parisienne)] text-[#a97718]">&</span> A</Link>
        <header className="mb-7 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[.3em] text-[#a97718]">10 · 10 · 2026</p>
          <h1 className="mt-2 font-display text-5xl leading-none text-[#403735] md:text-6xl">Confirma tu asistencia</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#7e716d]">Registra a quienes te acompañarán. Cada persona recibirá un código individual para el ingreso y podrá tener su lugar en mesa.</p>
        </header>
        <ReservarForm
          titularNombre={user?.nombreCompleto ?? ""}
          titularTelefono={user?.telefono ?? ""}
          invitadosIniciales={reserva?.invitados.map((invitado) => ({ nombreCompleto: invitado.nombreCompleto, telefono: invitado.telefono })) ?? []}
          bloqueadaPorMesa={reserva?.invitados.some((invitado) => Boolean(invitado.mesaId)) ?? false}
        />
      </div>
    </main>
  );
}
