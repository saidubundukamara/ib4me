"use client";

import { useEffect, useState } from "react";
import { Quote, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarDataUri } from "@/lib/avatar";

type TestimonialItem = {
  id: string;
  authorName: string;
  authorRole: string;
  quote: string;
  verified?: boolean;
};

const getAvatarUrl = (name: string) => generateAvatarDataUri(name);

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/testimonials?limit=6")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setTestimonials(data.testimonials || []);
        }
      })
      .catch(() => {
        if (!cancelled) setTestimonials([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="bg-background py-14 px-4 sm:py-18 sm:px-6 lg:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 space-y-3 text-center sm:mb-14 sm:space-y-4">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
              Stories of <span className="text-fun-green">Hope</span>
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
              Hear from the people whose lives have been transformed by your
              generosity
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card
                key={i}
                className="flex h-full flex-col rounded-3xl border-0 p-6 animate-pulse sm:p-8"
              >
                <div className="mb-4 h-10 w-10 rounded bg-gray-200" />
                <div className="mb-6 space-y-2">
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-4 w-5/6 rounded bg-gray-200" />
                  <div className="h-4 w-4/6 rounded bg-gray-200" />
                </div>
                <div className="mt-auto flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded bg-gray-200" />
                    <div className="h-3 w-20 rounded bg-gray-200" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return (
      <section className="bg-background py-14 px-4 sm:py-18 sm:px-6 lg:py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 space-y-3 text-center sm:mb-14 sm:space-y-4">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
              Stories of <span className="text-fun-green">Hope</span>
            </h2>
            <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
              Real stories from our community are coming soon.
            </p>
          </div>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Quote className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mb-1 text-sm font-medium text-foreground">Be the first to share your story</p>
            <p className="mb-5 text-xs text-muted-foreground max-w-xs">
              Have you donated or started a campaign? Tell us how ib4me made a difference for you.
            </p>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/contact?subject=Share+My+Story">Share Your Story</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-14 px-4 sm:py-18 sm:px-6 lg:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 space-y-3 text-center sm:mb-14 sm:space-y-4">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Stories of <span className="text-fun-green">Hope</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
            Hear from the people whose lives have been transformed by your
            generosity
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.id}
              className="flex h-full flex-col rounded-3xl border-0 p-6 shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-lift)] sm:p-8"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Quote
                className="mb-3 h-8 w-8 text-blaze-orange sm:mb-4 sm:h-10 sm:w-10"
                aria-hidden="true"
              />
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground sm:mb-6 sm:text-base">
                &quot;{testimonial.quote}&quot;
              </p>

              <div className="mt-auto flex items-center gap-3 sm:gap-4">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                  <AvatarImage
                    src={getAvatarUrl(testimonial.authorName)}
                    alt={testimonial.authorName}
                  />
                  <AvatarFallback>{testimonial.authorName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground sm:text-base">
                      {testimonial.authorName}
                    </span>
                    {testimonial.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                        <CheckCircle className="h-3 w-3" aria-hidden="true" />
                        Verified Donor
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground sm:text-sm">
                    {testimonial.authorRole}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
