"use client";

import { ChevronDown, FileText, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsInbox } from "@/components/notifications/notifications-inbox";

interface NavHeaderProps {
  isSignedIn?: boolean;
  sessionPending?: boolean;
  userEmail?: string;
  onSignOut?: () => void | Promise<void>;
}

export function NavHeader({
  isSignedIn = false,
  sessionPending = false,
  userEmail,
  onSignOut,
}: NavHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden sm:inline-block">Live Notes</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
              <Link href="/">Home</Link>
            </Button>
            {isSignedIn || sessionPending ? (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  {sessionPending ? "Loading..." : "Dashboard"}
                </Link>
              </Button>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {!sessionPending && isSignedIn ? <NotificationsInbox /> : null}
          {sessionPending ? (
            <div className="flex items-center gap-2 rounded-md px-2 py-1">
              <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
              <div className="hidden h-4 w-24 animate-pulse rounded bg-muted sm:block" />
            </div>
          ) : isSignedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {userEmail?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="hidden max-w-32 truncate text-sm sm:inline-block">{userEmail}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{userEmail}</p>
                  <p className="text-xs text-muted-foreground">Signed in</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void onSignOut?.();
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
