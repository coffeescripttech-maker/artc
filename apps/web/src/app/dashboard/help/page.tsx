"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Input,
  Label,
  Separator,
} from "@/components/ui";
import {
  Search,
  ChevronRight,
  Book,
  MessageCircle,
  Mail,
  Phone,
  HelpCircle,
  ExternalLink,
  FileText,
  Video,
  Users,
  MessageSquare,
  Send,
} from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I enroll in a program?",
        a: "To enroll in a program, go to the Programs page, select the program you're interested in, and click the 'Enroll' button. You can enroll in multiple programs simultaneously.",
      },
      {
        q: "How do I track my progress?",
        a: "Your progress is automatically tracked as you complete lessons. Visit the Dashboard to see your overall progress, or the Analytics page for detailed statistics.",
      },
      {
        q: "Can I access content offline?",
        a: "Currently, offline access is not available. You need an internet connection to access lessons and take quizzes.",
      },
    ],
  },
  {
    category: "Account & Billing",
    questions: [
      {
        q: "How do I change my subscription plan?",
        a: "Go to Settings > Billing to view and change your subscription plan. Changes take effect at the start of your next billing cycle.",
      },
      {
        q: "Can I get a refund?",
        a: "Yes, we offer a 7-day money-back guarantee for new subscribers. Contact our support team to request a refund.",
      },
      {
        q: "How do I update my payment method?",
        a: "Go to Settings > Billing > Payment Method to update your credit card or payment information.",
      },
    ],
  },
  {
    category: "Technical Issues",
    questions: [
      {
        q: "Why is the video not loading?",
        a: "Try refreshing the page or clearing your browser cache. If the issue persists, check your internet connection or try a different browser.",
      },
      {
        q: "How do I report a bug?",
        a: "Use the 'Report an Issue' button below or contact our support team. Please include a description of the issue and any error messages you see.",
      },
    ],
  },
];

const resources = [
  { title: "Getting Started Guide", icon: Book, count: "5 articles" },
  { title: "Video Tutorials", icon: Video, count: "12 videos" },
  { title: "FAQs", icon: HelpCircle, count: "24 questions" },
  { title: "Community Forum", icon: Users, count: "1.2k members" },
];

const contactOptions = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Get help via email",
    detail: "support@aratc.ph",
    availability: "24-48 hours",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our team",
    detail: "Available Mon-Fri, 9AM-6PM",
    availability: "Usually online",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Premium users only",
    detail: "+63 (2) 8123-4567",
    availability: "Premium Plan",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);

  return (
    <>
      <DashboardHeader title="Help & Support" subtitle="Get help and answers to your questions" />

      <div className="p-6">
        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for help articles, FAQs, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </div>

        {/* Quick Resources */}
        <div className="grid gap-4 mb-8 md:grid-cols-4">
          {resources.map((resource) => (
            <Card key={resource.title} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <resource.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{resource.title}</div>
                  <div className="text-sm text-gray-500">{resource.count}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* FAQs */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.category}
                  </h3>
                  <div className="space-y-2">
                    {section.questions.map((item, questionIndex) => {
                      const globalIndex = sectionIndex * 100 + questionIndex;
                      return (
                        <Card key={questionIndex} className="overflow-hidden">
                          <button
                            onClick={() => setExpandedQuestion(
                              expandedQuestion === globalIndex ? null : globalIndex
                            )}
                            className="w-full p-4 text-left flex items-center justify-between"
                          >
                            <span className="font-medium text-gray-900">{item.q}</span>
                            <ChevronRight
                              className={`h-5 w-5 text-gray-400 transition-transform ${
                                expandedQuestion === globalIndex ? "rotate-90" : ""
                              }`}
                            />
                          </button>
                          {expandedQuestion === globalIndex && (
                            <div className="px-4 pb-4">
                              <Separator className="mb-4" />
                              <p className="text-gray-600">{item.a}</p>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Support</h2>
            <Card>
              <CardContent className="p-5 space-y-4">
                {contactOptions.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setShowContactForm(true)}
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <option.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{option.title}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                      <div className="text-sm text-blue-600 mt-1">{option.detail}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardContent className="p-5">
                <h3 className="font-medium text-gray-900 mb-3">Send us a message</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Subject</Label>
                    <Input placeholder="How can we help?" />
                  </div>
                  <div>
                    <Label className="text-sm">Message</Label>
                    <textarea
                      className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background text-sm"
                      placeholder="Describe your issue..."
                    />
                  </div>
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Helpful Links */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Helpful Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  "Getting Started Guide",
                  "How to Take a Quiz",
                  "Understanding Your Progress",
                  "Subscription FAQ",
                ].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{link}</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
