"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { Prisma, Rol } from "@prisma/client";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { normalizePhoneE164 } from "@/lib/whatsapp";

const phoneSchema = z.string().trim().transform((value) => normalizePhoneE164(value)).pipe(
  z.string().min(1, "Ingresa un celular válido")
);

const registroSchema = z.object({
  nombreCompleto: z.string().trim().min(3, "Mínimo 3 caracteres").max(120),
  email: z.string().trim().email("Correo inválido").toLowerCase(),
  telefono: phoneSchema,
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

export type RegistroState = {
  error: string | null;
  fieldErrors?: Partial<Record<keyof z.infer<typeof registroSchema>, string>>;
};

export async function registrarUsuario(_prev: RegistroState, formData: FormData): Promise<RegistroState> {
  const raw = {
    nombreCompleto: formData.get("nombreCompleto"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    password: formData.get("password"),
  };
  const next = String(formData.get("next") ?? "");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";
  const parsed = registroSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: RegistroState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[issue.path[0] as keyof typeof raw] = issue.message;
    }
    return { error: "Revisa los campos marcados.", fieldErrors };
  }

  const data = parsed.data;
  const passwordHash = await hashPassword(data.password);
  try {
    await prisma.user.create({
      data: {
        nombreCompleto: data.nombreCompleto,
        email: data.email,
        telefono: data.telefono,
        passwordHash,
        rol: Rol.USUARIO,
        ciudad: "Mocoa",
        departamento: "Putumayo",
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Este correo ya está registrado. Inicia sesión.", fieldErrors: { email: "Correo ya registrado" } };
    }
    throw error;
  }

  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: safeNext || "/reservar",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Tu cuenta fue creada. Inicia sesión para continuar." };
    }
    throw error;
  }

  return { error: null };
}

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export type LoginState = { error: string | null };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";

  if (!loginSchema.safeParse({ email, password }).success) return { error: "Datos inválidos." };
  const rate = checkRateLimit(`login:${email}`);
  if (!rate.allowed) return { error: "Demasiados intentos. Espera 10 minutos e intenta de nuevo." };

  const user = await prisma.user.findUnique({ where: { email }, select: { rol: true, reserva: { select: { id: true } } } });
  const fallbackRedirect = user?.rol === Rol.ADMIN ? "/admin" : user?.reserva ? "/mi-reserva" : "/reservar";

  try {
    await signIn("credentials", { email, password, redirectTo: safeNext || fallbackRedirect });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Correo o contraseña incorrectos." };
    throw error;
  }
  return { error: null };
}
