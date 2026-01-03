import React from "react";
import type { NavItem } from "@/layout/AppSidebar";
import { GridIcon, CalenderIcon, TaskIcon, ChatIcon, UserCircleIcon } from "@/icons";

export const coachNav: NavItem[] = [
  { name: "Dashboard", icon: <GridIcon />, path: "/coach/dashboard" },
  { name: "Clases", icon: <CalenderIcon />, path: "/coach/classes" },
  { name: "Asistencia", icon: <TaskIcon />, path: "/coach/attendance" },
  { name: "Workouts (WOD)", icon: <TaskIcon />, path: "/coach/wod" },
  { name: "Perfil", icon: <UserCircleIcon />, path: "/coach/profile" },
];
