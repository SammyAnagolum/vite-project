// src/components/layout/HeaderBar.tsx
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, HelpCircle, LogOut, Settings, User, Search as SearchIcon } from "lucide-react";

function titleCase(slug: string) {
  return slug
    .split("-")
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-foreground">Home</Link>
      {parts.map((p, idx) => {
        const href = "/" + parts.slice(0, idx + 1).join("/");
        return (
          <React.Fragment key={href}>
            <span className="mx-1">/</span>
            <Link to={href} className="hover:text-foreground">{titleCase(p)}</Link>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default function HeaderBar() {
  // wire real user/email via auth context later
  const user = { name: "Admin User", email: "admin@example.com" };
  const initials = React.useMemo(
    () => user.name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase(),
    [user.name]
  );

  // read environment label from env; fall back to "Sandbox"
  const envLabel = import.meta.env.VITE_APP_ENV || "Sandbox";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      {/* Left: breadcrumbs */}
      <Breadcrumbs />

      {/* Center: quick search (optional) */}
      <div className="relative ml-auto hidden w-72 items-center md:flex">
        <SearchIcon className="pointer-events-none absolute left-2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search…"
          className="pl-8"
        // onKeyDown={(e) => e.key === 'k' && openCommandPalette()}
        />
      </div>

      {/* Environment pill */}
      <span className="hidden rounded-md border px-2 py-1 text-xs text-muted-foreground md:inline">
        {envLabel}
      </span>

      {/* Actions */}
      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Help">
        <HelpCircle className="h-5 w-5" />
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 gap-2 px-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="leading-tight">
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex w-full items-center gap-2">
              <User className="h-4 w-4" /> Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex w-full items-center gap-2">
              <Settings className="h-4 w-4" /> Preferences
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {/* hook sign-out here */ }} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
