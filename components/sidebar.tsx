"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Users,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  MessageCircle,
  Library,
  Sparkles,
  Heart,
  TrendingUp,
  Smile,
} from "lucide-react";
import { Logo } from "./logo";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = "" }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Library",
      href: "/library",
      icon: Library,
    },
    {
      name: "Recommendations",
      href: "/recommendations",
      icon: TrendingUp,
    },
    {
      name: "Taste DNA",
      href: "/taste-dna",
      icon: Sparkles,
    },
    {
      name: "Taste Match",
      href: "/taste-match",
      icon: Heart,
    },
    {
      name: "Mood Discovery",
      href: "/mood-discovery",
      icon: Smile,
    },
    {
      name: "Group Consensus",
      href: "/group-consensus",
      icon: Users,
    },
    {
      name: "AI Chat",
      href: "/chat",
      icon: MessageCircle,
    },
    {
      name: "Discover",
      href: "/discover",
      icon: Search,
    },
    {
      name: "Matches",
      href: "/matches",
      icon: Users,
    },
    {
      name: "Profile",
      href: `/u/${session?.user?.username || ""}`,
      icon: User,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-md hover:bg-accent transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full lg:h-screen w-64 bg-card border-r border-border z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:relative lg:z-auto
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          ${className}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Logo />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-md transition-colors
                    ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info and signout */}
          <div className="p-4 border-t border-border space-y-2">
            {session?.user && (
              <div className="px-4 py-2 text-sm">
                <div className="font-medium text-foreground">
                  {session.user.username || session.user.email}
                </div>
                {session.user.email && (
                  <div className="text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign out</span>
            </button>
          </div>
        </div>
      </aside>

    </>
  );
}

