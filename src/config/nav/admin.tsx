import React from "react";
import type { NavItem } from "@/layout/AppSidebar";
import {
  GridIcon,
  UserCircleIcon,
  CalenderIcon,
  TaskIcon,
  TableIcon,
  ChatIcon,
  PlugInIcon,
} from "@/icons";

export const adminNav: NavItem[] = [
  { name: "Dashboard", icon: <GridIcon />, path: "/admin/dashboard" },
  { name: "Miembros", icon: <UserCircleIcon />, path: "/admin/members" },
  { name: "Clases", icon: <CalenderIcon />, path: "/admin/classes" },
  { name: "Reservas", icon: <TaskIcon />, path: "/admin/reservations" },
  { name: "Planes & Pagos", icon: <TableIcon />, path: "/admin/payments" },
  { name: "Workouts (WOD)", icon: <TaskIcon />, path: "/admin/wod" },
  { name: "WOD (Feed)", icon: <TaskIcon />, path: "/admin/wod-feed" },
  { name: "Integraciones", icon: <PlugInIcon />, path: "/admin/integrations" },
  { name: "Configuración", icon: <PlugInIcon />, path: "/admin/settings" },
];
