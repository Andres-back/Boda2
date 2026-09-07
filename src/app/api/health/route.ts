import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      service: "boda-jans-yurleydi",
      database: "ok",
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        service: "boda-jans-yurleydi",
        database: "unavailable",
      },
      { status: 503 }
    );
  }
}
