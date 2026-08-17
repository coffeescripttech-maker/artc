"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, Award, Building } from "lucide-react";

const stats = [
  {
    icon: Users,
    label: "Active Learners",
    value: 15000,
    suffix: "+",
  },
  {
    icon: BookOpen,
    label: "Video Lessons",
    value: 1000,
    suffix: "+",
  },
  {
    icon: Award,
    label: "Board Pass Rate",
    value: 94,
    suffix: "%",
  },
  {
    icon: Building,
    label: "Partner Schools",
    value: 150,
    suffix: "+",
  },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="py-16 bg-arc-navy-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">
            Trusted Across the Philippines
          </h2>
          <p className="text-arc-navy-200 max-w-2xl mx-auto">
            Join thousands of Filipino learners achieving their educational goals
          </p>
        </div>

        {/* Stats Grid - 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-arc-navy-800 mb-4">
                <stat.icon className="h-6 w-6 text-arc-orange-400" />
              </div>
              <div className="text-3xl lg:text-4xl font-bold text-white mb-2 tabular-nums">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm text-arc-navy-300">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Accreditations */}
        <div className="mt-12 pt-8 border-t border-arc-navy-800 text-center">
          <p className="text-sm text-arc-navy-400 mb-4">Accredited & Compliant</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-arc-navy-300">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-arc-green-400" />
              DepEd K-12 Aligned
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-arc-green-400" />
              PRC Accredited Review Center
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-arc-green-400" />
              CHED Compliant
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
