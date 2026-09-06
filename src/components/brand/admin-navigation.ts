import { CalendarDays, Grid3x3, KeyRound, LayoutDashboard, TicketCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/validar", label: "Acceso", icon: TicketCheck },
  { href: "/admin/reservas", label: "Invitados", icon: Users },
  { href: "/admin/mesas", label: "Mesas", icon: Grid3x3 },
  { href: "/admin/evento", label: "Datos de la boda", icon: CalendarDays },
  { href: "/admin/cuenta", label: "Mi cuenta", icon: KeyRound },
];
