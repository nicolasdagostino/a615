import React from "react";
import type { NavItem } from "@/layout/AppSidebar";
import { GridIcon, CalenderIcon, TaskIcon, UserCircleIcon } from "@/icons";

export const athleteNav: NavItem[] = [
  { name: "Inicio", icon: <GridIcon />, path: "/athlete/home" },

  // antes: Reservas -> ahora: Clases
  { name: "Sesiones", icon: <CalenderIcon />, path: "/athlete/classes" },
{ name: "WOD", icon: <TaskIcon />, path: "/athlete/wod" },
  { name: "Perfil", icon: <UserCircleIcon />, path: "/athlete/profile" },
];
