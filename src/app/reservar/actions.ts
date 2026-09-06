"use server";

import { EstadoInvitado, EstadoReserva, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateEntradaCode } from "@/lib/code";
import { normalizePhoneE164 } from "@/lib/whatsapp";

const MAX_INVITADOS = 10;

export type ReservarState = {
  error: string | null;
  success?: boolean;
  fieldErrors?: { cantidad?: string; invitados?: string };
};

export async function crearOActualizarReserva(_prev: ReservarState, formData: FormData): Promise<ReservarState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Inicia sesión para confirmar tu asistencia." };

  const cantidad = Number(formData.get("cantidad"));
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > MAX_INVITADOS) {
    return { error: "Selecciona entre 1 y 10 invitados.", fieldErrors: { cantidad: "Cantidad inválida" } };
  }

  const titular = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nombreCompleto: true, email: true, telefono: true },
  });
  if (!titular?.nombreCompleto || !titular.telefono) return { error: "No pudimos encontrar tus datos de contacto." };

  const personas: { numero: number; nombreCompleto: string; telefono: string; emailContacto: string | null; codigo: string; estado: EstadoInvitado }[] = [
    {
      numero: 1,
      nombreCompleto: titular.nombreCompleto,
      telefono: titular.telefono,
      emailContacto: titular.email,
      codigo: generateEntradaCode(),
      estado: EstadoInvitado.CONFIRMADO,
    },
  ];

  for (let index = 2; index <= cantidad; index += 1) {
    const nombre = String(formData.get(`invitadoNombre${index}`) ?? "").trim();
    const telefonoRaw = String(formData.get(`invitadoTelefono${index}`) ?? "").trim();
    if (nombre.length < 3) {
      return { error: `Escribe el nombre completo del acompañante ${index - 1}.`, fieldErrors: { invitados: "Faltan nombres por completar" } };
    }
    const telefono = telefonoRaw ? normalizePhoneE164(telefonoRaw) : titular.telefono;
    if (!telefono) return { error: `Revisa el celular del acompañante ${index - 1}.`, fieldErrors: { invitados: "Celular inválido" } };
    personas.push({ numero: index, nombreCompleto: nombre, telefono, emailContacto: null, codigo: generateEntradaCode(), estado: EstadoInvitado.CONFIRMADO });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const previa = await tx.reserva.findUnique({
        where: { userId: session.user.id },
        select: { id: true, estado: true, invitados: { select: { estado: true, mesaId: true } } },
      });

      if (previa?.estado === EstadoReserva.ASISTIO || previa?.invitados.some((invitado) => invitado.estado === EstadoInvitado.ASISTIO)) {
        throw new Error("ASISTENCIA_REGISTRADA");
      }
      if (previa?.invitados.some((invitado) => invitado.mesaId)) throw new Error("MESAS_ASIGNADAS");

      const reserva = previa
        ? await tx.reserva.update({
            where: { id: previa.id },
            data: {
              valorTotal: 0,
              estado: EstadoReserva.CONFIRMADA,
              confirmadaEn: new Date(),
              canceladaEn: null,
              motivoCancelacion: null,
            },
            select: { id: true },
          })
        : await tx.reserva.create({
            data: { userId: session.user.id, valorTotal: 0, estado: EstadoReserva.CONFIRMADA, confirmadaEn: new Date() },
            select: { id: true },
          });

      if (previa) await tx.invitado.deleteMany({ where: { reservaId: reserva.id } });
      await tx.invitado.createMany({
        data: personas.map((persona) => ({ reservaId: reserva.id, ...persona })),
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Error && error.message === "ASISTENCIA_REGISTRADA") return { error: "La asistencia ya fue registrada y no puede modificarse." };
    if (error instanceof Error && error.message === "MESAS_ASIGNADAS") return { error: "Tu mesa ya fue asignada. Escríbenos al WhatsApp para solicitar un cambio." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "No pudimos emitir los códigos. Intenta confirmar nuevamente." };
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/reservar");
  revalidatePath("/mi-reserva");
  revalidatePath("/admin");
  revalidatePath("/admin/reservas");
  revalidatePath("/admin/mesas");
  return { error: null, success: true };
}

export type CancelarMiReservaState = { error: string | null; success?: boolean; fieldErrors?: { motivo?: string } };

export async function cancelarMiReserva(_prev: CancelarMiReservaState, formData: FormData): Promise<CancelarMiReservaState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Inicia sesión para continuar." };
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (motivo.length < 5) return { error: "Cuéntanos brevemente por qué no podrás acompañarnos.", fieldErrors: { motivo: "Mínimo 5 caracteres" } };
  if (motivo.length > 500) return { error: "El mensaje es demasiado largo.", fieldErrors: { motivo: "Máximo 500 caracteres" } };

  try {
    await prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.findUnique({
        where: { userId: session.user.id },
        select: { id: true, estado: true, invitados: { select: { estado: true } } },
      });
      if (!reserva) throw new Error("NO_HAY_RESERVA");
      if (reserva.estado === EstadoReserva.CANCELADO) throw new Error("YA_CANCELADA");
      if (reserva.invitados.some((invitado) => invitado.estado === EstadoInvitado.ASISTIO)) throw new Error("YA_INGRESO");
      await tx.invitado.updateMany({
        where: { reservaId: reserva.id },
        data: { estado: EstadoInvitado.PENDIENTE, codigo: null, mesaId: null, silla: null, adminIdAsignacion: null, fechaAsignacion: null },
      });
      await tx.reserva.update({
        where: { id: reserva.id },
        data: { estado: EstadoReserva.CANCELADO, motivoCancelacion: motivo, canceladaEn: new Date() },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NO_HAY_RESERVA") return { error: "No tienes una confirmación activa." };
    if (error instanceof Error && error.message === "YA_CANCELADA") return { error: "Tu confirmación ya estaba cancelada." };
    if (error instanceof Error && error.message === "YA_INGRESO") return { error: "La asistencia ya fue registrada y no puede cancelarse." };
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/mi-reserva");
  revalidatePath("/admin");
  revalidatePath("/admin/reservas");
  revalidatePath("/admin/mesas");
  return { error: null, success: true };
}

export type CancelarInvitadoState = { error: string | null; success?: boolean };
export async function cancelarInvitado(): Promise<CancelarInvitadoState> {
  return { error: "Edita la confirmación para cambiar tus acompañantes." };
}

export type AgregarInvitadosState = { error: string | null; success?: boolean; fieldErrors?: { cantidad?: string } };
export async function agregarInvitadosReserva(): Promise<AgregarInvitadosState> {
  return { error: "Usa la opción Editar confirmación para agregar acompañantes." };
}
