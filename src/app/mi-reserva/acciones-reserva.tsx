"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { cancelarMiReserva, type CancelarMiReservaState } from "@/app/reservar/actions";

const initial: CancelarMiReservaState = { error: null };

export function AccionesReserva() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(cancelarMiReserva, initial);
  useEffect(() => { if (state.success) router.refresh(); }, [router, state.success]);

  if (!open) return <div className="mt-8 text-center"><button type="button" onClick={() => setOpen(true)} className="text-xs text-[#8d6f69] underline decoration-[#9a68b3]/45 underline-offset-4">No podré asistir</button></div>;

  return (
    <div className="mt-8 rounded-2xl border border-[#c96d6d]/20 bg-[#fffafe] p-5 text-[#44334f]">
      <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#b45c5c]" /><div><h3 className="font-display text-2xl">Cancelar confirmación</h3><p className="mt-1 text-sm text-[#75667d]">Se liberarán los lugares y mesas de todo tu grupo. Podrás confirmar nuevamente si tus planes cambian.</p></div></div>
      <form action={action} className="mt-4"><label className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#725784]">Cuéntanos brevemente</label><textarea name="motivo" required minLength={5} maxLength={500} rows={3} className="mt-2 w-full rounded-xl border border-[#725784]/20 bg-white p-3 text-sm outline-none focus:border-[#9a68b3]" placeholder="Motivo de la cancelación" />{state.error && <p className="mt-2 text-xs text-[#a44949]">{state.error}</p>}<div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-full px-5 text-xs text-[#75667d]">Volver</button><button type="submit" disabled={pending} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#a44949] px-5 text-[10px] font-bold uppercase tracking-[.15em] text-white disabled:opacity-60">{pending && <LoaderCircle className="h-4 w-4 animate-spin" />}{pending ? "Cancelando" : "Sí, cancelar"}</button></div></form>
    </div>
  );
}
