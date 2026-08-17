"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import {
  Check,
  X,
  Star,
  Sparkles,
  Zap,
  BookOpen,
  Trophy,
  Users,
  Headphones,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";

const plans = [
  {
    name: "Basic",
    description: "Perfect for casual learners",
    monthlyPrice: 299,
    yearlyPrice: 249,
    features: [
      "Access to 100+ video lessons",
      "Basic progress tracking",
      "Community forum access",
      "Email support",
      "Mobile app access",
    ],
    notIncluded: [
      "Offline downloads",
      "1-on-1 tutoring",
      "Certificate of completion",
      "Priority support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Premium",
    description: "Best for serious learners",
    monthlyPrice: 599,
    yearlyPrice: 499,
    features: [
      "Access to 1,000+ video lessons",
      "Advanced analytics & insights",
      "Community forum access",
      "Priority email support",
      "Mobile app access",
      "Offline downloads",
      "Certificate of completion",
      "Monthly mock exams",
    ],
    notIncluded: [
      "1-on-1 tutoring",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Pro",
    description: "For ultimate exam success",
    monthlyPrice: 999,
    yearlyPrice: 849,
    features: [
      "Access to all video lessons",
      "Full analytics dashboard",
      "Community forum access",
      "24/7 priority support",
      "Mobile app access",
      "Offline downloads",
      "Certificate of completion",
      "Unlimited mock exams",
      "1-on-1 tutoring sessions",
      "Personalized study plan",
      "Live webinars",
    ],
    notIncluded: [],
    cta: "Contact Sales",
    popular: false,
  },
];

const addOns = [
  {
    name: "Additional 1-on-1 Tutoring",
    description: "Per session",
    price: 500,
    icon: Users,
    color: "arc-orange",
  },
  {
    name: "Exam Registration Assistance",
    description: "One-time",
    price: 2000,
    icon: Trophy,
    color: "arc-purple",
  },
  {
    name: "Additional Device Access",
    description: "Per month",
    price: 99,
    icon: BookOpen,
    color: "arc-navy",
  },
];

const faqs = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes, our Premium plan comes with a 7-day free trial. No credit card required.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept GCash, Maya, credit/debit cards, bank transfers, and over-the-counter payments.",
  },
  {
    q: "Can I get a refund?",
    a: "We offer a 30-day money-back guarantee if you're not satisfied with our service.",
  },
  {
    q: "Do you offer student discounts?",
    a: "Yes! Students with a valid ID can get 20% off any plan. Contact us for details.",
  },
  {
    q: "What's included in offline downloads?",
    a: "Premium and Pro plans include downloadable video lessons and study materials for offline access.",
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-arc-bg">
      <Navbar />

      <main>
        {/* Hero - Enhanced with asymmetric design */}
        <section className="relative bg-arc-navy-950 text-white overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-arc-orange-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-arc-purple-500/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Diagonal cut */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-arc-bg" style={{ clipPath: "polygon(0 100%, 100% 100%, 100% 0)" }} />

          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-center">
            <Badge className="bg-arc-orange-500/20 text-arc-orange-300 border-arc-orange-500/30 mb-6 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 mr-1" />
              Special Launch Offer - 20% Off!
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Simple, Transparent <span className="text-arc-orange-400">Pricing</span>
            </h1>
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              Choose the plan that fits your learning goals. All plans include access to our mobile app.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1.5">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  !isYearly
                    ? "bg-arc-orange-500 text-white shadow-lg shadow-arc-orange-500/30"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  isYearly
                    ? "bg-arc-orange-500 text-white shadow-lg shadow-arc-orange-500/30"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                Yearly
                <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">Save 20%</Badge>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16 -mt-16 relative z-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-3 items-stretch">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative ${
                    plan.popular
                      ? "ring-2 ring-arc-orange-500 shadow-arc-2xl lg:-mt-4 lg:mb-4"
                      : "shadow-arc-md"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-arc-orange-500 text-white px-4 py-1.5 shadow-lg shadow-arc-orange-500/30">
                        <Zap className="h-4 w-4 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-arc-navy-900 mb-1">{plan.name}</h3>
                      <p className="text-sm text-arc-slate-500">{plan.description}</p>
                    </div>

                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-sm text-arc-slate-500">₱</span>
                        <span className="text-5xl font-bold text-arc-navy-900">
                          {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-sm text-arc-slate-500">/month</span>
                      </div>
                      {isYearly && (
                        <p className="text-sm text-arc-green-600 mt-1 font-medium">
                          ₱{(plan.yearlyPrice * 12).toLocaleString()} billed yearly
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-arc-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-arc-green-600" />
                          </div>
                          <span className="text-sm text-arc-slate-700">{feature}</span>
                        </li>
                      ))}
                      {plan.notIncluded.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 opacity-50">
                          <div className="h-5 w-5 rounded-full bg-arc-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="h-3 w-3 text-arc-slate-400" />
                          </div>
                          <span className="text-sm text-arc-slate-500">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href="/register" className="block mt-auto">
                      <Button
                        variant={plan.popular ? "accent" : "outline"}
                        className={`w-full ${plan.popular ? "shadow-lg shadow-arc-orange-500/20" : ""}`}
                        size="lg"
                      >
                        {plan.cta}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Add-ons */}
        <section className="py-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-arc-slate-50 to-transparent" />
          <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-arc-navy-900 mb-3">
                Optional Add-ons
              </h2>
              <p className="text-arc-slate-600">Enhance your learning experience with these extras</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {addOns.map((addon) => (
                <Card key={addon.name} className="hover:shadow-arc-md transition-shadow">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl bg-${addon.color}-100 flex items-center justify-center flex-shrink-0`}>
                      <addon.icon className={`h-6 w-6 text-${addon.color}-600`} />
                    </div>
                    <div>
                      <p className="font-semibold text-arc-navy-900">{addon.name}</p>
                      <p className="text-sm text-arc-slate-500">{addon.description}</p>
                      <p className="text-lg font-bold text-arc-navy-900 mt-1">
                        ₱{addon.price.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-arc-navy-900 mb-3">
                Compare Plans
              </h2>
              <p className="text-arc-slate-600">See what's included in each tier</p>
            </div>
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-arc-navy-950 text-white">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold">Basic</th>
                      <th className="text-center p-4 font-semibold bg-arc-orange-500">Premium</th>
                      <th className="text-center p-4 font-semibold">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arc-slate-100">
                    {[
                      { feature: "Video Lessons", basic: "100+", premium: "1,000+", pro: "All" },
                      { feature: "Progress Tracking", basic: "Basic", premium: "Advanced", pro: "Full Analytics" },
                      { feature: "Mobile App", basic: true, premium: true, pro: true },
                      { feature: "Offline Downloads", basic: false, premium: true, pro: true },
                      { feature: "Mock Exams", basic: false, premium: "Monthly", pro: "Unlimited" },
                      { feature: "Certificates", basic: false, premium: true, pro: true },
                      { feature: "1-on-1 Tutoring", basic: false, premium: false, pro: true },
                      { feature: "Priority Support", basic: false, premium: false, pro: true },
                      { feature: "Live Webinars", basic: false, premium: false, pro: true },
                    ].map((row) => (
                      <tr key={row.feature} className="hover:bg-arc-slate-50 transition-colors">
                        <td className="p-4 text-sm font-medium text-arc-navy-900">{row.feature}</td>
                        {[row.basic, row.premium, row.pro].map((val, i) => (
                          <td
                            key={i}
                            className={`p-4 text-center text-sm ${
                              i === 1 ? "bg-arc-orange-50/80" : ""
                            }`}
                          >
                            {typeof val === "boolean" ? (
                              val ? (
                                <div className="h-6 w-6 rounded-full bg-arc-green-100 flex items-center justify-center mx-auto">
                                  <Check className="h-4 w-4 text-arc-green-600" />
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-arc-slate-100 flex items-center justify-center mx-auto">
                                  <X className="h-4 w-4 text-arc-slate-400" />
                                </div>
                              )
                            ) : (
                              <span className="font-medium text-arc-navy-700">{val}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-arc-navy-950 text-white relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-arc-orange-500/5 rounded-full blur-3xl -translate-x-1/2" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-arc-purple-500/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-white/70">Everything you need to know about our pricing</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`rounded-xl border transition-all cursor-pointer ${
                    openFaq === i
                      ? "bg-white/5 border-arc-orange-500/30"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="p-5 flex items-center justify-between">
                    <h3 className="font-semibold text-white pr-4">{faq.q}</h3>
                    <div className={`h-6 w-6 rounded-full border border-white/20 flex items-center justify-center transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {openFaq === i && (
                    <div className="px-5 pb-5">
                      <p className="text-white/70 leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="relative bg-gradient-to-br from-arc-navy-900 via-arc-navy-800 to-arc-purple-900 rounded-3xl p-10 md:p-14 text-white overflow-hidden">
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-arc-orange-500/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
              <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-arc-purple-500/20 rounded-full blur-2xl -translate-x-1/3 translate-y-1/3" />

              <div className="relative z-10 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-arc-orange-500/20 mb-6">
                  <Headphones className="h-8 w-8 text-arc-orange-400" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Still Have Questions?
                </h2>
                <p className="text-white/70 mb-8 max-w-xl mx-auto text-lg">
                  Our team is here to help you choose the right plan for your learning goals.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button variant="accent" size="lg" className="shadow-lg shadow-arc-orange-500/20 min-w-[180px]">
                      <Headphones className="h-5 w-5 mr-2" />
                      Contact Sales
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 min-w-[180px]">
                      Start Free Trial
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
