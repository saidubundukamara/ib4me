import Link from "next/link";
import BackToTop from "@/app/_components/BackToTop";
import { Shield, FileText, ArrowRight } from "lucide-react";

interface Props {
  type: "privacy" | "terms";
  content: string;
  effectiveDate?: string;
  lastUpdatedAt?: string;
}

export default function DynamicLegalPage({ type, content, effectiveDate, lastUpdatedAt }: Props) {
  const isPrivacy = type === "privacy";
  const badge = isPrivacy ? "Your Privacy Matters" : "Legal Agreement";
  const subtitle = isPrivacy
    ? "We believe transparency builds trust. Here's exactly how we handle your data."
    : "Please read these terms carefully before using our platform.";
  const Icon = isPrivacy ? Shield : FileText;

  const dateDisplay =
    effectiveDate ||
    (lastUpdatedAt
      ? new Date(lastUpdatedAt).toLocaleDateString("en-GB", { year: "numeric", month: "long" })
      : null);

  return (
    <>
      <div className="min-h-screen bg-background font-Sora">
        {/* Hero */}
        <section className="relative py-16 sm:py-20 md:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 bg-fun-green overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-blaze-orange/10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-full mb-5 text-sm font-semibold">
              <Icon className="w-4 h-4" />
              {badge}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-5">
              {isPrivacy ? (
                <>Privacy <span className="text-blaze-orange">Policy</span></>
              ) : (
                <>Terms &amp; <span className="text-blaze-orange">Conditions</span></>
              )}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto">{subtitle}</p>
            {dateDisplay && (
              <p className="text-sm text-white/50 mt-4">Last Updated: {dateDisplay}</p>
            )}
          </div>
          <div className="absolute -bottom-px left-0 right-0">
            <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full" preserveAspectRatio="none">
              <path d="M0 56h1440V28c-240-28-480-28-720 0S240 56 0 28v28Z" className="fill-background" />
            </svg>
          </div>
        </section>

        {/* Content */}
        <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-8">
            <div
              className="rounded-3xl border border-border bg-card shadow-sm p-6 sm:p-10
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mb-4 [&_h1]:mt-6 [&_h1:first-child]:mt-0
                [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-3 [&_h2]:mt-8 [&_h2:first-child]:mt-0
                [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mb-2 [&_h3]:mt-5
                [&_p]:text-sm [&_p]:sm:text-base [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-3
                [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-4 [&_ul]:space-y-1.5
                [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:mb-4 [&_ol]:space-y-1.5
                [&_li]:text-sm [&_li]:sm:text-base [&_li]:text-muted-foreground [&_li]:leading-relaxed
                [&_strong]:font-semibold [&_strong]:text-foreground
                [&_em]:italic
                [&_a]:text-primary [&_a]:underline [&_a]:hover:no-underline
                [&_hr]:border-border [&_hr]:my-6
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-4
                [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:mb-4
                [&_th]:px-4 [&_th]:py-2.5 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-foreground [&_th]:text-left [&_th]:border [&_th]:border-border
                [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-muted-foreground [&_td]:border [&_td]:border-border"
              dangerouslySetInnerHTML={{ __html: content }}
            />

            <div className="text-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                Have questions? Contact us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
      <BackToTop />
    </>
  );
}
