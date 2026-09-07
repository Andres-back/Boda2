"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, LoaderCircle, Minus, Plus, UserRound } from "lucide-react";
import { crearOActualizarReserva, type ReservarState } from "./actions";

const initialState: ReservarState = { error: null };
const inputClass = "h-12 w-full rounded-xl border border-[#725784]/20 bg-white px-4 text-[#3f2d4b] outline-none transition placeholder:text-[#9988a2] focus:border-[#9a68b3] focus:ring-2 focus:ring-[#d8b9e8]/35";

export function ReservarForm({ titularNombre, titularTelefono, invitadosIniciales, bloqueadaPorMesa }: {
  titularNombre: string;
  titularTelefono: string;
  invitadosIniciales: { nombreCompleto: string; telefono: string }[];
  bloqueadaPorMesa: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(crearOActualizarReserva, initialState);
  const [cantidad, setCantidad] = useState(Math.max(1, invitadosIniciales.length || 1));

  useEffect(() => {
    if (state.success) {
      router.push("/mi-reserva");
      router.refresh();
    }
  }, [router, state.success]);

  if (bloqueadaPorMesa) {
    return <div className="rounded-[28px] border border-[#9a68b3]/25 bg-[#fffafe]/95 p-7 text-center shadow-xl"><h2 className="font-display text-3xl">Tu mesa ya fue asignada</h2><p className="mt-3 text-sm text-[#75667d]">Para cambiar los acompañantes, comunícate directamente con los novios y te ayudarán personalmente.</p><button onClick={() => router.push("/mi-reserva")} className="mt-6 rounded-full bg-[#5b3f6d] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white">Volver a mi confirmación</button></div>;
  }

  return (
    <form action={action} className="rounded-[30px] border border-white/70 bg-[#fffafe]/95 p-5 shadow-[0_28px_70px_rgba(71,43,88,.14)] backdrop-blur md:p-8">
      <input type="hidden" name="cantidad" value={cantidad} />
      <section className="rounded-2xl border border-[#7f8a78]/20 bg-[#f1ebf5]/55 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#7f8a78]">Persona principal</p>
        <div className="mt-3 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#725784] shadow-sm"><UserRound className="h-5 w-5" /></span><div><p className="font-semibold text-[#3f2d4b]">{titularNombre}</p><p className="text-xs text-[#75667d]">{titularTelefono}</p></div></div>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#7b52a0]">Total de asistentes</p><p className="mt-1 text-sm text-[#75667d]">Incluyéndote a ti</p></div>
          <div className="flex items-center rounded-full border border-[#725784]/20 bg-white p-1 shadow-sm">
            <button type="button" aria-label="Quitar invitado" onClick={() => setCantidad((value) => Math.max(1, value - 1))} className="grid h-10 w-10 place-items-center rounded-full text-[#725784] hover:bg-[#eee1f6]"><Minus className="h-4 w-4" /></button>
            <strong className="w-9 text-center font-display text-3xl text-[#3f2d4b]">{cantidad}</strong>
            <button type="button" aria-label="Agregar invitado" onClick={() => setCantidad((value) => Math.min(10, value + 1))} className="grid h-10 w-10 place-items-center rounded-full bg-[#5b3f6d] text-white"><Plus className="h-4 w-4" /></button>
          </div>
        </div>
      </section>

      {cantidad > 1 && (
        <section className="mt-6 space-y-4 border-t border-[#725784]/15 pt-6">
          <div><h2 className="font-display text-3xl text-[#3f2d4b]">Tus acompañantes</h2><p className="mt-1 text-xs leading-5 text-[#75667d]">El celular es opcional; si lo dejas vacío usaremos tu contacto.</p></div>
          {Array.from({ length: cantidad - 1 }, (_, index) => {
            const numero = index + 2;
            const previo = invitadosIniciales[index + 1];
            return <div key={numero} className="rounded-2xl border border-[#725784]/15 bg-white/70 p-4"><p className="mb-3 text-[10px] font-semibold uppercase tracking-[.18em] text-[#9a68b3]">Acompañante {index + 1}</p><div className="grid gap-3 sm:grid-cols-2"><label><span className="sr-only">Nombre completo</span><input name={`invitadoNombre${numero}`} required minLength={3} defaultValue={previo?.nombreCompleto ?? ""} className={inputClass} placeholder="Nombre completo" /></label><label><span className="sr-only">Celular</span><input name={`invitadoTelefono${numero}`} inputMode="numeric" defaultValue={previo?.telefono && previo.telefono !== titularTelefono ? previo.telefono.replace(/^57/, "") : ""} className={inputClass} placeholder="Celular (opcional)" /></label></div></div>;
          })}
        </section>
      )}

      {state.error && <p className="mt-5 rounded-xl border border-[#c96d6d]/20 bg-[#c96d6d]/10 p-3 text-sm text-[#a44949]">{state.error}</p>}
      <button type="submit" disabled={pending} className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#5b3f6d] px-6 text-[11px] font-bold uppercase tracking-[.17em] text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#725784] disabled:opacity-60">
        {pending ? <><LoaderCircle className="h-4 w-4 animate-spin" />Confirmando</> : <><HeartHandshake className="h-4 w-4" />Confirmar {cantidad === 1 ? "mi asistencia" : `${cantidad} asistentes`}</>}
      </button>
      <p className="mt-4 text-center text-xs leading-5 text-[#75667d]">Al confirmar nos ayudas a organizar tu mesa y el ingreso de cada invitado.</p>
    </form>
  );
}
