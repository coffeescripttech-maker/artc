"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check, AlertCircle, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import LogoImage from "../../../assets/images/logo/logo.png";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate sending email (backend integration needed)
    // For demo purposes, we'll just show success after a delay
    try {
      // TODO: Connect to backend API
      // await apiRequest("/api/auth/forgot-password", {
      //   method: "POST",
      //   body: JSON.stringify({ email }),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-arc-navy-950 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-arc-orange-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-arc-purple-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative z-10 flex flex-col justify-center px-16 text-white">
            <Link href="/" className="flex items-center gap-3 mb-16">
              <div className="relative h-12 w-20 rounded-xl bg-white shadow-lg overflow-hidden p-1">
                <Image src={LogoImage} alt="ARATC Logo" fill className="object-contain" />
              </div>
              <span className="text-2xl font-bold tracking-tight">ARATC</span>
            </Link>

            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Password Reset <span className="text-arc-orange-400">Sent!</span>
            </h1>
            <p className="text-xl text-white/70 mb-12 max-w-md">
              Check your email for instructions to reset your password.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-arc-bg">
          <div className="relative w-full max-w-md">
            <div className="relative bg-white rounded-3xl p-8 sm:p-10 border border-arc-slate-100 shadow-arc-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-100/50 to-transparent rounded-bl-[6rem]" />

              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <div className="relative h-10 w-16 rounded-lg bg-white shadow-lg overflow-hidden p-1">
                  <Image src={LogoImage} alt="ARATC Logo" fill className="object-contain" />
                </div>
                <span className="text-xl font-bold text-arc-navy-900">ARATC</span>
              </div>

              <div className="text-center mb-8">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-arc-navy-900">Check your email</h2>
                <p className="mt-2 text-sm sm:text-base text-arc-slate-600">
                  We sent a password reset link to <span className="font-semibold">{email}</span>
                </p>
              </div>

              <div className="bg-arc-slate-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-arc-slate-600 text-center">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => setEmailSent(false)}
                    className="text-arc-orange-500 font-medium hover:underline"
                  >
                    try again
                  </button>
                </p>
              </div>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-arc-slate-500 hover:text-arc-orange-500 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-arc-navy-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-arc-orange-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-arc-purple-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <div className="relative h-12 w-20 rounded-xl bg-white shadow-lg overflow-hidden p-1">
              <Image src={LogoImage} alt="ARATC Logo" fill className="object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ARATC</span>
          </Link>

          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Reset Your <span className="text-arc-orange-400">Password</span>
          </h1>
          <p className="text-xl text-white/70 mb-12 max-w-md">
            Enter your email address and we'll send you a link to reset your password.
          </p>
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

      {/* Right Panel - Form */}
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
              <h2 className="text-2xl sm:text-3xl font-bold text-arc-navy-900">Forgot password?</h2>
              <p className="mt-2 text-sm sm:text-base text-arc-slate-600">
                No worries, we'll send you reset instructions.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-arc-navy-900 font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-arc-slate-200 focus:border-arc-navy-500 focus:ring-arc-navy-500 bg-white"
                />
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
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-arc-slate-500 hover:text-arc-orange-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
