import React from "react";
import type { NavItem } from "@/layout/AppSidebar";
import {
  GridIcon,
  UserCircleIcon,
  CalenderIcon,
  TaskIcon,
  TableIcon,
  PlugInIcon,
} from "@/icons";

export const adminNav: NavItem[] = [
  { name: "Dashboard", icon: <GridIcon />, path: "/admin/dashboard" },
  { name: "Sesiones", icon: <CalenderIcon />, path: "/admin/sessions" },
  { name: "Miembros", icon: <UserCircleIcon />, path: "/admin/members" },

  // Admin management
  { name: "Clases (Admin)", icon: <CalenderIcon />, path: "/admin/classes" },
// Booking as user

  { name: "Planes & Pagos", icon: <TableIcon />, path: "/admin/payments" },
  { name: "WODs", icon: <TaskIcon />, path: "/admin/wod" },
  { name: "WOD Feed", icon: <TaskIcon />, path: "/admin/wod-feed" },
  { name: "Integraciones", icon: <PlugInIcon />, path: "/admin/integrations" },
  { name: "Configuración", icon: <PlugInIcon />, path: "/admin/settings" },
];
