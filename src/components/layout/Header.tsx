"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/config/site';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthContext';
import {
  Bot,
  Menu,
  UserCircle2,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Sparkles,
  Briefcase,
  Compass,
  User,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { UserAvatar } from '@/components/shared/UserAvatar';

export default function Header() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = siteConfig.mainNav.filter(item => item.title !== 'Home');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 border border-primary/30 text-primary shadow-[0_0_15px_-3px_var(--primary-glow)] group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
              {siteConfig.name}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md transition-colors duration-200",
                  isActive
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Right Side Actions (Auth & Mobile Menu) */}
        <div className="flex items-center space-x-3">
          {!loading && (
            <div className="hidden sm:flex items-center space-x-2">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "border-primary/30 hover:border-primary/60 hidden lg:inline-flex"
                    )}
                  >
                    <LayoutDashboard className="mr-1.5 h-4 w-4 text-primary" />
                    Dashboard
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border border-border/60 hover:border-primary/50">
                        <UserAvatar
                          src={user.photoURL}
                          alt={user.displayName || user.email || "User"}
                          fallback={(user.displayName || user.email || "U").substring(0, 2).toUpperCase()}
                          size="sm"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.displayName || "AgentVerse User"}</p>
                          <p className="text-xs leading-none text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>My Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer flex items-center">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Developer Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/agents/apply" className="cursor-pointer flex items-center">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          <span>List New Agent</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_12px_-2px_var(--primary-glow)]"
                    )}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Mobile Hamburger Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] flex flex-col justify-between">
              <div>
                <SheetHeader className="text-left border-b pb-4 mb-4">
                  <SheetTitle className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <span>{siteConfig.name}</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-2">
                  {siteConfig.mainNav.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                        pathname === item.href
                          ? "bg-primary/15 text-primary font-semibold"
                          : "text-foreground/80 hover:bg-muted"
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                  {user && (
                    <>
                      <div className="my-2 border-t border-border/50" />
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-3 py-2.5 rounded-md text-sm font-medium text-foreground/80 hover:bg-muted flex items-center"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
                        Developer Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-3 py-2.5 rounded-md text-sm font-medium text-foreground/80 hover:bg-muted flex items-center"
                      >
                        <User className="mr-2 h-4 w-4 text-primary" />
                        My Profile
                      </Link>
                    </>
                  )}
                </nav>
              </div>

              <div className="border-t pt-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-2">
                      <UserAvatar
                        src={user.photoURL}
                        alt={user.displayName || user.email || "User"}
                        fallback={(user.displayName || user.email || "U").substring(0, 2).toUpperCase()}
                        size="sm"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate">{user.displayName || "User"}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-full")}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
