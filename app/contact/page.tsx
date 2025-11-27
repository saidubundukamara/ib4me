import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue, SelectItem, SelectTrigger, SelectContent } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the ib4me team for support with your medical fundraising campaign.',
};

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12 space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
              Get In <span className="text-primary">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions? We&apos;re here to help. Reach out to our support team and we&#39;ll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="p-8 rounded-3xl border-0 shadow-[var(--shadow-lift)]">
                <h2 className="text-2xl font-bold text-foreground mb-6">Send Us a Message</h2>
                <form className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="firstName">First Name <span className="text-red-600">*</span></Label>
                      <Input id="firstName" placeholder="John" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name <span className="text-red-600">*</span></Label>
                      <Input id="lastName" placeholder="Doe" className="mt-2" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address <span className="text-red-600">*</span></Label>
                    <Input id="email" type="email" placeholder="john@example.com" className="mt-2" />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+232 (00) 000-000" className="mt-2" />
                  </div>

                <div>
                  <Label htmlFor="subject">Subject <span className="text-red-600">*</span></Label>
                  <Select>
                    <SelectTrigger id="subject" className="rounded-2xl my-2">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="campaign">Campaign Support</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                      <SelectItem value="media">Media Inquiry</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Message <span className="text-red-600">*</span></Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help you..."
                    className="mt-2 min-h-[150px]"
                  />
                </div>

                <Button variant="secondary" size="lg" className="w-full">
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </Card>
          </div>
          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)]">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">Email Us</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Send us an email anytime
                  </p>
                  <a href="mailto:ib4me.organisation@gmail.com" className="text-primary hover:underline text-sm">
                    ib4me.organisation@gmail.com
                  </a>
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)]">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blaze-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-blaze-orange" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">Call Us</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Mon-Sun from 8am to 6pm
                  </p>
                  <a href="tel:+232000000000" className="text-primary hover:underline text-sm">
                    +232 (000) 000-000
                  </a>
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)]">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-chartereuse/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-chartereuse" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">Visit Us</h3>
                  <p className="text-sm text-muted-foreground">
                    27B Grassfield<br />
                    Lumley<br />
                    Freetown, Sierra Leone
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)]">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-blaze/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-orange-blaze" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1">Business Hours</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Monday - Friday: 8am - 6pm</p>
                    <p>Saturday: 9am - 4pm</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
