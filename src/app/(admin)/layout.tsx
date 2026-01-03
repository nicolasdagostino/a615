"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { usePathname } from "next/navigation";
import { adminNav } from "@/config/nav/admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();

  // Si más adelante hay rutas especiales, se agregan aquí.
  const getRouteSpecificStyles = () => {
    return "p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6";
  };

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "xl:ml-[290px]"
    : "xl:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar navItems={adminNav} homeHref="/admin/dashboard" showWidget={false} />
      <Backdrop />

      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
      <AppHeader homeHref="/admin/dashboard" />
        <div className={getRouteSpecificStyles()}>{children}</div>
      </div>
    </div>
  );
}
