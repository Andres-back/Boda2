"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Church,
  Clock3,
  Gift,
  Heart,
  MapPin,
  Menu,
  Music2,
  MessageCircleHeart,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import styles from "./WeddingInvitation.module.css";
import { weddingPresentation, type WeddingEvent } from "@/lib/wedding-event";

export type WeddingInvitationProps = {
  ctaHref: string;
  ctaLabel: string;
  isAdmin: boolean;
  isLoggedIn: boolean;
  event: WeddingEvent;
  mapsUrl: string;
};

type Countdown = { days: number; hours: number; minutes: number; seconds: number };
const WEDDING_SONG_ID = "OztF4T5FSnQ";

const chapters = [
  "Nuestro día",
  "La promesa",
  "La fecha",
  "La ceremonia",
  "Nuestra historia",
  "Momentos",
  "Celebración",
  "Confirmación",
];

const gallery = [
  { src: "/wedding/gallery-01.jpeg", alt: "Jans y Yurleydi compartiendo una tarde juntos" },
  { src: "/wedding/gallery-02.jpeg", alt: "Jans y Yurleydi disfrutando de uno de sus viajes" },
  { src: "/wedding/gallery-03.jpeg", alt: "Jans y Yurleydi cocinando y sonriendo juntos" },
  { src: "/wedding/gallery-04.jpeg", alt: "Jans y Yurleydi en un paseo rodeados de naturaleza" },
  { src: "/wedding/gallery-05.jpeg", alt: "Jans y Yurleydi guardando un recuerdo especial" },
  { src: "/wedding/gallery-06.jpeg", alt: "Jans y Yurleydi compartiendo un momento divertido" },
  { src: "/wedding/gallery-07.jpeg", alt: "Jans y Yurleydi celebrando juntos" },
  { src: "/wedding/gallery-08.jpeg", alt: "Retrato de Jans y Yurleydi" },
  { src: "/wedding/gallery-09.jpeg", alt: "Jans y Yurleydi celebrando el año de su boda" },
];

function getCountdown(fecha: string): Countdown {
  const target = new Date(fecha).getTime();
  const difference = Math.max(0, target - Date.now());
  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference / 3_600_000) % 24),
    minutes: Math.floor((difference / 60_000) % 60),
    seconds: Math.floor((difference / 1_000) % 60),
  };
}

export function WeddingInvitation({ ctaHref, ctaLabel, event, isAdmin, isLoggedIn, mapsUrl }: WeddingInvitationProps) {
  const details = weddingPresentation(event, mapsUrl);
  const root = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const musicFrame = useRef<HTMLIFrameElement>(null);
  const [opened, setOpened] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenuOpen(false); menuRef.current?.focus(); } };
    const onPointer = (e: PointerEvent) => { if (!navRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [menuOpen]);
  const [scrolled, setScrolled] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<Countdown>(() => getCountdown(event.fecha));

  const countdownItems = useMemo(
    () => [
      [countdown.days, "días"],
      [countdown.hours, "horas"],
      [countdown.minutes, "minutos"],
      [countdown.seconds, "segundos"],
    ],
    [countdown]
  );

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    if (window.location.hash) window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";
    const onPageShow = () => window.requestAnimationFrame(() => window.scrollTo(0, 0));
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCountdown(getCountdown(event.fecha)));
    const timer = window.setInterval(() => setCountdown(getCountdown(event.fecha)), 1000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, [event.fecha]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!opened || !root.current) return;
    document.body.style.overflow = "";
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-hero-line]",
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.13, ease: "power3.out" }
        );

        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
          gsap.fromTo(
            element,
            { autoAlpha: 0, y: 34 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: { trigger: element, start: "top 86%", once: true },
            }
          );
        });

      });

      gsap.utils.toArray<HTMLElement>("[data-chapter]").forEach((section, index) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 52%",
          end: "bottom 52%",
          onEnter: () => setActiveChapter(index),
          onEnterBack: () => setActiveChapter(index),
        });
      });

      return () => mm.revert();
    }, root);

    return () => ctx.revert();
  }, [opened]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") setLightbox((current) => current === null ? null : (current + 1) % gallery.length);
      if (event.key === "ArrowLeft") setLightbox((current) => current === null ? null : (current - 1 + gallery.length) % gallery.length);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox]);


  const sendMusicCommand = (command: "playVideo" | "pauseVideo") => {
    musicFrame.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: command, args: [] }),
      "https://www.youtube-nocookie.com"
    );
  };

  const openInvitation = () => {
    setOpened(true);
    setMusicPlaying(true);
    sendMusicCommand("playVideo");
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
  };

  const toggleMusic = () => {
    setMusicPlaying((current) => {
      const next = !current;
      sendMusicCommand(next ? "playVideo" : "pauseVideo");
      return next;
    });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div ref={root} className={styles.page}>
      <div className={styles.grain} aria-hidden />

      <div className={`${styles.entrance} ${opened ? styles.entranceHidden : ""}`} aria-hidden={opened}>
        <div className={styles.entranceCard}>
          <Image className={`${styles.entranceDecor} ${styles.entranceFloral}`} src="/wedding/generated-botanical.png" alt="" width={440} height={440} priority loading="eager" />
          <Image className={`${styles.entranceDecor} ${styles.entranceRings}`} src="/wedding/generated-rings.png" alt="" width={480} height={320} />
          <div className={styles.seal}>J <span>&</span> Y</div>
          <p className={styles.entranceLabel}>Con la bendición de Dios</p>
          <h1>
            <span>Jans <small>Narvaez</small></span>
            <i>&</i>
            <span>Yurleydi <small>Solarte</small></span>
          </h1>
          <p className={styles.entranceMessage}>
            <strong>¡Queremos vivir este momento contigo!</strong> Dios cruzó nuestros caminos y hoy iniciamos una nueva etapa. Tu presencia hará que este inicio sea muy especial.
          </p>
          <button type="button" className={styles.primaryButton} onClick={openInvitation}>
            Abrir invitación <Heart size={16} strokeWidth={1.5} />
          </button>
          <p className={styles.entranceDate}>{details.numericDate} &nbsp;—&nbsp; {event.ciudad}</p>
        </div>
      </div>

      <nav ref={navRef} className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`} aria-label="Navegación principal">
        <a className={styles.navBrand} href="#inicio" onClick={closeMenu}>J <span>&</span> Y</a>
        <div className={styles.desktopLinks}>
          <a href="#historia">Nuestra historia</a>
          <a href="#momentos">Momentos</a>
          <a href="#fecha">Fecha</a>
          {!isAdmin && <Link className={styles.navCta} href={ctaHref}>Confirmar</Link>}
        </div>
        <div id="wedding-menu" className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ""}`}>
          <a href="#inicio" onClick={closeMenu}>Inicio</a>
          <a href="#historia" onClick={closeMenu}>Nuestra historia</a>
          <a href="#momentos" onClick={closeMenu}>Momentos</a>
          <a href="#fecha" onClick={closeMenu}>Fecha</a>
          <Link className={styles.navCta} href={ctaHref} onClick={closeMenu}>{ctaLabel}</Link>
          {!isLoggedIn && <Link href="/login" onClick={closeMenu}>Iniciar sesión</Link>}
          {isLoggedIn && <form action="/logout" method="POST"><button type="submit">Salir</button></form>}
        </div>
        <button ref={menuRef} className={styles.menuButton} type="button" aria-controls="wedding-menu" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      <iframe
        ref={musicFrame}
        className={styles.musicFrame}
        src={`https://www.youtube-nocookie.com/embed/${WEDDING_SONG_ID}?enablejsapi=1&autoplay=0&controls=0&loop=1&playlist=${WEDDING_SONG_ID}&playsinline=1&rel=0`}
        title="Canción de Jans y Yurleydi"
        allow="autoplay; encrypted-media"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => {
          if (opened && musicPlaying) sendMusicCommand("playVideo");
        }}
      />
      <button
        type="button"
        className={`${styles.musicControl} ${opened ? styles.musicControlVisible : ""} ${musicPlaying ? styles.musicControlPlaying : ""}`}
        onClick={toggleMusic}
        aria-label={musicPlaying ? "Pausar nuestra canción" : "Reproducir nuestra canción"}
        aria-pressed={musicPlaying}
      >
        <span className={styles.musicIcon}><Music2 size={15} /></span>
        <span>Nuestra canción</span>
        {musicPlaying ? <Volume2 size={15} /> : <VolumeX size={15} />}
      </button>

      <aside className={`${styles.chapterHud} ${opened ? styles.chapterHudVisible : ""}`} aria-hidden>
        <span>{String(activeChapter + 1).padStart(2, "0")}</span>
        <div className={styles.chapterTrack}><i style={{ transform: `scaleY(${(activeChapter + 1) / chapters.length})` }} /></div>
        <small>{chapters[activeChapter]}</small>
      </aside>

      <main id="main-content">
        <section id="inicio" className={styles.hero} data-chapter>
          <div className={styles.heroMedia} />
          <div className={styles.heroShade} />
          <div className={styles.heroFrame} />
          <Image className={styles.heroGarland} src="/wedding/generated-garland.png" alt="" width={1500} height={500} priority />
          <div className={styles.heroContent}>
            <p data-hero-line className={styles.heroKicker}>Nuestra boda · Con la bendición de Dios</p>
            <h2 data-hero-line className={styles.heroNames}>
              Jans <small>Narvaez</small>
              <i>&</i>
              Yurleydi <small>Solarte</small>
            </h2>
            <p data-hero-line className={styles.heroDate}>{details.date}</p>
            <p data-hero-line className={styles.heroQuote}>“Lo que Dios ha unido, que no lo separe el hombre.” <strong>Marcos 10:9</strong></p>
            {isAdmin ? <a data-hero-line className={styles.outlineButton} href="#historia">Nuestra historia</a> : <Link data-hero-line className={styles.outlineButton} href={ctaHref}>{ctaLabel}</Link>}
          </div>
          <a className={styles.scrollCue} href="#promesa" aria-label="Continuar hacia nuestra historia"><span /></a>
        </section>

        <section id="promesa" className={styles.promise} data-chapter>
          <div className={styles.promiseMedia} />
          <div className={styles.promiseShade} />
          <div className={styles.promiseContent} data-reveal>
            <Sparkles size={24} strokeWidth={1.2} />
            <p className={styles.eyebrow}>Una promesa para siempre</p>
            <blockquote>“Todo lo sufre, todo lo cree, todo lo espera, todo lo soporta.”</blockquote>
            <cite>1 Corintios 13:7</cite>
          </div>
          <Image className={styles.promiseDoves} src="/wedding/generated-doves.png" alt="" width={1536} height={1024} />
        </section>

        <section id="fecha" className={styles.countdownSection} data-chapter>
          <div className={styles.dateMonogram} aria-hidden>J & Y</div>
          <div className={styles.container}>
            <header className={styles.sectionHeading} data-reveal>
              <p className={styles.eyebrow}>Guarda la fecha</p>
              <h2 className={styles.sectionTitle}>Cada vez <em>más cerca</em></h2>
              <p className={styles.sectionCopy}>El {details.shortDate} comenzará un nuevo capítulo. Nos hará muy felices vivirlo contigo.</p>
            </header>
            <Image className={styles.sectionDivider} src="/wedding/generated-divider.png" alt="" width={2172} height={724} />
            <div className={styles.countdown} data-reveal>
              {countdownItems.map(([value, label]) => (
                <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>
              ))}
            </div>
            <div className={styles.calendarLine} data-reveal>
              <CalendarDays size={18} strokeWidth={1.5} /> {details.calendarDate}
            </div>
          </div>
        </section>

        <section id="ceremonia" className={styles.schedule} data-chapter>
          <div className={styles.container}>
            <header className={styles.sectionHeading} data-reveal>
              <p className={styles.eyebrow}>Nuestro día</p>
              <h2 className={styles.sectionTitle}>Un pacto, <em>una celebración</em></h2>
              <p className={styles.sectionCopy}>Primero honraremos a Dios y luego compartiremos la alegría de este nuevo comienzo.</p>
            </header>
            <div className={styles.scheduleGrid}>
              <article className={styles.eventCard} data-reveal>
                <div className={styles.eventImage}>
                  <Image className={styles.eventImageBackdrop} src="/wedding/jans-yurleydi-ceremony.jpeg" alt="" fill sizes="(max-width: 800px) 100vw, 50vw" aria-hidden />
                  <Image className={styles.eventImageMain} src="/wedding/jans-yurleydi-ceremony.jpeg" alt="Jans y Yurleydi juntos" fill sizes="(max-width: 800px) 100vw, 50vw" />
                </div>
                <div className={styles.eventBody}>
                  <span className={styles.eventNumber}>01</span><Church size={24} strokeWidth={1.3} />
                  <p className={styles.eyebrow}>Ceremonia</p><h3>Nuestra promesa</h3>
                  <p>Uniremos nuestras vidas delante de Dios, nuestra familia y nuestros amigos.</p>
                  <div className={styles.eventMeta}><span><Clock3 />{details.ceremonyTime}</span><span><MapPin />{details.location}</span></div>
                </div>
              </article>
              <article className={styles.eventCard} data-reveal>
                <div className={styles.eventImage}>
                  <Image className={styles.eventImageBackdrop} src="/wedding/jans-yurleydi-reception.jpeg" alt="" fill sizes="(max-width: 800px) 100vw, 50vw" aria-hidden />
                  <Image className={styles.eventImageMain} src="/wedding/jans-yurleydi-reception.jpeg" alt="Jans y Yurleydi celebrando su compromiso" fill sizes="(max-width: 800px) 100vw, 50vw" />
                </div>
                <div className={styles.eventBody}>
                  <span className={styles.eventNumber}>02</span><Heart size={24} strokeWidth={1.3} />
                  <p className={styles.eyebrow}>Recepción</p><h3>Compartamos este momento</h3>
                  <p>Después de la ceremonia, celebremos juntos la fidelidad y la bondad de Dios.</p>
                  <div className={styles.eventMeta}><span><Clock3 />Al finalizar la ceremonia</span><span><MapPin />{details.location}</span></div>
                </div>
              </article>
            </div>
            <a className={styles.ghostButton} href={details.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={16} /> Cómo llegar</a>
          </div>
        </section>

        <section id="historia" className={styles.story} data-chapter>
          <div className={styles.storyImage}><Image src="/wedding/jans-yurleydi-story.jpeg" alt="Jans y Yurleydi compartiendo un momento especial" fill sizes="(max-width: 900px) 100vw, 55vw" /></div>
          <div className={styles.storyCopy} data-reveal>
            <p className={styles.eyebrow}>Nuestra historia</p>
            <h2 className={styles.sectionTitle}>Dios nos encontró <em>en el camino</em></h2>
            <p>Entre conversaciones, oraciones y sueños compartidos, descubrimos que el amor también es elegir caminar juntos cada día.</p>
            <p>Hoy, con Cristo en el centro de nuestro hogar, damos el sí a una vida de fe, servicio y compañía.</p>
            <div className={styles.signature}>Jans & Yurleydi</div>
            <Image className={styles.storyRibbon} src="/wedding/generated-ribbon.png" alt="" width={1672} height={941} />
          </div>
        </section>

        <section id="momentos" className={styles.gallerySection} data-chapter>
          <Image className={styles.galleryCorner} src="/wedding/generated-corner.png" alt="" width={1254} height={1254} />
          <div className={styles.container}>
            <header className={styles.sectionHeading} data-reveal>
              <p className={styles.eyebrow}>Instantes que guardamos</p>
              <h2 className={styles.sectionTitle}>Nuestra historia <em>en imágenes</em></h2>
              <p className={styles.sectionCopy}>Pequeños momentos que Dios convirtió en recuerdos para siempre.</p>
            </header>
            <div className={styles.gallery}>
              {gallery.map((photo, index) => (
                <button key={photo.src} type="button" className={styles.galleryItem} onClick={() => setLightbox(index)} data-reveal aria-label={`Abrir fotografía ${index + 1}`}>
                  <Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 720px) 50vw, 33vw" />
                  <span>0{index + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.celebration} data-chapter>
          <div className={styles.celebrationMedia} />
          <div className={styles.celebrationShade} />
          <div className={styles.celebrationContent} data-reveal>
            <p className={styles.eyebrow}>Juntos será más hermoso</p>
            <h2>Compartamos<br /><em>este momento</em></h2>
            <p>“Grandes cosas ha hecho el Señor con nosotros; estamos alegres.”</p>
            <cite>Salmo 126:3</cite>
          </div>
        </section>

        <section id="confirmar" className={styles.rsvp} data-chapter>
          <Image className={styles.rsvpFloral} src="/wedding/generated-botanical.png" alt="" width={520} height={520} />
          <Image className={styles.rsvpPetals} src="/wedding/generated-petals.png" alt="" width={1536} height={1024} />
          <div className={styles.rsvpCard} data-reveal>
            <MessageCircleHeart size={28} strokeWidth={1.25} />
            <p className={styles.eyebrow}>Nos encantará contar contigo</p>
            <h2 className={styles.sectionTitle}>Confirma tu <em>asistencia</em></h2>
            <p>Ayúdanos a preparar cada lugar con amor. Podrás registrar a las personas que te acompañarán y consultar después tu mesa y acceso.</p>
            {!isAdmin && <Link className={styles.primaryButton} href={ctaHref}>{ctaLabel}</Link>}
            <p className={styles.rsvpHelp}>Si tienes alguna duda, comunícate directamente con los novios.</p>
          </div>
        </section>

        <section className={styles.gifts}>
          <div className={styles.giftComposition}>
            <Image className={styles.giftArt} src="/wedding/generated-gifts.png" alt="" width={1024} height={1536} />
            <div className={styles.giftCard} data-reveal>
              <Gift size={28} strokeWidth={1.25} />
              <p className={styles.eyebrow}>Un detalle desde el corazón</p>
              <h2>Tu presencia es nuestra mayor alegría</h2>
              <p>Si deseas bendecir nuestro nuevo hogar, recibiremos con gratitud lo que Dios ponga en tu corazón.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerMonogramWrap}>
          <Image className={styles.footerWreath} src="/wedding/generated-wreath.png" alt="" width={1024} height={1536} />
          <p className={styles.footerMonogram}>J <span>&</span> Y</p>
        </div>
        <p>Jans Narvaez & Yurleydi Solarte</p>
        <small>{details.date} · {details.fullLocation}</small>
        <blockquote>“Y sobre todas estas cosas vestíos de amor.” <cite>Colosenses 3:14</cite></blockquote>
      </footer>

      {lightbox !== null && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Galería de fotografías" onClick={() => setLightbox(null)}>
          <button type="button" className={styles.lightboxClose} onClick={() => setLightbox(null)} aria-label="Cerrar galería"><X /></button>
          <button type="button" className={`${styles.lightboxArrow} ${styles.lightboxPrev}`} onClick={(event) => { event.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length); }} aria-label="Fotografía anterior"><ChevronLeft /></button>
          <div className={styles.lightboxImage} onClick={(event) => event.stopPropagation()}>
            <Image src={gallery[lightbox].src} alt={gallery[lightbox].alt} fill sizes="100vw" priority />
            <p>{lightbox + 1} / {gallery.length}</p>
          </div>
          <button type="button" className={`${styles.lightboxArrow} ${styles.lightboxNext}`} onClick={(event) => { event.stopPropagation(); setLightbox((lightbox + 1) % gallery.length); }} aria-label="Fotografía siguiente"><ChevronRight /></button>
        </div>
      )}

    </div>
  );
}
