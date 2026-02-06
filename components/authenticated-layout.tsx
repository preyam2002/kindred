"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();

  // Don't show sidebar on auth pages or home page when unauthenticated
  const isAuthPage = pathname?.startsWith("/auth");
  const shouldShowSidebar = status === "authenticated" && !isAuthPage;

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}






