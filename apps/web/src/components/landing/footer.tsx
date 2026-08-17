"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, ArrowRight, GraduationCap } from "lucide-react";
import LogoImage from "../../../assets/images/logo/logo.png";

const footerLinks = {
  programs: {
    title: "Programs",
    links: [
      { label: "Basic Education", href: "/programs/basic-education" },
      { label: "Entrance Exam Prep", href: "/programs/entrance-exams" },
      { label: "College", href: "/programs/college" },
      { label: "Board Exam Review", href: "/programs/board-exams" },
      { label: "Professional Development", href: "/programs/professional" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Study Tips", href: "/resources/study-tips" },
      { label: "FAQ", href: "/faq" },
      { label: "Help Center", href: "/help" },
      { label: "Contact Support", href: "/support" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Our Mission", href: "/mission" },
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Partners", href: "/partners" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Data Protection", href: "/data-protection" },
    ],
  },
};

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-arc-navy-950 text-arc-navy-200 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-arc-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-arc-purple-500/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="py-12 border-b border-arc-navy-800">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Stay updated with ARATC
              </h3>
              <p className="text-arc-navy-300">
                Get the latest study tips, new programs, and exclusive offers delivered to your inbox.
              </p>
            </div>
            <div className="flex w-full max-w-md gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-arc-navy-400" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-arc-navy-900 border border-arc-navy-700 text-white placeholder:text-arc-navy-500 focus:outline-none focus:border-arc-orange-500 focus:ring-1 focus:ring-arc-orange-500 transition-colors"
                />
              </div>
              <button className="h-12 px-6 rounded-xl bg-arc-orange-500 hover:bg-arc-orange-600 text-white font-semibold transition-colors flex items-center gap-2 whitespace-nowrap">
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Footer */}
        <div className="py-16 grid gap-12 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="relative h-10 w-16 rounded-lg bg-white shadow-lg overflow-hidden p-0.5">
                <Image src={LogoImage} alt="ARATC Logo" fill className="object-contain" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">ARATC</span>
            </Link>
            <p className="text-sm text-arc-navy-300 mb-6 leading-relaxed">
              Philippines' premier digital learning and examination platform.
              Supporting learners from basic education through professional development.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-arc-navy-800 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-arc-orange-400" />
                </div>
                <span className="text-arc-navy-300">contact@aratc.ph</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-arc-navy-800 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-arc-orange-400" />
                </div>
                <span className="text-arc-navy-300">+63 (2) 8123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-arc-navy-800 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-arc-orange-400" />
                </div>
                <span className="text-arc-navy-300">Makati City, Philippines</span>
              </div>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key}>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-arc-navy-300 hover:text-arc-orange-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-arc-navy-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-arc-navy-400">
              © {new Date().getFullYear()} ARATC Inc. All rights reserved.
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-arc-navy-800 hover:bg-arc-orange-500 text-arc-navy-300 hover:text-white transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
