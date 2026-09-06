"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { EstadoInvitado, EstadoReserva, Prisma, Rol } from "@prisma/client";

import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import {
  MESA_CAPACIDAD_MAX,
  MESA_CAPACIDAD_MIN,
} from "@/lib/constants";
import { updateTag } from "next/cache";
import { parseBogotaInput } from "@/lib/wedding-event";
import { prisma } from "@/lib/db";
import {
  ACCESS_CODE_FORMAT,
  ACCESS_CODE_REGEX,
  normalizeAccessCode,
} from "@/lib/access-code";
import { generateEntradaCode, generateTempPassword } from "@/lib/code";
import { hashPassword, verifyPassword } from "@/lib/password";


import { normalizePhoneE164, normalizeWhatsAppNumber } from "@/lib/whatsapp";

import type {
  AdminActionResult,
  ConfirmarIngresoResult,
  OperacionInvitadoResult,
  ValidarIngreso,
  ValidarReserva,
  ValidarResult,
} from "@/lib/types";

// ============================================================
// Helpers
// ============================================================

const idSchema = z.string().regex(/^[a-z0-9]{25}$/, "ID inválido");

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login?next=/admin");
  }
  return session;
}

const phoneSchema = z
  .string()
  .trim()
  .transform((value) => normalizePhoneE164(value))
  .pipe(z.string().min(1, "Telefono invalido: usa entre 7 y 15 digitos"));



// ============================================================
// Serializers
// ============================================================

type ReservaForSerialize = {
  id: string;
  estado: EstadoReserva;
  user: { nombreCompleto: string; telefono: string };
  invitados: {
    id: string;
    numero: number;
    nombreCompleto: string;
    telefono: string;
    estado: EstadoInvitado;
    codigo: string | null;
    mesaId: string | null;
    mesa?: { numero: number } | null;
    silla: number | null;
    registradoEn: Date | null;
    ultimoReingresoEn: Date | null;
    reingresos: number;


  }[];
};

type InvitadoForSerialize = ReservaForSerialize["invitados"][number];

function serializeInvitado(invitado: InvitadoForSerialize): ValidarIngreso {
  return {
    id: invitado.id,
    numero: invitado.numero,
    nombreCompleto: invitado.nombreCompleto,
    telefono: invitado.telefono,
    estado: invitado.estado,
    codigo: invitado.codigo,
    mesaId: invitado.mesaId,
    mesaNumero: invitado.mesa?.numero ?? null,
    silla: invitado.silla,
    registradoEn: invitado.registradoEn,
    ultimoReingresoEn: invitado.ultimoReingresoEn,
    reingresos: invitado.reingresos,


  };
}

function serializeReserva(reserva: ReservaForSerialize): ValidarReserva {
  const cantidadIngresados = reserva.invitados.filter(
    (i) => i.estado === EstadoInvitado.ASISTIO
  ).length;
  return {
    id: reserva.id,
    estado: reserva.estado,
    cantidadAsistentes: reserva.invitados.length,
    cantidadIngresados,
    invitados: reserva.invitados
      .sort((a, b) => a.numero - b.numero)
      .map(serializeInvitado),
    nombre: reserva.user.nombreCompleto,
    telefono: reserva.user.telefono,
  };
}

// ============================================================
// VALIDAR CODIGO (validador puerta, ADR-011)
// ============================================================

export async function validarCodigo(
  _prev: ValidarResult | null,
  formData: FormData
): Promise<ValidarResult> {
  await requireAdmin();
  const raw = String(formData.get("codigo") ?? "");
  const codigo = normalizeAccessCode(raw);

  if (!ACCESS_CODE_REGEX.test(codigo)) {
    return {
      estado: "no_encontrado",
      codigo: raw,
      mensaje: `Código inválido. Verifica el formato ${ACCESS_CODE_FORMAT}.`,
    };
  }

  const invitado = await prisma.invitado.findUnique({
    where: { codigo },
    include: {
      mesa: { select: { numero: true } },
      reserva: {
        include: {
          user: { select: { nombreCompleto: true, telefono: true } },
          invitados: {
            orderBy: { numero: "asc" },
            include: { mesa: { select: { numero: true } } },
          },
        },
      },
    },
  });

  if (!invitado) {
    return {
      estado: "no_encontrado",
      codigo,
      mensaje: "No encontré ningún código de entrada con ese valor.",
    };
  }

  const reservaPayload = serializeReserva(invitado.reserva);
  const invitadoPayload = serializeInvitado(invitado);

  if (invitado.reserva.estado === EstadoReserva.CANCELADO) {
    return {
      estado: "cancelado",
      codigo,
      mensaje: "Reserva cancelada. Código sin vigencia.",
      reserva: reservaPayload,
      invitado: invitadoPayload,
    };
  }

  if (invitado.estado === EstadoInvitado.PENDIENTE) {
    return {
      estado: "no_confirmado",
      codigo,
      mensaje: "Invitación sin confirmar. Código aún no habilitado.",
      reserva: reservaPayload,
      invitado: invitadoPayload,
    };
  }

  if (invitado.estado === EstadoInvitado.ASISTIO || invitado.registradoEn !== null) {
    return {
      estado: "reingreso",
      codigo,
      mensaje: `Primer ingreso a las ${
        invitado.registradoEn?.toLocaleTimeString("es-CO", {
          hour: "numeric",
          minute: "2-digit",
        }) ?? "?"
      }. Reingreso permitido.`,
      reserva: reservaPayload,
      invitado: invitadoPayload,
    };
  }

  return {
    estado: "ok",
    codigo,
    mensaje: "Válido. Dejar entrar.",
    reserva: reservaPayload,
    invitado: invitadoPayload,
  };
}

// ============================================================
// CONFIRMAR INGRESO (1 persona entra)
// ============================================================

export async function confirmarIngreso(
  invitadoId: string
): Promise<ConfirmarIngresoResult> {
  await requireAdmin();
  const idResult = idSchema.safeParse(invitadoId);
  if (!idResult.success) return { success: false, error: "ID de invitado inválido." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const invitado = await tx.invitado.findUnique({
        where: { id: invitadoId },
        include: {
          mesa: { select: { numero: true } },
          reserva: {
            include: {
              user: { select: { nombreCompleto: true, telefono: true } },
              invitados: {
                orderBy: { numero: "asc" },
                include: { mesa: { select: { numero: true } } },
              },
            },
          },
        },
      });

      if (!invitado) throw new Error("INVITADO_NO_EXISTE");
      if (invitado.estado === EstadoInvitado.ASISTIO || invitado.registradoEn !== null) {
        throw new Error("INVITADO_YA_ENTRO");
      }
      if (invitado.estado !== EstadoInvitado.CONFIRMADO) {
        throw new Error("INVITADO_NO_CONFIRMADO");
      }
      if (invitado.reserva.estado === EstadoReserva.CANCELADO) {
        throw new Error("RESERVA_CANCELADA");
      }

    const ahora = new Date();
    await tx.invitado.update({
      where: { id: invitadoId },
      data: { estado: EstadoInvitado.ASISTIO, registradoEn: ahora },
    });

    // Contar invitados en estado ASISTIO de la reserva
    const totalAsistieron = await tx.invitado.count({
      where: { reservaId: invitado.reservaId, estado: EstadoInvitado.ASISTIO },
    });
    // Total de invitados confirmados, incluidos quienes ya ingresaron.
    const totalConfirmados = await tx.invitado.count({
      where: {
        reservaId: invitado.reservaId,
        estado: { in: [EstadoInvitado.CONFIRMADO, EstadoInvitado.ASISTIO] },
      },
    });

    const grupoCompleto = totalAsistieron === totalConfirmados;
    const newReservaEstado =
      grupoCompleto && totalConfirmados > 0
        ? EstadoReserva.ASISTIO
        : invitado.reserva.estado === EstadoReserva.PENDIENTE
        ? EstadoReserva.CONFIRMADA
        : invitado.reserva.estado;

    await tx.reserva.update({
      where: { id: invitado.reservaId },
      data: {
        ...(grupoCompleto && totalConfirmados > 0
          ? { estado: EstadoReserva.ASISTIO, asistioEn: ahora }
          : {
              estado: newReservaEstado,
            }),
      },
    });

    const updated = await tx.reserva.findUniqueOrThrow({
      where: { id: invitado.reservaId },
      include: {
        user: { select: { nombreCompleto: true, telefono: true } },
        invitados: {
          orderBy: { numero: "asc" },
          include: { mesa: { select: { numero: true } } },
        },
      },
    });

    const invitadoUpdated = updated.invitados.find((i) => i.id === invitadoId)!;
    return {
      message: grupoCompleto
        ? `Grupo completo. ${totalAsistieron}/${updated.invitados.length}.`
        : `Persona adentro. ${totalAsistieron}/${updated.invitados.length} en el grupo.`,
      reserva: serializeReserva(updated),
      invitado: serializeInvitado(invitadoUpdated),
    };
  });

  revalidatePath("/admin/validar");
  revalidatePath("/admin/reservas");
  revalidatePath(`/admin/reservas/${result.reserva.id}`);
  revalidatePath("/admin/mesas");
  revalidatePath("/mi-reserva");
  return { success: true, ...result };
  } catch (err) {
    if (err instanceof Error) {
      const msg = err.message;
      if (msg === "INVITADO_NO_EXISTE") return { success: false, error: "Invitado no encontrado." };
      if (msg === "INVITADO_YA_ENTRO") return { success: false, error: "Este invitado ya ingresó." };
      if (msg === "INVITADO_NO_CONFIRMADO") return { success: false, error: "El invitado no ha confirmado todavía." };
      if (msg === "RESERVA_CANCELADA") return { success: false, error: "La reserva fue cancelada." };
    }
    throw err;
  }
}

export async function confirmarReingreso(
  invitadoId: string
): Promise<OperacionInvitadoResult> {
  await requireAdmin();
  const idResult = idSchema.safeParse(invitadoId);
  if (!idResult.success) return { success: false, error: "ID de invitado inválido." };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const invitado = await tx.invitado.findUnique({
        where: { id: invitadoId },
        include: {
          mesa: { select: { numero: true } },
          reserva: {
            include: {
              user: { select: { nombreCompleto: true, telefono: true } },
              invitados: {
                orderBy: { numero: "asc" },
                include: { mesa: { select: { numero: true } } },
              },
            },
          },
        },
      });

      if (!invitado) throw new Error("INVITADO_NO_EXISTE");
      if (invitado.reserva.estado === EstadoReserva.CANCELADO) {
        throw new Error("RESERVA_CANCELADA");
      }
      if (invitado.estado !== EstadoInvitado.ASISTIO || !invitado.registradoEn) {
        throw new Error("INVITADO_SIN_INGRESO");
      }

      const ahora = new Date();
      await tx.invitado.update({
        where: { id: invitadoId },
        data: {
          reingresos: { increment: 1 },
          ultimoReingresoEn: ahora,
        },
      });

      const updated = await tx.reserva.findUniqueOrThrow({
        where: { id: invitado.reservaId },
        include: {
          user: { select: { nombreCompleto: true, telefono: true } },
          invitados: {
            orderBy: { numero: "asc" },
            include: { mesa: { select: { numero: true } } },
          },
        },
      });

      const invitadoUpdated = updated.invitados.find((i) => i.id === invitadoId)!;
      return {
        message: `Reingreso registrado. Total: ${invitadoUpdated.reingresos}.`,
        reserva: serializeReserva(updated),
        invitado: serializeInvitado(invitadoUpdated),
      };
    });

    revalidatePath("/admin/validar");
    revalidatePath("/admin/reservas");
    revalidatePath(`/admin/reservas/${result.reserva.id}`);
    revalidatePath("/mi-reserva");
    return { success: true, ...result };
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "INVITADO_NO_EXISTE") return { success: false, error: "Invitado no encontrado." };
      if (err.message === "RESERVA_CANCELADA") return { success: false, error: "La reserva fue cancelada." };
      if (err.message === "INVITADO_SIN_INGRESO") return { success: false, error: "Primero registra el ingreso inicial." };
    }
    throw err;
  }
}



const asignarMesaSchema = z.object({
  invitadoId: idSchema,
  mesaId: idSchema,
  silla: z.coerce.number().int().min(1),
});

export async function asignarMesa(
  formData: FormData
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const adminId = session.user.id;

  const parsed = asignarMesaSchema.safeParse({
    invitadoId: formData.get("invitadoId"),
    mesaId: formData.get("mesaId"),
    silla: formData.get("silla"),
  });
  if (!parsed.success) {
    return { error: "Datos inválidos." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const mesa = await tx.mesa.findUnique({
        where: { id: parsed.data.mesaId },
      });
      if (!mesa) throw new Error("MESA_NO_EXISTE");
      if (parsed.data.silla > mesa.capacidad) {
        throw new Error("SILLA_FUERA_DE_RANGO");
      }
      const invitado = await tx.invitado.findUnique({
        where: { id: parsed.data.invitadoId },
      });
      if (!invitado) throw new Error("INVITADO_NO_EXISTE");

      // Verificar que la silla esté libre en esta mesa
      const ocupado = await tx.invitado.findFirst({
        where: {
          mesaId: parsed.data.mesaId,
          silla: parsed.data.silla,
          NOT: { id: parsed.data.invitadoId },
        },
      });
      if (ocupado) {
        throw new Error("SILLA_OCUPADA");
      }

      await tx.invitado.update({
        where: { id: parsed.data.invitadoId },
        data: {
          mesaId: parsed.data.mesaId,
          silla: parsed.data.silla,
          adminIdAsignacion: adminId,
          fechaAsignacion: new Date(),
        },
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Esa silla ya está ocupada. Elija otra." };
    }
    if (err instanceof Error) {
      if (err.message === "SILLA_OCUPADA") return { error: "Esa silla ya está ocupada por otra persona." };
      if (err.message === "MESA_NO_EXISTE") return { error: "La mesa no existe. Recargue la página." };
      if (err.message === "INVITADO_NO_EXISTE") return { error: "La persona no existe. Recargue la página." };
      if (err.message === "SILLA_FUERA_DE_RANGO") return { error: "La silla está fuera del rango de la mesa." };
    }
    throw err;
  }

  revalidatePath("/admin/mesas");
  revalidatePath("/admin/reservas");
  revalidatePath("/mi-reserva");
  return { error: null, success: true, message: "Mesa asignada." };
}

/** Quita la mesa+silla de un invitado. */
export async function quitarDeMesa(
  invitadoId: string
): Promise<AdminActionResult> {
  await requireAdmin();
  const idResult = idSchema.safeParse(invitadoId);
  if (!idResult.success) return { error: "ID de invitado inválido." };
  try {
    await prisma.invitado.update({
      where: { id: invitadoId },
      data: { mesaId: null, silla: null, fechaAsignacion: null },
    });
  } catch {
    return { error: "Error al quitar la mesa. Intentá de nuevo." };
  }
  revalidatePath("/admin/mesas");
  revalidatePath("/admin/reservas");
  revalidatePath("/mi-reserva");
  return { error: null, success: true, message: "Mesa removida." };
}

// ============================================================
// MESAS: crear, eliminar, cambiar capacidad
// ============================================================

const crearMesaSchema = z.object({
  capacidad: z.coerce
    .number()
    .int()
    .min(MESA_CAPACIDAD_MIN, `Mínimo ${MESA_CAPACIDAD_MIN} sillas`)
    .max(MESA_CAPACIDAD_MAX, `Máximo ${MESA_CAPACIDAD_MAX} sillas`),
});

export async function crearMesa(
  formData: FormData
): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = crearMesaSchema.safeParse({
    capacidad: formData.get("capacidad") ?? 8,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    const mesa = await prisma.$transaction(async (tx) => {
      const last = await tx.mesa.findFirst({
        orderBy: { numero: "desc" },
        select: { numero: true },
      });
      const nextNumero = (last?.numero ?? 0) + 1;
      return tx.mesa.create({
        data: { numero: nextNumero, capacidad: parsed.data.capacidad },
      });
    });
    revalidatePath("/admin/mesas");
    return {
      error: null,
      success: true,
      message: `Mesa ${mesa.numero} creada.`,
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Alguien más creó una mesa al mismo tiempo. Intentalo de nuevo." };
    }
    throw err;
  }
}

export async function eliminarMesa(mesaId: string): Promise<AdminActionResult> {
  await requireAdmin();
  const idResult = idSchema.safeParse(mesaId);
  if (!idResult.success) return { error: "ID de mesa inválido." };
  try {
    await prisma.$transaction(async (tx) => {
      const ocupados = await tx.invitado.count({
        where: { mesaId, silla: { not: null } },
      });
      if (ocupados > 0) {
        throw new Error(
          `No se puede eliminar: hay ${ocupados} invitado${ocupados === 1 ? "" : "s"} sentado${ocupados === 1 ? "" : "s"}.`
        );
      }
      // Limpiar sillas huerfanas (seguridad: mesaId=null pero silla seteada)
      await tx.invitado.updateMany({
        where: { mesaId, silla: { not: null } },
        data: { silla: null },
      });
      await tx.mesa.delete({ where: { id: mesaId } });
    });
    revalidatePath("/admin/mesas");
    return { error: null, success: true, message: "Mesa eliminada." };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("No se puede eliminar")) {
      return { error: err.message };
    }
    throw err;
  }
}

const cambiarCapacidadSchema = z.object({
  mesaId: idSchema,
  capacidad: z.coerce
    .number()
    .int()
    .min(MESA_CAPACIDAD_MIN)
    .max(MESA_CAPACIDAD_MAX),
});

export async function cambiarCapacidadMesa(
  formData: FormData
): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = cambiarCapacidadSchema.safeParse({
    mesaId: formData.get("mesaId"),
    capacidad: formData.get("capacidad"),
  });
  if (!parsed.success) {
    return { error: "Datos inválidos." };
  }

  // Si la nueva capacidad es menor, asegurar que no hay sillas fuera de rango
  const fueraDeRango = await prisma.invitado.count({
    where: { mesaId: parsed.data.mesaId, silla: { gt: parsed.data.capacidad } },
  });
  if (fueraDeRango > 0) {
    return {
      error: `Hay ${fueraDeRango} invitado${
        fueraDeRango === 1 ? "" : "s"
      } sentado${fueraDeRango === 1 ? "" : "s"} en sillas que exceden la nueva capacidad. Muévelos primero.`,
    };
  }

  await prisma.mesa.update({
    where: { id: parsed.data.mesaId },
    data: { capacidad: parsed.data.capacidad },
  });
  revalidatePath("/admin/mesas");
  return { error: null, success: true, message: "Capacidad actualizada." };
}

// ============================================================
// CANCELAR RESERVA (admin)
// ============================================================

export async function cancelarReserva(reservaId: string, formData: FormData): Promise<AdminActionResult> {
  await requireAdmin();
  if (!idSchema.safeParse(reservaId).success) return { error: "ID de invitación inválido." };
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (motivo.length < 5 || motivo.length > 500) return { error: "Escribe un motivo de entre 5 y 500 caracteres." };
  try {
    await prisma.$transaction(async tx => {
      const reserva = await tx.reserva.findUnique({ where: { id: reservaId }, include: { invitados: true } });
      if (!reserva) throw new Error("Invitación no encontrada.");
      if (reserva.invitados.some(i => i.estado === EstadoInvitado.ASISTIO || i.registradoEn)) throw new Error("No se puede cancelar una invitación con ingresos registrados.");
      await tx.invitado.updateMany({ where: { reservaId }, data: {
        estado: EstadoInvitado.PENDIENTE, mesaId: null, silla: null, adminIdAsignacion: null, fechaAsignacion: null,
      } });
      await tx.reserva.update({ where: { id: reservaId }, data: {
        estado: EstadoReserva.CANCELADO, motivoCancelacion: motivo, canceladaEn: new Date(),
      } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") return { error: "La invitación cambió mientras se cancelaba. Recarga e intenta de nuevo." };
    if (error instanceof Error) return { error: error.message };
    throw error;
  }
  revalidatePath("/admin");
  revalidatePath("/admin/reservas");
  revalidatePath(`/admin/reservas/${reservaId}`);
  revalidatePath("/admin/mesas");
  revalidatePath("/mi-reserva");
  return { error: null, success: true, message: "Invitación cancelada. Sus pases quedan inactivos y sus sillas disponibles." };
}

export async function reactivarReserva(reservaId: string): Promise<AdminActionResult> {
  await requireAdmin();
  if (!idSchema.safeParse(reservaId).success) return { error: "ID de invitación inválido." };
  try {
    await prisma.$transaction(async tx => {
      const reserva = await tx.reserva.findUnique({ where: { id: reservaId }, include: { invitados: true } });
      if (!reserva) throw new Error("Invitación no encontrada.");
      if (reserva.estado !== EstadoReserva.CANCELADO) throw new Error("La invitación ya está activa.");
      if (!reserva.invitados.length) throw new Error("La invitación no tiene personas registradas.");
      for (const invitado of reserva.invitados) {
        await tx.invitado.update({ where: { id: invitado.id }, data: {
          estado: invitado.registradoEn ? EstadoInvitado.ASISTIO : EstadoInvitado.CONFIRMADO,
          codigo: invitado.codigo ?? generateEntradaCode(),
        } });
      }
      await tx.reserva.update({ where: { id: reservaId }, data: {
        estado: reserva.invitados.every(i => i.registradoEn) ? EstadoReserva.ASISTIO : EstadoReserva.CONFIRMADA,
        confirmadaEn: new Date(), motivoCancelacion: null, canceladaEn: null,
      } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) return { error: "No se pudo reactivar. Recarga e intenta nuevamente." };
    if (error instanceof Error) return { error: error.message };
    throw error;
  }
  revalidatePath("/admin");
  revalidatePath("/admin/reservas");
  revalidatePath(`/admin/reservas/${reservaId}`);
  revalidatePath("/admin/mesas");
  revalidatePath("/mi-reserva");
  return { error: null, success: true, message: "Invitación reactivada y pases habilitados." };
}

// ============================================================
// RESETEAR CONTRASENA DE USUARIO (admin, ADR-009)
// ============================================================

export type ResetearContrasenaResult = {
  success: boolean;
  error?: string;
  contrasenaTemporal?: string;
};

export async function resetearContrasenaUsuario(
  userId: string
): Promise<ResetearContrasenaResult> {
  const session = await requireAdmin();
  const idResult = idSchema.safeParse(userId);
  if (!idResult.success) return { success: false, error: "ID de usuario inválido." };
  if (userId === session.user.id) {
    return {
      success: false,
      error: "Usa /admin/cuenta para cambiar tu propia contraseña.",
    };
  }
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, nombreCompleto: true },
  });
  if (!target) {
    return { success: false, error: "Usuario no encontrado." };
  }
  const pwd = generateTempPassword();
  const passwordHash = await hashPassword(pwd);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, debeCambiarContrasena: true },
  });
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/reservas");
  return { success: true, contrasenaTemporal: pwd };
}

// ============================================================
// CAMBIAR MI CONTRASENA (admin, ADR-009)
// ============================================================

const cambiarMiSchema = z
  .object({
    actual: z.string().min(1, "Ingresa tu contraseña actual"),
    nueva: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(72, "Máximo 72 caracteres"),
    confirmar: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(72, "Máximo 72 caracteres"),
  })
  .refine((d) => d.nueva === d.confirmar, {
    path: ["confirmar"],
    message: "No coinciden",
  });

export type CambiarMiContrasenaState = {
  error: string | null;
  fieldErrors?: { actual?: string; nueva?: string; confirmar?: string };
  success?: boolean;
};

export async function cambiarMiContrasena(
  _prev: CambiarMiContrasenaState,
  formData: FormData
): Promise<CambiarMiContrasenaState> {
  const session = await requireAdmin();
  const parsed = cambiarMiSchema.safeParse({
    actual: String(formData.get("actual") ?? ""),
    nueva: String(formData.get("nueva") ?? ""),
    confirmar: String(formData.get("confirmar") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: CambiarMiContrasenaState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "actual" || key === "nueva" || key === "confirmar") {
        fieldErrors[key] = issue.message;
      }
    }
    return { error: "Revisa los datos.", fieldErrors };
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Sesion invalida." };
  const ok = await verifyPassword(parsed.data.actual, user.passwordHash);
  if (!ok) {
    return {
      error: "La contraseña actual no coincide.",
      fieldErrors: { actual: "Incorrecta" },
    };
  }
  const newHash = await hashPassword(parsed.data.nueva);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash, debeCambiarContrasena: false },
  });
  await signOut({ redirect: false });
  return { error: null, success: true };
}

// ============================================================
// ACTUALIZAR CONFIGURACION DEL EVENTO (admin)
// ============================================================

const actualizarConfiguracionSchema = z
  .object({
    nombre: z.string().min(1, "Requerido").max(100),
    fecha: z.string().transform(parseBogotaInput).pipe(z.date({ errorMap: () => ({ message: "Fecha inválida" }) })),
    horaRecepcion: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida"),
    puertas: z.string().min(1, "Requerido").max(20),
    lugar: z.string().min(1, "Requerido").max(200),
    barrio: z.string().max(100).optional().nullable(),
    ciudad: z.string().max(100).optional().nullable(),

    organizadorNombre: z.string().min(1, "Requerido").max(100),
    organizadorEmail: z.string().email("Email inválido").max(200),
    organizadorTelefono: z
      .string()
      .min(7, "Teléfono inválido")
      .max(20)
      .regex(/^\+?[0-9\s-]+$/, "Solo dígitos, espacios, guiones y opcional +"),
    organizadorWhatsapp: z
      .string()
      .trim()
      .transform((value) => normalizeWhatsAppNumber(value))
      .pipe(z.string().min(1, "WhatsApp invalido")),
  });

export type ActualizarConfiguracionState = {
  error: string | null;
  fieldErrors?: Partial<Record<keyof z.infer<typeof actualizarConfiguracionSchema>, string>>;
  success?: boolean;
  message?: string;
};

export async function actualizarConfiguracion(
  _prev: ActualizarConfiguracionState,
  formData: FormData
): Promise<ActualizarConfiguracionState> {
  const session = await requireAdmin();
  const adminId = session.user.id;

  // Normalizar strings opcionales: vacios -> null
  const barrio = String(formData.get("barrio") ?? "").trim();
  const ciudad = String(formData.get("ciudad") ?? "").trim();

  const parsed = actualizarConfiguracionSchema.safeParse({
    nombre: String(formData.get("nombre") ?? "").trim(),
    fecha: formData.get("fecha"),
    horaRecepcion: formData.get("horaRecepcion"),
    puertas: String(formData.get("puertas") ?? "").trim(),
    lugar: String(formData.get("lugar") ?? "").trim(),
    barrio: barrio || null,
    ciudad: ciudad || null,
    organizadorNombre: String(formData.get("organizadorNombre") ?? "").trim(),
    organizadorEmail: String(formData.get("organizadorEmail") ?? "").trim(),
    organizadorTelefono: String(formData.get("organizadorTelefono") ?? "").trim(),
    organizadorWhatsapp: String(formData.get("organizadorWhatsapp") ?? "").trim(),
  });

  if (!parsed.success) {
    const fieldErrors: ActualizarConfiguracionState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") {
        fieldErrors[key as keyof typeof fieldErrors] = issue.message;
      }
    }
    return { error: "Revisa los datos.", fieldErrors };
  }

  await prisma.configuracion.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...parsed.data, precioPorPersona: 0, actualizadoPorId: adminId },
    update: { ...parsed.data, precioPorPersona: 0, actualizadoPorId: adminId },
  });

  updateTag("configuracion");
  revalidatePath("/");
  revalidatePath("/admin/evento");

  return {
    error: null,
    success: true,
    message: "Configuración actualizada.",
  };
}

// ============================================================
// CRUD USUARIOS (admin)
// ============================================================

const adminUsuarioSchema = z.object({
  nombreCompleto: z.string().min(3, "Nombre muy corto").max(80),
  email: z.string().email("Email inválido").toLowerCase(),
  telefono: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{10}$/, "Celular colombiano de 10 dígitos"))
    .transform((digits) => `+57${digits}`),
  rol: z.nativeEnum(Rol).default(Rol.USUARIO),
});

const crearUsuarioSchema = adminUsuarioSchema.extend({
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

export async function crearUsuarioAdmin(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = crearUsuarioSchema.safeParse({
    nombreCompleto: formData.get("nombreCompleto"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    rol: formData.get("rol") || Rol.USUARIO,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  try {
    await prisma.user.create({
      data: {
        nombreCompleto: parsed.data.nombreCompleto,
        email: parsed.data.email,
        telefono: parsed.data.telefono,
        rol: parsed.data.rol,
        passwordHash: await hashPassword(parsed.data.password),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ya existe un usuario con ese email." };
    }
    throw err;
  }

  revalidatePath("/admin/usuarios");
  return { error: null, success: true, message: "Usuario creado." };
}

export async function editarUsuarioAdmin(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const idResult = idSchema.safeParse(userId);
  if (!idResult.success) return { error: "ID de usuario inválido." };

  const parsed = adminUsuarioSchema.safeParse({
    nombreCompleto: formData.get("nombreCompleto"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    rol: formData.get("rol") || Rol.USUARIO,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  if (userId === session.user.id && parsed.data.rol !== Rol.ADMIN) {
    return { error: "No puedes quitarte tu propio rol admin." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          nombreCompleto: parsed.data.nombreCompleto,
          email: parsed.data.email,
          telefono: parsed.data.telefono,
          rol: parsed.data.rol,
        },
      });
      // The first guest is the account holder; preserve their code, seat and attendance.
      await tx.invitado.updateMany({
        where: { numero: 1, reserva: { userId } },
        data: {
          nombreCompleto: parsed.data.nombreCompleto,
          emailContacto: parsed.data.email,
          telefono: parsed.data.telefono,
        },
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ya existe un usuario con ese email." };
    }
    throw err;
  }

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/reservas");
  revalidatePath("/mi-reserva");
  return { error: null, success: true, message: "Usuario actualizado." };
}

export async function eliminarUsuarioAdmin(userId: string): Promise<AdminActionResult> {
  const session = await requireAdmin();
  const idResult = idSchema.safeParse(userId);
  if (!idResult.success) return { error: "ID de usuario inválido." };
  if (userId === session.user.id) {
    return { error: "No puedes eliminar tu propio usuario." };
  }

  const dependenciasAdmin = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      pagosRegistrados: { select: { id: true }, take: 1 },
      invitadosPagados: { select: { id: true }, take: 1 },
      invitadosAsignados: { select: { id: true }, take: 1 },
      configuracionesEditadas: { select: { id: true }, take: 1 },
    },
  });
  if (!dependenciasAdmin) return { error: "Usuario no encontrado." };
  if (
    dependenciasAdmin.pagosRegistrados.length ||
    dependenciasAdmin.invitadosPagados.length ||
    dependenciasAdmin.invitadosAsignados.length ||
    dependenciasAdmin.configuracionesEditadas.length
  ) {
    return {
      error:
        "No se puede eliminar: tiene acciones administrativas registradas. Cambia sus datos o rol en lugar de borrarlo.",
    };
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/reservas");
  revalidatePath("/admin");
  return { error: null, success: true, message: "Usuario eliminado." };
}

// ============================================================
// CRUD INSCRIPCIONES INDIVIDUALES (admin)
// ============================================================

const reservaAdminSchema = z.object({
  nombreCompleto: z.string().trim().min(3, "Escribe el nombre completo").max(120),
  email: z.string().trim().email("Correo inválido").toLowerCase(),
  telefono: phoneSchema,
});

type NuevaInvitacionResult = AdminActionResult<{
  reservaId: string;
  tempPassword: string | null;
  tempPasswordInstruction: string | null;
  tempPasswordMethod: string | null;
}>;

export async function crearReservaAdmin(_prev: NuevaInvitacionResult, formData: FormData): Promise<NuevaInvitacionResult> {
  await requireAdmin();
  const parsed = reservaAdminSchema.safeParse({
    nombreCompleto: formData.get("nombreCompleto"), email: formData.get("email"), telefono: formData.get("telefono"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  const password = generateTempPassword();
  const passwordHash = await hashPassword(password);
  try {
    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: parsed.data.email } });
      const createdUser = !user;
      if (user && await tx.reserva.findUnique({ where: { userId: user.id }, select: { id: true } })) {
        throw new Error("YA_TIENE_INVITACION");
      }
      if (!user) {
        user = await tx.user.create({ data: { ...parsed.data, passwordHash, debeCambiarContrasena: true } });
      }
      // Existing accounts retain their credentials and personal data.
      const reserva = await tx.reserva.create({
        data: {
          userId: user.id, valorTotal: 0, estado: EstadoReserva.CONFIRMADA, confirmadaEn: new Date(),
          invitados: { create: {
            numero: 1, nombreCompleto: user.nombreCompleto, telefono: user.telefono,
            emailContacto: user.email, estado: EstadoInvitado.CONFIRMADO, codigo: generateEntradaCode(),
          } },
        }, select: { id: true },
      });
      return { reservaId: reserva.id, createdUser };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    revalidatePath("/admin");
    revalidatePath("/admin/reservas");
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/mesas");
    revalidatePath("/mi-reserva");
    return {
      error: null, success: true,
      message: "Invitación confirmada. El pase QR ya está disponible.",
      data: {
        reservaId: result.reservaId,
        tempPassword: result.createdUser ? password : null,
        tempPasswordInstruction: result.createdUser ? "Copia la contraseña ahora. El invitado deberá cambiarla al iniciar sesión." : null,
        tempPasswordMethod: result.createdUser ? "aleatoria" : "existente",
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "YA_TIENE_INVITACION") return { error: "Esta cuenta ya tiene una invitación. Abre su registro para gestionarla." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) return { error: "No se completó la creación. Revisa si la invitación ya existe e intenta de nuevo." };
    throw error;
  }
}

export async function eliminarReservaAdmin(reservaId: string): Promise<AdminActionResult> {
  await requireAdmin();
  const idResult = idSchema.safeParse(reservaId);
  if (!idResult.success) return { error: "ID de inscripcion invalido." };

  await prisma.reserva.delete({ where: { id: reservaId } });
  revalidatePath("/admin/reservas");
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin");
  revalidatePath("/mi-reserva");
  return { error: null, success: true, message: "Inscripcion eliminada." };
}
