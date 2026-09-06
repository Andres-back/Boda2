import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { RegistroForm } from "./registro-form";

export const metadata = { title: "Crear cuenta | Alejandro & Ana" };

export default async function RegistroPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main id="main-content" className="relative min-h-svh overflow-hidden bg-[#fff9ee] px-4 py-8 text-[#4b403d] md:py-14">
      <Image src="/wedding/hero-mobile.webp" alt="" fill priority className="object-cover opacity-20" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,249,238,.7),rgba(255,249,238,.96))]" />
      <div className="relative mx-auto w-full max-w-lg">
        <Link href="/" className="mx-auto mb-7 flex w-fit items-center gap-2 font-display text-2xl text-[#5f4d49]">A <span className="font-[var(--font-parisienne)] text-[#a97718]">&</span> A</Link>
        <div className="mb-7 text-center">
          <Heart className="mx-auto h-8 w-8 text-[#b9726f]" strokeWidth={1.35} />
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.3em] text-[#a97718]">Nuestra boda</p>
          <h1 className="mt-2 font-display text-5xl leading-none text-[#403735]">Crea tu cuenta</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#7e716d]">Usaremos estos datos únicamente para tu confirmación, acompañantes, mesa y acceso.</p>
        </div>
        <RegistroForm next={next} />
        <p className="mt-6 text-center text-sm text-[#7e716d]">¿Ya tienes cuenta? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login?next=/reservar"} className="font-semibold text-[#7b625d] underline underline-offset-4">Inicia sesión</Link></p>
      </div>
    </main>
  );
}
