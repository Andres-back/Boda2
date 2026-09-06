import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getConfiguracion, toValidDate } from "@/lib/constants";
import { EditarConfiguracionForm } from "./editar-configuracion-form";
import { toBogotaInput, weddingTime } from "@/lib/wedding-event";
import {
  MapPin,
  Calendar,
  Clock,
  MessageCircle,
  Mail,
  User,
} from "lucide-react";

export const metadata = {
  title: "Evento | Admin",
};



function formatFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fecha);
}

function formatHora(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(fecha);
}

// Formato para input datetime-local: YYYY-MM-DDTHH:mm
function toDatetimeLocal(d: Date): string {
  return toBogotaInput(d);
}

export default async function AdminEventoPage() {
  const cfg = await getConfiguracion();
  // Re-hidratar por si unstable_cache serializo las fechas a string.
  const fechaCfg = toValidDate(cfg.fecha, new Date("2026-10-10T14:30:00-05:00"));
  const actualizadoEn = toValidDate(
    cfg.actualizadoEn,
    new Date("2026-10-10T14:30:00-05:00")
  );

  return (
    <main className="px-4 py-8 md:px-8 max-w-3xl">
      <div className="mb-6">
        <p className="text-base text-ash uppercase tracking-widest font-subhead">
          Configuración
        </p>
        <h1 className="font-display text-3xl text-cream mt-1">Evento</h1>
        <p className="text-lg text-bone mt-1">
          Estos datos se publican en la invitación al guardar. Todos los horarios son de Colombia.
        </p>
      </div>

      {/* Vista previa de como se ve la info actualmente */}
      <Card className="mb-6 border-ember-rust/30">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-ember-bright" />
            {cfg.nombre}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-lg">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-ember-bright mt-0.5 shrink-0" />
            <div>
              <p className="text-base text-ash uppercase tracking-widest font-subhead">
                Fecha
              </p>
              <p className="text-bone capitalize">{formatFecha(fechaCfg)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-ember-bright mt-0.5 shrink-0" />
            <div>
              <p className="text-base text-ash uppercase tracking-widest font-subhead">
                Ceremonia
              </p>
              <p className="text-bone">{formatHora(fechaCfg)}</p>
              <p className="text-base text-ash">Recepción: {weddingTime(`${toBogotaInput(fechaCfg).slice(0, 10)}T${cfg.horaRecepcion}:00-05:00`)}</p>
            </div>
          </div>
          {cfg.puertas && (
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-ash/60 mt-0.5 shrink-0" />
              <div>
                <p className="text-base text-ash uppercase tracking-widest font-subhead">
                  Puertas
                </p>
                <p className="text-bone">{cfg.puertas}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-ember-bright mt-0.5 shrink-0" />
            <div>
              <p className="text-base text-ash uppercase tracking-widest font-subhead">
                Lugar
              </p>
              <p className="text-bone">{cfg.lugar}</p>
              {cfg.barrio && <p className="text-base text-ash">{cfg.barrio}</p>}
              {cfg.ciudad && <p className="text-base text-ash">{cfg.ciudad}</p>}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Formulario de edicion */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-ember-bright" />
            Editar datos del evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditarConfiguracionForm
            defaults={{
              nombre: cfg.nombre,
              fecha: toDatetimeLocal(fechaCfg),
              puertas: cfg.puertas,
              horaRecepcion: cfg.horaRecepcion,
              lugar: cfg.lugar,
              barrio: cfg.barrio ?? "",
              ciudad: cfg.ciudad ?? "",
              organizadorNombre: cfg.organizadorNombre,
              organizadorEmail: cfg.organizadorEmail,
              organizadorTelefono: cfg.organizadorTelefono,
              organizadorWhatsapp: cfg.organizadorWhatsapp,
            }}
          />
        </CardContent>
      </Card>

      {/* Contacto admin (vista) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-ember-bright" />
            Organizador (vista previa)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-lg">
          <div>
            <p className="text-base text-ash uppercase tracking-widest font-subhead">
              Nombre
            </p>
            <p className="text-bone font-subhead">{cfg.organizadorNombre}</p>
          </div>
          <a
            href={`https://wa.me/${cfg.organizadorWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-bone hover:text-ember-bright"
          >
            <MessageCircle className="h-5 w-5 text-ember-bright" />
            <span className="font-mono">+{cfg.organizadorWhatsapp}</span>
          </a>
          <a
            href={`mailto:${cfg.organizadorEmail}`}
            className="flex items-center gap-2 text-bone hover:text-ember-bright"
          >
            <Mail className="h-5 w-5 text-ember-bright" />
            <span className="text-base">{cfg.organizadorEmail}</span>
          </a>
        </CardContent>
      </Card>

      <Badge variant="info">
        Última edición:{" "}
        {new Intl.DateTimeFormat("es-CO", {
          timeZone: "America/Bogota",
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(actualizadoEn)}
      </Badge>
    </main>
  );
}
