import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Iniciar sesión | Alejandro & Ana" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; from?: string }> }) {
  const { next, from } = await searchParams;
  const target = from || next || "/admin";
  const isAdmin = target.startsWith("/admin");
  return (
    <main id="main-content" className="relative flex min-h-svh items-center overflow-hidden bg-[#fff9ee] px-4 py-10 text-[#4b403d]">
      <Image src="/wedding/hero-mobile.webp" alt="" fill priority className="object-cover opacity-20" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,249,238,.76),rgba(255,249,238,.97))]" />
      <div className="relative mx-auto w-full max-w-md">
        <Link href="/" className="mx-auto mb-7 flex w-fit items-center gap-2 font-display text-2xl text-[#5f4d49]">A <span className="font-[var(--font-parisienne)] text-[#a97718]">&</span> A</Link>
        <div className="mb-7 text-center"><Heart className="mx-auto h-8 w-8 text-[#b9726f]" strokeWidth={1.35} /><p className="mt-4 text-[10px] font-semibold uppercase tracking-[.3em] text-[#a97718]">{isAdmin ? "Administración" : "Nuestra boda"}</p><h1 className="mt-2 font-display text-5xl leading-none text-[#403735]">Inicia sesión</h1><p className="mt-3 text-sm text-[#7e716d]">{isAdmin ? "Acceso para la organización de la boda." : "Consulta tu confirmación, pases y mesa."}</p></div>
        <LoginForm next={target} />
        {!isAdmin && <p className="mt-6 text-center text-sm text-[#7e716d]">¿Aún no tienes cuenta? <Link href={`/registro?next=${encodeURIComponent(target)}`} className="font-semibold text-[#7b625d] underline underline-offset-4">Créala aquí</Link></p>}
      </div>
    </main>
  );
}
