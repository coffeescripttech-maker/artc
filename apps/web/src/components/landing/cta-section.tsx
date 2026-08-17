"use client";

import { Button } from "@/components/ui";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-20 lg:py-28 bg-arc-navy-900">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          {/* Headline */}
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Your Learning Journey?
          </h2>

          {/* Subheadline */}
          <p className="text-lg text-arc-navy-200 mb-10 leading-relaxed">
            Join thousands of Filipino learners who are already achieving their educational goals.
            Start your free trial today and discover how ARATC can help you succeed.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/register">
              <Button
                variant="accent"
                size="lg"
                className="w-full sm:w-auto"
              >
                Start Free Trial
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
              >
                Contact Sales
              </Button>
            </Link>
          </div>

          {/* Trust line */}
          <p className="text-sm text-arc-navy-400">
            No credit card required · Cancel anytime · 24/7 support
          </p>
        </div>
      </div>
    </section>
  );
}
