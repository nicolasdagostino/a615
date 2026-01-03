"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { usePathname } from "next/navigation";
import { athleteNav } from "@/config/nav/athlete";

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();

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
      <AppSidebar navItems={athleteNav} homeHref="/athlete/home" showWidget={false} />
      <Backdrop />

      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader />
        <div className={getRouteSpecificStyles()}>{children}</div>
      </div>
    </div>
  );
}
