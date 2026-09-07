"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LoaderCircle, LogIn } from "lucide-react";
import { loginAction, type LoginState } from "@/app/auth-actions";

const schema = z.object({ email: z.string().email("Correo inválido"), password: z.string().min(8, "Mínimo 8 caracteres") });
type Values = z.infer<typeof schema>;
const initial: LoginState = { error: null };
const inputClass = "h-12 w-full rounded-xl border border-[#725784]/20 bg-white px-4 text-[#3f2d4b] outline-none transition focus:border-[#9a68b3] focus:ring-2 focus:ring-[#d8b9e8]/35";

export function LoginForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });
  const onSubmit = (data: Values) => startTransition(async () => {
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);
    if (next) formData.set("next", next);
    const result = await loginAction(initial, formData);
    if (result.error) { toast.error(result.error); setError("root", { message: result.error }); }
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-[28px] border border-white/70 bg-[#fffafe]/95 p-5 shadow-[0_28px_70px_rgba(71,43,88,.14)] backdrop-blur md:p-8">
      <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.18em] text-[#725784]">Correo electrónico</span><input type="email" autoComplete="email" className={inputClass} placeholder="tu@correo.com" {...register("email")} />{errors.email && <span className="mt-1 block text-xs text-[#a44949]">{errors.email.message}</span>}</label>
      <label className="mt-4 block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.18em] text-[#725784]">Contraseña</span><input type="password" autoComplete="current-password" className={inputClass} placeholder="••••••••" {...register("password")} />{errors.password && <span className="mt-1 block text-xs text-[#a44949]">{errors.password.message}</span>}</label>
      {errors.root && <p className="mt-4 rounded-xl bg-[#c96d6d]/10 p-3 text-sm text-[#a44949]">{errors.root.message}</p>}
      <button type="submit" disabled={pending} className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#5b3f6d] text-[10px] font-bold uppercase tracking-[.17em] text-white shadow-lg transition hover:bg-[#725784] disabled:opacity-60">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}{pending ? "Ingresando" : "Continuar"}</button>
    </form>
  );
}
