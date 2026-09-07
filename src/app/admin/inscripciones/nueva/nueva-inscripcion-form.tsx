"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";

import { CheckCircle2, Copy, MessageCircle, Save } from "lucide-react";
import { toast } from "sonner";

import { crearReservaAdmin } from "../../actions";
import type { AdminActionResult } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: AdminActionResult<{
  reservaId: string;
  tempPassword: string | null;
  tempPasswordInstruction: string | null;
  tempPasswordMethod: string | null;
}> = {
  error: null,
  success: true,
};

export function NuevaInscripcionForm() {
  const [state, action, pending] = useActionState(crearReservaAdmin, initial);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success && state.message) toast.success(state.message);
  }, [state]);

  const waText = encodeURIComponent(
    `Hola ${nombre || ""}, Jans y Yurleydi confirmaron tu invitación a su boda. Puedes ingresar con el correo ${email}.`
  );
  const waDigits = telefono.replace(/\D/g, "").replace(/^(\d{10})$/, "57$1");
  const waUrl = waDigits ? `https://wa.me/${waDigits}?text=${waText}` : "";

  if (state.success && state.data?.reservaId) {
    return (
      <div className="space-y-4 rounded-md border border-signal-green bg-signal-green/10 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 h-6 w-6 text-signal-green" />
          <div>
            <h2 className="font-display text-2xl text-cream">
              Invitación confirmada
            </h2>
            <p className="mt-1 text-bone">{state.message}</p>
          </div>
        </div>
        {state.data.tempPasswordInstruction && (
          <div className="rounded-md border border-taller-iron bg-taller-shadow p-3">
            <p className="font-subhead text-xs uppercase tracking-widest text-ash">
              Credenciales temporales
            </p>
            <p className="mt-2 text-bone">
              Correo: <span className="font-mono">{email}</span>
            </p>
            <p className="text-bone">
              Contrasena temporal:{" "}
              <span className="text-ash">
                {state.data.tempPasswordInstruction}
              </span>
            </p>
            {state.data.tempPassword && (
              <p className="text-bone">
                Valor generado:{" "}
                <span className="font-mono">{state.data.tempPassword}</span>
              </p>
            )}
            <Button
              type="button"
              size="sm"
              className="mt-3"
              onClick={() =>
                navigator.clipboard.writeText(
                  [
                    "Cuenta creada",
                    `Correo: ${email}`,
                    `Contrasena temporal: ${state.data?.tempPassword ?? state.data?.tempPasswordInstruction}`,
                    "Debes cambiarla en el primer inicio de sesion.",
                  ].join("\n")
                )
              }
            >
              <Copy className="h-4 w-4" /> Copiar instrucciones
            </Button>
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href={`/admin/reservas/${state.data.reservaId}`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-ember-rust px-4 font-subhead uppercase tracking-wider text-cream">
            Ver invitación
          </Link>
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-signal-green px-4 font-subhead uppercase tracking-wider text-taller-night">
              <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <Section title="Cuenta y datos personales">
        <Field label="Nombre completo">
          <Input name="nombreCompleto" required minLength={3} maxLength={120} onChange={(e) => setNombre(e.target.value)} />
        </Field>
        <Field label="Correo">
          <Input name="email" type="email" required onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="WhatsApp">
          <Input name="telefono" type="tel" inputMode="tel" required placeholder="+57 300 123 4567" onChange={(e) => setTelefono(e.target.value)} />
        </Field>
      </Section>

      {state.error && <p className="text-signal-rust">{state.error}</p>}
      <Button type="submit" disabled={pending} size="lg" className="w-full">
        <Save className="h-5 w-5" /> {pending ? "Guardando..." : "Confirmar invitación"}
      </Button>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-taller-iron bg-taller-steel/25 p-4">
      <h2 className="mb-4 font-subhead text-sm uppercase tracking-widest text-ember-bright">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-subhead text-xs uppercase tracking-widest text-ash">{label}</span>
      {children}
    </label>
  );
}
