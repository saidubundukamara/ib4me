"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue, SelectItem, SelectTrigger, SelectContent } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Clock, Send, Phone } from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/lib/settings-provider";

const FALLBACK_EMAIL = "ib4me.organisation@gmail.com";
const FALLBACK_ADDRESS = "27B Grassfield";
const FALLBACK_CITY = "Freetown";
const FALLBACK_COUNTRY = "Sierra Leone";
const FALLBACK_BUSINESS_HOURS = "Monday - Friday: 8am - 6pm\nSaturday: 9am - 4pm\nSunday: Closed";

const Contact = () => {
  const { contact, loading } = useSettings();
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = contact?.email || FALLBACK_EMAIL;
  const phone = contact?.phone;
  const address = contact?.address || FALLBACK_ADDRESS;
  const city = contact?.city || FALLBACK_CITY;
  const state = contact?.state;
  const country = contact?.country || FALLBACK_COUNTRY;
  const businessHours = contact?.businessHours || FALLBACK_BUSINESS_HOURS;

  const formattedAddress = [address, city, state, country].filter(Boolean).join(", ");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const firstName = (formData.get("firstName") as string)?.trim();
    const lastName = (formData.get("lastName") as string)?.trim();
    const senderEmail = (formData.get("email") as string)?.trim();
    const message = (formData.get("message") as string)?.trim();

    if (!firstName || !lastName || !senderEmail || !message) {
      toast.error("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    const subjectLine = subject || "General Inquiry";
    const mailtoBody = `Name: ${firstName} ${lastName}\nEmail: ${senderEmail}\nSubject: ${subjectLine}\n\nMessage:\n${message}`;
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(mailtoBody)}`;

    window.open(mailtoLink, "_blank");
    toast.success(
      `Opening your email client. If it doesn't open, please email us directly at ${email}`
    );
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background font-Sora">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-fun-green py-14 sm:py-18 lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blaze-orange/10 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Get In <span className="text-blaze-orange">Touch</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
            Have questions? We&apos;re here to help. Reach out to our support team and we&#39;ll get back to you as soon as possible.
          </p>
        </div>
        <div className="absolute -bottom-px left-0 right-0">
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full" preserveAspectRatio="none">
            <path d="M0 56h1440V28c-240-28-480-28-720 0S240 56 0 28v28Z" fill="white" />
          </svg>
        </div>
      </section>

      <main className="py-14 sm:py-18 lg:py-24">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="rounded-3xl border-0 p-6 shadow-[var(--shadow-lift)] sm:p-8">
                <h2 className="mb-6 text-2xl font-bold text-foreground">Send Us a Message</h2>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">First Name <span className="text-red-600">*</span></Label>
                      <Input id="firstName" name="firstName" placeholder="John" className="mt-2" required />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name <span className="text-red-600">*</span></Label>
                      <Input id="lastName" name="lastName" placeholder="Doe" className="mt-2" required />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address <span className="text-red-600">*</span></Label>
                    <Input id="email" name="email" type="email" placeholder="john@example.com" className="mt-2" required />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="+232 76 123456" className="mt-2" />
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject <span className="text-red-600">*</span></Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger id="subject" className="my-2 rounded-2xl">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                        <SelectItem value="Campaign Support">Campaign Support</SelectItem>
                        <SelectItem value="Technical Issue">Technical Issue</SelectItem>
                        <SelectItem value="Partnership Opportunity">Partnership Opportunity</SelectItem>
                        <SelectItem value="Media Inquiry">Media Inquiry</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message">Message <span className="text-red-600">*</span></Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us how we can help you..."
                      className="mt-2 min-h-[150px]"
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    <Send className="mr-2 h-5 w-5" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              {loading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="rounded-3xl border-0 p-6 shadow-[var(--shadow-soft)]">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-36 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-44 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </>
              ) : (
                <>
                  <Card className="rounded-3xl border-0 p-6 shadow-[var(--shadow-soft)]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-bold text-foreground">Email Us</h3>
                        <p className="mb-2 text-sm text-muted-foreground">
                          Send us an email anytime
                        </p>
                        <a href={`mailto:${email}`} className="text-sm text-primary hover:underline">
                          {email}
                        </a>
                      </div>
                    </div>
                  </Card>

                  {phone && (
                    <Card className="rounded-3xl border-0 p-6 shadow-[var(--shadow-soft)]">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Phone className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="mb-1 font-bold text-foreground">Call Us</h3>
                          <p className="mb-2 text-sm text-muted-foreground">
                            Speak with our team
                          </p>
                          <a href={`tel:${phone}`} className="text-sm text-primary hover:underline">
                            {phone}
                          </a>
                        </div>
                      </div>
                    </Card>
                  )}

                  <Card className="rounded-3xl border-0 p-6 shadow-[var(--shadow-soft)]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-chartereuse/10">
                        <MapPin className="h-6 w-6 text-chartereuse" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-bold text-foreground">Visit Us</h3>
                        <p className="text-sm text-muted-foreground">
                          {formattedAddress}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="rounded-3xl border-0 p-6 shadow-[var(--shadow-soft)]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-blaze/10">
                        <Clock className="h-6 w-6 text-orange-blaze" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-bold text-foreground">Business Hours</h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {businessHours.split("\n").map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
