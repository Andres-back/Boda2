import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { WeddingInvitationClient } from "@/components/wedding/WeddingInvitationClient";
import { EVENT_CONFIG } from "@/config/event";
import { getConfiguracion } from "@/lib/constants";
import { publicWeddingEvent, weddingPresentation } from "@/lib/wedding-event";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const event = publicWeddingEvent(await getConfiguracion());
  const details = weddingPresentation(event);
  const title = event.nombre;
  const description = `Dios ha escrito una hermosa historia y queremos celebrarla contigo. ${details.date}, ${details.fullLocation}.`;
  return {
    title,
    description,
    metadataBase: new URL(process.env.PUBLIC_APP_URL ?? "http://localhost:3000"),
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      siteName: EVENT_CONFIG.shortName,
      locale: "es_CO",
      type: "website",
      images: [{ url: EVENT_CONFIG.wallpaper, width: 1200, height: 1600, alt: "Jans y Yurleydi" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [EVENT_CONFIG.wallpaper] },
    robots: { index: true, follow: true },
  };
}

export default async function HomePage() {
  const event = publicWeddingEvent(await getConfiguracion());
  const details = weddingPresentation(event);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Event", name: event.nombre,
    startDate: event.fecha, eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: event.lugar,
      geo: { "@type": "GeoCoordinates", latitude: 1.144042, longitude: -76.64302 },
      address: { "@type": "PostalAddress", streetAddress: event.barrio, addressLocality: event.ciudad, addressCountry: "CO" },
    },
    image: [EVENT_CONFIG.wallpaper, EVENT_CONFIG.poster],
    description: `${event.nombre}. ${details.date}, ${details.fullLocation}.`,
  };
  const session = await auth();
  let ctaHref = "/registro?next=/reservar";
  let ctaLabel = "Confirmar asistencia";

  if (session?.user?.id) {
    if (session.user.role === "ADMIN") {
      ctaHref = "/admin";
      ctaLabel = "Abrir administración";
    } else {
      const reserva = await prisma.reserva.findUnique({ where: { userId: session.user.id }, select: { id: true } });
      ctaHref = reserva ? "/mi-reserva" : "/reservar";
      ctaLabel = reserva ? "Ver mi confirmación" : "Confirmar asistencia";
    }
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <WeddingInvitationClient ctaHref={ctaHref} ctaLabel={ctaLabel} event={event} mapsUrl={EVENT_CONFIG.mapsUrl} isAdmin={session?.user?.role === "ADMIN"} isLoggedIn={!!session?.user} />
    </>
  );
}
