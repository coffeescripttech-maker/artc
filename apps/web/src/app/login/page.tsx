"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import LogoImage from "../../../assets/images/logo/logo.png";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-arc-navy-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-arc-orange-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-arc-purple-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-arc-navy-700/30 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="relative h-12 w-20 rounded-xl bg-white shadow-lg overflow-hidden p-1">
              <Image src={LogoImage} alt="ARATC Logo" fill className="object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ARATC</span>
          </Link>

          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Welcome Back to Your <span className="text-arc-orange-400">Learning Journey</span>
          </h1>
          <p className="text-xl text-white/70 mb-12 max-w-md">
            Continue where you left off. Your personalized learning path awaits.
          </p>

          <div className="space-y-5">
            {[
              "Track your learning progress",
              "Access 10,000+ practice questions",
              "Review anytime, anywhere",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-arc-orange-500/20">
                  <Check className="h-5 w-5 text-arc-orange-400" />
                </div>
                <span className="text-lg text-white/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-arc-bg">
        <div className="relative w-full max-w-md">
          <div className="absolute -top-4 -right-4 w-full h-full bg-gradient-to-br from-arc-orange-500/10 to-arc-purple-500/10 rounded-3xl" />

          <div className="relative bg-white rounded-3xl p-8 sm:p-10 border border-arc-slate-100 shadow-arc-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-arc-orange-100/50 to-transparent rounded-bl-[6rem]" />

            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <div className="relative h-10 w-16 rounded-lg bg-white shadow-lg overflow-hidden p-1">
                <Image src={LogoImage} alt="ARATC Logo" fill className="object-contain" />
              </div>
              <span className="text-xl font-bold text-arc-navy-900">ARATC</span>
            </div>

            <div className="text-center lg:text-left mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-arc-navy-900">Sign in to your account</h2>
              <p className="mt-2 text-sm sm:text-base text-arc-slate-600">
                Or{" "}
                <Link href="/register" className="font-semibold text-arc-orange-500 hover:text-arc-orange-600">
                  create a new account
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-arc-navy-900 font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="h-12 border-arc-slate-200 focus:border-arc-navy-500 focus:ring-arc-navy-500 bg-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-arc-navy-900 font-medium">
                    Password
                  </Label>
                  <Link href="/forgot-password" className="text-sm font-medium text-arc-orange-500 hover:text-arc-orange-600">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-12 pr-12 border-arc-slate-200 focus:border-arc-navy-500 focus:ring-arc-navy-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-arc-slate-400 hover:text-arc-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-arc-slate-300 text-arc-orange-500 focus:ring-arc-orange-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-arc-slate-600">
                  Remember me for 30 days
                </label>
              </div>

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full shadow-lg shadow-arc-orange-500/20"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-arc-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-arc-slate-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" size="lg" className="h-12 border-arc-slate-200 hover:bg-arc-slate-50">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button variant="outline" size="lg" className="h-12 border-arc-slate-200 hover:bg-arc-slate-50">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                GitHub
              </Button>
            </div>

            <p className="mt-8 text-center text-xs sm:text-sm text-arc-slate-500">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="text-arc-orange-500 hover:underline font-medium">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-arc-orange-500 hover:underline font-medium">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
