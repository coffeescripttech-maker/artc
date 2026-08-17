"use client";

import { Avatar, AvatarFallback } from "@/components/ui";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Maria Santos",
    role: "Grade 10 Student",
    avatar: "MS",
    content: "ARATC helped me improve my math grades from 75 to 92 in just 3 months. The practice tests are really helpful!",
    rating: 5,
    program: "Basic Education",
  },
  {
    name: "Juan Cruz",
    role: "Nursing Board Reviewee",
    avatar: "JC",
    content: "The mock boards and detailed explanations helped me pass the nursing board exam on my first try. Highly recommended!",
    rating: 5,
    program: "Board Exam Review",
  },
  {
    name: "Ana Reyes",
    role: "Parent",
    avatar: "AR",
    content: "My two children use ARATC for their studies. The progress tracking helps me monitor their performance easily.",
    rating: 5,
    program: "Family Account",
  },
  {
    name: "Carlo Mendoza",
    role: "College Freshman",
    avatar: "CM",
    content: "The entrance exam prep was crucial for my admission to UP. The practice tests were exactly like the real exam.",
    rating: 5,
    program: "Entrance Exam Prep",
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header - Left aligned */}
        <div className="mb-16 max-w-2xl">
          <p className="text-sm font-semibold text-arc-orange-500 uppercase tracking-wider mb-3">
            Success Stories
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-arc-navy-900 mb-4">
            Trusted by Thousands of Learners
          </h2>
          <p className="text-lg text-arc-slate-600">
            See what our learners say about their ARATC experience.
          </p>
        </div>

        {/* Testimonials Grid - 2 columns, asymmetric */}
        <div className="grid gap-6 lg:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-arc-slate-50 rounded-2xl p-6 lg:p-8 border border-arc-slate-100"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-arc-orange-400 text-arc-orange-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-arc-slate-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-arc-navy-900 text-white font-semibold">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-arc-navy-900">{testimonial.name}</div>
                  <div className="text-sm text-arc-slate-500">{testimonial.role}</div>
                </div>
                <div className="hidden sm:block">
                  <span className="inline-flex items-center rounded-full bg-arc-slate-100 px-3 py-1 text-xs font-medium text-arc-slate-600">
                    {testimonial.program}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
