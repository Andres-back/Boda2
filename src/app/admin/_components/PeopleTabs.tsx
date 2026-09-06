import Link from "next/link";

export function PeopleTabs({ active }: { active: "invitados" | "cuentas" }) {
  return <section className="mb-6 rounded-2xl border border-taller-iron p-4">
    <nav aria-label="Gestión de invitados" className="flex flex-wrap gap-2">
      {[
        { id: "invitados", href: "/admin/reservas", label: "Invitados y acompañantes" },
        { id: "cuentas", href: "/admin/usuarios", label: "Cuentas de acceso" },
      ].map(tab => <Link key={tab.id} href={tab.href} aria-current={active === tab.id ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm ${active === tab.id ? "bg-ember-rust text-white" : "text-bone hover:bg-white/5"}`}>{tab.label}</Link>)}
      <Link href="/admin/inscripciones/nueva" className="inline-flex min-h-11 items-center rounded-xl border border-taller-iron px-4 text-sm text-bone">Añadir invitación</Link>
    </nav>
    <p className="mt-3 text-sm text-ash">Una cuenta corresponde al titular de una invitación. Desde ella gestiona sus acompañantes; cada persona tiene su propio QR y mesa, sin crear otra cuenta.</p>
  </section>;
}
