"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue, SelectItem, SelectTrigger, SelectContent } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Clock, Send, Phone, CheckCircle2 } from "lucide-react";
import { useSettings } from "@/lib/settings-provider";

const MAX_MESSAGE = 1000;

type FieldErrors = Partial<Record<"firstName" | "lastName" | "email" | "subject" | "message", string>>;

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

const FALLBACK_EMAIL = "ib4me.organisation@gmail.com";
const FALLBACK_ADDRESS = "27B Grassfield";
const FALLBACK_CITY = "Freetown";
const FALLBACK_COUNTRY = "Sierra Leone";
const FALLBACK_BUSINESS_HOURS = "Monday - Friday: 8am - 6pm\nSaturday: 9am - 4pm\nSunday: Closed";

const Contact = () => {
  const { contact, loading } = useSettings();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FieldErrors, boolean>>>({});

  const email = contact?.email || FALLBACK_EMAIL;
  const phone = contact?.phone;
  const address = contact?.address || FALLBACK_ADDRESS;
  const city = contact?.city || FALLBACK_CITY;
  const state = contact?.state;
  const country = contact?.country || FALLBACK_COUNTRY;
  const businessHours = contact?.businessHours || FALLBACK_BUSINESS_HOURS;

  const formattedAddress = [address, city, state, country].filter(Boolean).join(", ");

  const validate = (data: Record<string, string>): FieldErrors => {
    const errs: FieldErrors = {};
    if (!data.firstName?.trim()) errs.firstName = "First name is required";
    if (!data.lastName?.trim()) errs.lastName = "Last name is required";
    if (!data.email?.trim()) errs.email = "Email is required";
    else if (!validateEmail(data.email)) errs.email = "Enter a valid email address";
    if (!data.subject) errs.subject = "Please select a subject";
    if (!data.message?.trim()) errs.message = "Message is required";
    else if (data.message.length > MAX_MESSAGE) errs.message = `Message must be under ${MAX_MESSAGE} characters`;
    return errs;
  };

  const handleBlur = (field: keyof FieldErrors, value: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
    const partial = validate({ [field]: value, subject: field === "subject" ? value : subject });
    setErrors((e) => ({ ...e, [field]: partial[field] }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      message,
      subject,
    };

    const errs = validate(data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTouched({ firstName: true, lastName: true, email: true, subject: true, message: true });
      return;
    }

    setIsSubmitting(true);
    const subjectLine = data.subject || "General Inquiry";
    const mailtoBody = `Name: ${data.firstName} ${data.lastName}\nEmail: ${data.email}\nSubject: ${subjectLine}\n\nMessage:\n${data.message}`;
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(mailtoBody)}`;
    window.open(mailtoLink, "_blank");
    setIsSubmitting(false);
    setSubmitted(true);
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
                {submitted ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="mb-2 text-2xl font-bold text-foreground">Message Sent!</h2>
                    <p className="mb-1 text-base text-muted-foreground">Your email client has been opened with your message.</p>
                    <p className="mb-6 text-sm text-muted-foreground">
                      If it didn&apos;t open, email us directly at{" "}
                      <a href={`mailto:${email}`} className="text-primary hover:underline">{email}</a>
                    </p>
                    <Button variant="outline" className="rounded-xl" onClick={() => { setSubmitted(false); setErrors({}); setTouched({}); setMessage(""); setSubject(""); }}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <>
                    <h2 className="mb-6 text-2xl font-bold text-foreground">Send Us a Message</h2>
                    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            placeholder="John"
                            className={touched.firstName && errors.firstName ? "border-red-400 focus:border-red-400" : ""}
                            onBlur={(e) => handleBlur("firstName", e.target.value)}
                          />
                          {touched.firstName && errors.firstName && (
                            <p className="text-xs text-red-500">{errors.firstName}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            placeholder="Doe"
                            className={touched.lastName && errors.lastName ? "border-red-400 focus:border-red-400" : ""}
                            onBlur={(e) => handleBlur("lastName", e.target.value)}
                          />
                          {touched.lastName && errors.lastName && (
                            <p className="text-xs text-red-500">{errors.lastName}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john@example.com"
                          className={touched.email && errors.email ? "border-red-400 focus:border-red-400" : ""}
                          onBlur={(e) => handleBlur("email", e.target.value)}
                        />
                        {touched.email && errors.email && (
                          <p className="text-xs text-red-500">{errors.email}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" type="tel" placeholder="+232 76 123456" />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
                        <Select
                          value={subject}
                          onValueChange={(v) => {
                            setSubject(v);
                            setTouched((t) => ({ ...t, subject: true }));
                            setErrors((e) => ({ ...e, subject: v ? undefined : "Please select a subject" }));
                          }}
                        >
                          <SelectTrigger id="subject" className={`rounded-xl ${touched.subject && errors.subject ? "border-red-400" : ""}`}>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                            <SelectItem value="Campaign Support">Campaign Support</SelectItem>
                            <SelectItem value="Technical Issue">Technical Issue</SelectItem>
                            <SelectItem value="Partnership Opportunity">Partnership Opportunity</SelectItem>
                            <SelectItem value="Media Inquiry">Media Inquiry</SelectItem>
                            <SelectItem value="Share My Story">Share My Story</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {touched.subject && errors.subject && (
                          <p className="text-xs text-red-500">{errors.subject}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="message">Message <span className="text-red-500">*</span></Label>
                          <span className={`text-xs ${message.length > MAX_MESSAGE * 0.9 ? "text-red-500" : "text-muted-foreground"}`}>
                            {message.length}/{MAX_MESSAGE}
                          </span>
                        </div>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Tell us how we can help you..."
                          className={`min-h-[150px] ${touched.message && errors.message ? "border-red-400 focus:border-red-400" : ""}`}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onBlur={() => handleBlur("message", message)}
                          maxLength={MAX_MESSAGE + 50}
                        />
                        {touched.message && errors.message && (
                          <p className="text-xs text-red-500">{errors.message}</p>
                        )}
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                        <Send className="mr-2 h-5 w-5" />
                        {isSubmitting ? "Opening email client..." : "Send Message"}
                      </Button>
                    </form>
                  </>
                )}
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
                        <MapPin className="h-6 w-6 text-chartereuse-dark" />
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
