"use client";

import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { HeartHandshake, LoaderCircle, LockKeyhole } from "lucide-react";
import { registrarUsuario, type RegistroState } from "@/app/auth-actions";
import { PhoneInput } from "@/components/ui/phone-input";

const formSchema = z.object({
  nombreCompleto: z.string().min(3, "Escribe tu nombre completo").max(120),
  email: z.string().email("Correo inválido"),
  telefono: z.string().regex(/^\d{10}$/, "Ingresa 10 dígitos"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});
type FormValues = z.infer<typeof formSchema>;
const initial: RegistroState = { error: null };
const inputClass = "h-12 w-full rounded-xl border border-[#725784]/20 bg-white/80 px-4 text-[#3f2d4b] outline-none transition focus:border-[#9a68b3] focus:ring-2 focus:ring-[#d8b9e8]/35";

export function RegistroForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, setError, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const onSubmit = (data: FormValues) => startTransition(async () => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => formData.set(key, value));
    if (next) formData.set("next", next);
    const result = await registrarUsuario(initial, formData);
    if (!result.error) return;
    toast.error(result.error);
    setError("root", { message: result.error });
    Object.entries(result.fieldErrors ?? {}).forEach(([key, message]) => {
      if (message) setError(key as keyof FormValues, { message });
    });
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-[28px] border border-white/70 bg-[#fffafe]/95 p-5 shadow-[0_28px_70px_rgba(71,43,88,.14)] backdrop-blur md:p-8">
      <div className="space-y-4">
        <Field label="Nombre completo" error={errors.nombreCompleto?.message}><input className={inputClass} autoComplete="name" placeholder="Tu nombre y apellido" {...register("nombreCompleto")} /></Field>
        <Field label="Celular / WhatsApp" error={errors.telefono?.message}><Controller name="telefono" control={control} render={({ field }) => <PhoneInput value={field.value} onChange={field.onChange} className={inputClass} />} /></Field>
        <Field label="Correo electrónico" error={errors.email?.message}><input className={inputClass} type="email" autoComplete="email" placeholder="tu@correo.com" {...register("email")} /></Field>
        <Field label="Crea una contraseña" error={errors.password?.message}><input className={inputClass} type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" {...register("password")} /></Field>
      </div>
      {errors.root && <p className="mt-4 rounded-xl bg-[#c96d6d]/10 p-3 text-sm text-[#a44949]">{errors.root.message}</p>}
      <button type="submit" disabled={pending} className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#5b3f6d] px-6 text-[11px] font-bold uppercase tracking-[.17em] text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#725784] disabled:opacity-60">
        {pending ? <><LoaderCircle className="h-4 w-4 animate-spin" />Creando cuenta</> : <><HeartHandshake className="h-4 w-4" />Continuar a confirmar</>}
      </button>
      <p className="mt-5 flex items-start justify-center gap-2 text-center text-xs leading-5 text-[#75667d]"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />Tus datos se usan solo para la organización de la boda.</p>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.18em] text-[#725784]">{label}</span>{children}{error && <span className="mt-1 block text-xs text-[#a44949]">{error}</span>}</label>;
}
