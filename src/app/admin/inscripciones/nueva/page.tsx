import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NuevaInscripcionForm } from "./nueva-inscripcion-form";

export const metadata = { title: "Nueva invitación | Administración" };

export default async function NuevaInscripcionPage() {


  return (
    <main className="px-3 py-4 md:px-8 md:py-8">
      <Link
        href="/admin/reservas"
        className="mb-4 inline-flex min-h-[44px] items-center gap-1 font-subhead text-base uppercase tracking-wider text-ash hover:text-ember-bright"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a invitados
      </Link>

      <div className="mb-6">
        <p className="font-subhead text-sm uppercase tracking-widest text-ash">
          Administracion
        </p>
        <h1 className="mt-1 flex items-center gap-2 font-display text-2xl text-cream md:text-3xl">
          <UserPlus className="h-6 w-6 text-ember-bright" />
          Añadir invitación
        </h1>
        <p className="mt-1 max-w-2xl text-base text-bone">
          Confirma la invitación del titular. Su pase QR queda listo y podrá registrar a sus acompañantes desde su cuenta.
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Datos de la persona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NuevaInscripcionForm />
        </CardContent>
      </Card>
    </main>
  );
}
