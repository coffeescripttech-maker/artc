"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  ChevronDown,
  User,
  LogOut,
  Settings,
  BookOpen,
  Award,
  GraduationCap,
  Users,
  Bell,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Avatar,
  AvatarFallback,
} from "@/components/ui";
import LogoImage from "../../../assets/images/logo/logo.png";

const navLinks = [
  {
    label: "Programs",
    href: "/programs",
    children: [
      {
        label: "Basic Education",
        href: "/programs/basic-education",
        icon: BookOpen,
        description: "Grades 1-12 curriculum",
      },
      {
        label: "Entrance Exams",
        href: "/programs/entrance-exams",
        icon: Award,
        description: "JHS, SHS, College prep",
      },
      {
        label: "Board Exams",
        href: "/programs/board-exams",
        icon: GraduationCap,
        description: "Professional licensure prep",
      },
      { label: "Schools", href: "/programs/schools", icon: Users, description: "For institutions" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isLoggedIn] = useState(false); // TODO: Connect to auth state

  return (
    <header className="sticky top-0 z-50 w-full bg-arc-navy-950/95 backdrop-blur-xl border-b border-white/10">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-12">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-20 h-10  rounded-lg overflow-hidden shadow-lg shadow-arc-orange-500/20">
                <Image src={LogoImage} alt="ARATC Logo" fill className="object-contain" />
              </div>
              {/* <span className="text-2xl font-bold text-white tracking-tight group-hover:text-arc-orange-400 transition-colors">
                ARATC
              </span> */}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {navLinks.map((link) =>
                link.children ? (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(link.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/80 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200">
                      {link.label}
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === link.label ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* Dropdown */}
                    <div
                      className={`absolute left-0 top-full pt-2 transition-all duration-200 ${activeDropdown === link.label ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
                    >
                      <div className="w-72 rounded-xl bg-arc-navy-900 border border-white/10 shadow-arc-xl p-2">
                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group/item cursor-pointer"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 group-hover:bg-arc-orange-500/20 transition-colors">
                              <child.icon className="h-5 w-5 text-white/70 group-hover:text-arc-orange-400 transition-colors" />
                            </div>
                            <div>
                              <div className="font-semibold text-white">{child.label}</div>
                              <div className="text-xs text-white/50">{child.description}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href || "#"}
                    className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Right Side - Search, Notifications, Profile */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <button className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200">
              <Search className="h-5 w-5" />
            </button>

            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-arc-orange-500" />
                </button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                      <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-arc-orange-500/50 transition-all">
                        <AvatarFallback className="bg-gradient-to-br from-arc-orange-500 to-arc-orange-600 text-white text-sm font-semibold">
                          JD
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 p-2 bg-arc-navy-900 border-white/10"
                  >
                    <div className="px-3 py-3 border-b border-white/10 mb-2">
                      <div className="font-semibold text-white">Juan Dela Cruz</div>
                      <div className="text-xs text-white/50">juan@email.com</div>
                    </div>
                    <DropdownMenuItem className="focus:bg-white/5 focus:text-white">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-white/70 hover:text-white w-full"
                      >
                        <User className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-white/5 focus:text-white">
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-white/70 hover:text-white w-full"
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-white/70 hover:text-arc-red-400 hover:bg-arc-red-500/10 focus:bg-arc-red-500/10 focus:text-arc-red-400">
                      <LogOut className="h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Login & Get Started */}
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/5"
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="accent" size="sm" className="shadow-lg shadow-arc-orange-500/25">
                    Get Started
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 overflow-hidden ${mobileMenuOpen ? "max-h-screen py-4 border-t border-white/10" : "max-h-0"}`}
        >
          <div className="space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                <Link
                  href={link.href || "#"}
                  className="block px-3 py-3 text-base font-medium text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
                {link.children && (
                  <div className="ml-4 space-y-1 mt-1">
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <child.icon className="h-4 w-4" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile Auth Buttons */}
            {!isLoggedIn && (
              <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                <Link href="/login" className="block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-white/80 hover:text-white hover:bg-white/5"
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/register" className="block">
                  <Button variant="accent" size="sm" className="w-full justify-center">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
