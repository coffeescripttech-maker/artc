"use client";

import { useState } from "react";
import { Navbar, Footer } from "@/components/landing";
import { Button, Card, CardContent } from "@/components/ui";
import { Input, Label } from "@/components/ui";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
} from "lucide-react";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Get help via email",
    detail: "support@aratc.ph",
    response: "24-48 hours",
    color: "navy",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Chat with our team",
    detail: "Available in-app",
    response: "Usually instant",
    color: "green",
  },
  {
    icon: Phone,
    title: "Phone Support",
    description: "Premium members only",
    detail: "+63 (2) 8123-4567",
    response: "Mon-Fri, 9AM-6PM",
    color: "purple",
  },
];

const offices = [
  {
    city: "Manila",
    address: "123 Business Center, Makati City, 1200",
    phone: "+63 (2) 8123-4567",
  },
  {
    city: "Cebu",
    address: "456 Tech Hub, Cebu City, 6000",
    phone: "+63 (32) 234-5678",
  },
  {
    city: "Davao",
    address: "789 Innovation Park, Davao City, 8000",
    phone: "+63 (82) 345-6789",
  },
];

const colorClasses = {
  navy: "bg-arc-navy-100 text-arc-navy-700",
  green: "bg-arc-green-100 text-arc-green-700",
  purple: "bg-arc-purple-100 text-arc-purple-700",
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-arc-bg">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-arc-navy-900 to-arc-navy-800 text-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
            <p className="text-xl text-arc-navy-200 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Our team is ready to help you succeed.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-12 -mt-8">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {contactMethods.map((method) => (
                <Card key={method.title} className="text-center hover:shadow-arc-lg transition-all">
                  <CardContent className="p-6">
                    <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${colorClasses[method.color as keyof typeof colorClasses]} mb-4`}>
                      <method.icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-bold text-arc-navy-900 mb-1">{method.title}</h3>
                    <p className="text-sm text-arc-slate-500 mb-2">{method.description}</p>
                    <p className="font-semibold text-arc-navy-700">{method.detail}</p>
                    <p className="text-xs text-arc-slate-400 mt-1">{method.response}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Form */}
              <Card className="shadow-arc-lg">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-arc-navy-900 mb-6">Send us a Message</h2>

                  {submitted ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 text-arc-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-arc-navy-900 mb-2">Message Sent!</h3>
                      <p className="text-arc-slate-600">
                        Thank you for reaching out. We'll get back to you within 24-48 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="Juan"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="Dela Cruz"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="juan@email.com"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+63 912 345 6789"
                        />
                      </div>

                      <div>
                        <Label htmlFor="subject">Subject</Label>
                        <select
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="flex h-11 w-full rounded-lg border border-arc-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500 focus:border-arc-navy-500"
                          required
                        >
                          <option value="">Select a topic</option>
                          <option value="sales">Sales Inquiry</option>
                          <option value="support">Technical Support</option>
                          <option value="billing">Billing Question</option>
                          <option value="partnership">Partnership</option>
                          <option value="feedback">Feedback</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="message">Message</Label>
                        <textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="How can we help you?"
                          className="flex w-full rounded-lg border border-arc-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-arc-navy-500 focus:border-arc-navy-500 min-h-[120px]"
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full" size="lg">
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Info */}
              <div className="space-y-8">
                {/* Offices */}
                <div>
                  <h3 className="text-xl font-bold text-arc-navy-900 mb-4">Our Offices</h3>
                  <div className="space-y-4">
                    {offices.map((office) => (
                      <Card key={office.city}>
                        <CardContent className="p-5">
                          <h4 className="font-bold text-arc-navy-900 mb-2">{office.city}</h4>
                          <div className="space-y-2 text-sm text-arc-slate-600">
                            <div className="flex items-start gap-3">
                              <MapPin className="h-4 w-4 mt-0.5 text-arc-navy-400" />
                              <span>{office.address}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Phone className="h-4 w-4 text-arc-navy-400" />
                              <span>{office.phone}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Business Hours */}
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Clock className="h-5 w-5 text-arc-navy-600" />
                      <h4 className="font-bold text-arc-navy-900">Business Hours</h4>
                    </div>
                    <div className="space-y-2 text-sm text-arc-slate-600">
                      <div className="flex justify-between">
                        <span>Monday - Friday</span>
                        <span className="font-medium">9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday</span>
                        <span className="font-medium">10:00 AM - 4:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday</span>
                        <span className="text-arc-slate-400">Closed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media */}
                <div>
                  <h4 className="font-bold text-arc-navy-900 mb-4">Follow Us</h4>
                  <div className="flex gap-3">
                    {[Facebook, Twitter, Instagram, Youtube, Linkedin].map((Icon, i) => (
                      <a
                        key={i}
                        href="#"
                        className="h-12 w-12 flex items-center justify-center rounded-xl bg-arc-navy-100 text-arc-navy-600 hover:bg-arc-navy-200 transition-colors"
                      >
                        <Icon className="h-5 w-5" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Preview */}
        <section className="py-16 bg-arc-slate-50">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-arc-navy-900 mb-4">
              Need Quick Answers?
            </h2>
            <p className="text-arc-slate-600 mb-6">
              Check our frequently asked questions for instant help.
            </p>
            <Button variant="outline" size="lg" asChild>
              <a href="/faq">View FAQs</a>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
