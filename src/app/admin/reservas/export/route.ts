import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

function csv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const reservas = await prisma.reserva.findMany({
    orderBy: { creadaEn: "desc" },
    include: { user: true, invitados: { orderBy: { numero: "asc" }, include: { mesa: true } } },
  });
  const rows: unknown[][] = [["Titular", "Correo", "Celular titular", "Invitado", "Celular invitado", "Estado confirmación", "Estado ingreso", "Código", "Mesa", "Silla", "Confirmada en"]];
  for (const reserva of reservas) {
    for (const invitado of reserva.invitados) {
      rows.push([reserva.user.nombreCompleto, reserva.user.email, reserva.user.telefono, invitado.nombreCompleto, invitado.telefono, reserva.estado, invitado.estado, invitado.codigo ?? "", invitado.mesa?.numero ?? "", invitado.silla ?? "", reserva.confirmadaEn?.toISOString() ?? ""]);
    }
  }
  const content = `\uFEFF${rows.map((row) => row.map(csv).join(",")).join("\r\n")}`;
  return new NextResponse(content, {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=invitados-boda-alejandro-ana.csv" },
  });
}
