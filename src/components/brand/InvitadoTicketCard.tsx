"use client";

import { useEffect, useState, useTransition } from "react";
import QRCode from "qrcode";
import { Armchair, Check, Download, LoaderCircle } from "lucide-react";
import { EstadoInvitado } from "@prisma/client";

interface InvitadoTicketCardProps {
  numero: number;
  nombreCompleto: string;
  telefono: string;
  codigo: string | null;
  registradoEn: Date | null;
  ultimoReingresoEn: Date | null;
  reingresos: number;


  mesaNumero: number | null;
  silla: number | null;
  estado: EstadoInvitado;
}

export function InvitadoTicketCard({ numero, nombreCompleto, telefono, codigo, registradoEn, mesaNumero, silla, estado }: InvitadoTicketCardProps) {
  const [qr, setQr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const asistio = estado === EstadoInvitado.ASISTIO || Boolean(registradoEn);

  useEffect(() => {
    if (!codigo) return;
    QRCode.toDataURL(codigo, { errorCorrectionLevel: "M", margin: 1, width: 360, color: { dark: "#403735", light: "#fffdf9" } })
      .then(setQr)
      .catch(() => setError("No pudimos mostrar el QR."));
  }, [codigo]);

  const download = () => {
    if (!codigo) return;
    setError(null);
    startTransition(async () => {
      try {
        await descargarPase({ numero, nombreCompleto, telefono, codigo, mesaNumero, silla });
      } catch (downloadError) {
        setError(downloadError instanceof Error ? downloadError.message : "No pudimos descargar el pase.");
      }
    });
  };

  return (
    <article className="overflow-hidden rounded-[26px] border border-[#7b625d]/15 bg-[#fffdf9] text-[#4b403d] shadow-[0_20px_55px_rgba(80,59,54,.12)]">
      <div className="h-2 bg-[linear-gradient(90deg,#efbfbb,#f4d36f,#aab09f)]" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[9px] font-bold uppercase tracking-[.25em] text-[#a97718]">Invitado {String(numero).padStart(2, "0")}</p><h3 className="mt-1 font-display text-3xl leading-none text-[#403735]">{nombreCompleto}</h3><p className="mt-2 text-xs text-[#7e716d]">{formatLocal(telefono)}</p></div>
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${asistio ? "bg-[#aab09f]/25 text-[#61705c]" : "bg-[#f4dada] text-[#b9726f]"}`}>{asistio ? <Check className="h-5 w-5" /> : <span className="font-display text-xl">A&A</span>}</span>
        </div>

        <div className="mt-5 grid items-center gap-5 sm:grid-cols-[170px_1fr]">
          <div className="mx-auto grid aspect-square w-full max-w-[190px] place-items-center rounded-2xl border border-[#7b625d]/15 bg-white p-3">
            {qr ? <img src={qr} alt={`Código QR de ${nombreCompleto}`} className="h-full w-full" /> : <LoaderCircle className="h-7 w-7 animate-spin text-[#b9726f]" />}
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.22em] text-[#7e716d]">Código de acceso</p>
            <p className="mt-1 break-all font-mono text-lg tracking-[.14em] text-[#7b625d]">{codigo ?? "Pendiente"}</p>
            <div className="mt-4 rounded-2xl bg-[#eef0e8]/65 p-4">
              {mesaNumero && silla ? <p className="flex items-center gap-2 text-sm font-semibold text-[#5f4d49]"><Armchair className="h-4 w-4" />Mesa {mesaNumero} · Silla {silla}</p> : <p className="flex items-center gap-2 text-sm text-[#7e716d]"><Armchair className="h-4 w-4" />Mesa por asignar</p>}
              {asistio && registradoEn && <p className="mt-2 text-xs text-[#61705c]">Ingreso registrado a las {new Date(registradoEn).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" })}</p>}
            </div>
          </div>
        </div>

        <button type="button" onClick={download} disabled={pending || !codigo} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#7b625d]/25 text-[10px] font-bold uppercase tracking-[.16em] text-[#5f4d49] transition hover:bg-[#5f4d49] hover:text-white disabled:opacity-50">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{pending ? "Generando pase" : "Descargar pase"}
        </button>
        {error && <p className="mt-3 text-center text-xs text-[#a44949]">{error}</p>}
      </div>
    </article>
  );
}

function formatLocal(value: string) {
  const digits = value.replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}` : value;
}

async function descargarPase({ numero, nombreCompleto, telefono, codigo, mesaNumero, silla }: { numero: number; nombreCompleto: string; telefono: string; codigo: string; mesaNumero: number | null; silla: number | null }) {
  const width = 720;
  const height = 1120;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No pudimos preparar el pase.");

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#fffdf9");
  gradient.addColorStop(0.7, "#fff9ee");
  gradient.addColorStop(1, "#f4dada");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#aab09f";
  context.lineWidth = 2;
  context.strokeRect(28, 28, width - 56, height - 56);
  context.strokeStyle = "rgba(123,98,93,.22)";
  context.strokeRect(42, 42, width - 84, height - 84);

  context.textAlign = "center";
  context.fillStyle = "#a97718";
  context.font = "italic 34px Georgia, serif";
  context.fillText("A  &  A", width / 2, 105);
  context.fillStyle = "#403735";
  context.font = "52px Georgia, serif";
  context.fillText("Alejandro & Ana", width / 2, 170);
  context.fillStyle = "#7e716d";
  context.font = "bold 15px Arial, sans-serif";
  context.fillText("10 DE OCTUBRE DE 2026 · MOCOA, PUTUMAYO", width / 2, 210);

  context.fillStyle = "#b9726f";
  context.font = "bold 15px Arial, sans-serif";
  context.fillText(`INVITADO ${String(numero).padStart(2, "0")}`, width / 2, 280);
  let fontSize = 46;
  context.font = `${fontSize}px Georgia, serif`;
  while (context.measureText(nombreCompleto).width > width - 100 && fontSize > 25) {
    fontSize -= 2;
    context.font = `${fontSize}px Georgia, serif`;
  }
  context.fillStyle = "#403735";
  context.fillText(nombreCompleto, width / 2, 340);
  context.fillStyle = "#7e716d";
  context.font = "22px Arial, sans-serif";
  context.fillText(formatLocal(telefono), width / 2, 382);

  const qrData = await QRCode.toDataURL(codigo, { errorCorrectionLevel: "M", margin: 1, width: 360, color: { dark: "#403735", light: "#fffdf9" } });
  const qrImage = await loadImage(qrData);
  context.drawImage(qrImage, 190, 430, 340, 340);
  context.fillStyle = "#7b625d";
  context.font = "bold 28px monospace";
  context.fillText(codigo, width / 2, 825);
  context.fillStyle = "#403735";
  context.font = "34px Georgia, serif";
  context.fillText(mesaNumero && silla ? `Mesa ${mesaNumero} · Silla ${silla}` : "Mesa por asignar", width / 2, 900);
  context.fillStyle = "#7e716d";
  context.font = "18px Georgia, serif";
  context.fillText("Presenta este código al ingresar", width / 2, 965);
  context.font = "italic 18px Georgia, serif";
  context.fillText("“Y sobre todas estas cosas vestíos de amor.”", width / 2, 1015);
  context.font = "bold 13px Arial, sans-serif";
  context.fillText("COLOSENSES 3:14", width / 2, 1044);

  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("No pudimos generar el pase.")), "image/png"));
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `boda-alejandro-ana-${codigo.toLowerCase()}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No pudimos cargar el código QR."));
    image.src = source;
  });
}
