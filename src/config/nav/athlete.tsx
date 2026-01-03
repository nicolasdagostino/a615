import React from "react";
import type { NavItem } from "@/layout/AppSidebar";
import { GridIcon, CalenderIcon, TaskIcon, ChatIcon, UserCircleIcon } from "@/icons";

export const athleteNav: NavItem[] = [
  { name: "Inicio", icon: <GridIcon />, path: "/athlete/home" },
  { name: "Reservas", icon: <CalenderIcon />, path: "/athlete/reservations" },
  { name: "WOD", icon: <TaskIcon />, path: "/athlete/wod" },
  { name: "Perfil", icon: <UserCircleIcon />, path: "/athlete/profile" },
];
