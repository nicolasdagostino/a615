import React from "react";
import type { NavItem } from "@/layout/AppSidebar";
import { GridIcon, CalenderIcon, TaskIcon, UserCircleIcon } from "@/icons";

export const coachNav: NavItem[] = [
  { name: "Dashboard", icon: <GridIcon />, path: "/coach/dashboard" },
  { name: "Clases", icon: <CalenderIcon />, path: "/coach/classes" },

  // Booking as user
  { name: "Sesiones", icon: <CalenderIcon />, path: "/coach/sessions" },

  { name: "Asistencia", icon: <TaskIcon />, path: "/coach/attendance" },
  { name: "Workouts (WOD)", icon: <TaskIcon />, path: "/coach/wod" },
  { name: "Perfil", icon: <UserCircleIcon />, path: "/coach/profile" },
];
