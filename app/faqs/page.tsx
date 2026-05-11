"use client";

import { useMemo, useState } from "react";
import { ChevronDown, HelpCircle, CreditCard, Shield, Users, Heart, Building2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import BackToTop from "@/app/_components/BackToTop";

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQCategory {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    faqs: FAQItem[];
}

const faqCategories: FAQCategory[] = [
    {
        title: "Getting Started",
        icon: HelpCircle,
        color: "text-primary",
        bgColor: "bg-primary/10",
        faqs: [
            {
                question: "What is ib4me?",
                answer: "ib4me is a crowdfunding platform designed specifically for Sierra Leone. We connect people and communities with donors who want to help. Whether it's education, personal needs, community projects, health expenses, or emergency relief, our platform supports any meaningful cause. Campaigns are reviewed to help ensure donations go to legitimate needs.",
            },
            {
                question: "How do I start a campaign?",
                answer: "Starting a campaign is free and easy. Simply create an account, click 'Start a Campaign', and fill in details about your cause, including beneficiary information, description, and funding goal. You'll need to provide supporting documentation for verification.",
            },
            {
                question: "Is it free to create a campaign?",
                answer: "Yes, creating a campaign on ib4me is completely free. Campaign organizers pay nothing. The small fees (3.6% for individuals, 3.0% for organizations) are covered by donors and added on top of their donation amount.",
            },
            {
                question: "How long does campaign verification take?",
                answer: "Our team reviews campaigns within 24-48 hours. We verify the documentation, beneficiary information, and supporting details to ensure legitimacy. Once approved, your campaign goes live immediately.",
            },
        ],
    },
    {
        title: "Donations & Payments",
        icon: CreditCard,
        color: "text-blaze-orange",
        bgColor: "bg-blaze-orange/10",
        faqs: [
            {
                question: "What payment methods do you accept?",
                answer: "We accept multiple payment methods including Orange Money, AfriMoney, and international credit/debit cards. All payments are processed securely through our partner Monime.",
            },
            {
                question: "How much of my donation goes to the campaign?",
                answer: "100% of your donation amount goes directly to the campaign. Fees are added on top of your donation and covered by you as the donor. For example, if you donate SLE 100 to an individual campaign, you'll pay SLE 103.60 total, and the full SLE 100 goes to the campaign.",
            },
            {
                question: "What are the fees?",
                answer: "Total fees are 3.6% for individual campaigns and 3.0% for organization campaigns. This includes a 1% payment processing fee (Monime) and a platform fee (2.6% for individuals, 2.0% for organizations). Fees are added on top of the donation amount.",
            },
            {
                question: "Can I donate anonymously?",
                answer: "Yes, you can choose to make your donation anonymous. Your name won't be displayed publicly on the campaign page, though we'll still need your email to send a receipt.",
            },
            {
                question: "Will I receive a receipt?",
                answer: "Yes, you'll receive an email receipt immediately after your donation is processed. This receipt can be used for tax purposes where applicable.",
            },
        ],
    },
    {
        title: "For Organizations",
        icon: Building2,
        color: "text-fun-green",
        bgColor: "bg-fun-green/10",
        faqs: [
            {
                question: "What qualifies as an organization?",
                answer: "Organizations include registered NGOs, charitable organizations, schools, community groups, and other legal entities. You'll need to provide registration documents and verification during the application process.",
            },
            {
                question: "Why do organizations pay lower fees?",
                answer: "Verified organizations receive a reduced platform fee of 2.0% (vs 2.6% for individuals), bringing their total fee to 3.0%. This helps established organizations maximize the impact of donations they receive.",
            },
            {
                question: "How do I verify my organization?",
                answer: "During campaign creation, select 'Organization' as the campaign type and provide your registration certificate, tax ID, and other relevant documentation. Our team will review and verify your organization status.",
            },
        ],
    },
    {
        title: "Trust & Safety",
        icon: Shield,
        color: "text-chartereuse",
        bgColor: "bg-chartereuse/10",
        faqs: [
            {
                question: "How do you verify campaigns?",
                answer: "Every campaign undergoes a thorough verification process. We review supporting documentation, confirm beneficiary identity, and assess the legitimacy of the funding request before approving any campaign.",
            },
            {
                question: "What happens if a campaign is fraudulent?",
                answer: "We have a zero-tolerance policy for fraud. If we discover a campaign is fraudulent, we immediately suspend it, work with donors on refunds where possible, and report the incident to relevant authorities.",
            },
            {
                question: "How is my personal data protected?",
                answer: "We take data protection seriously. All personal and financial information is encrypted and stored securely. We never share your data with third parties without your consent, except as required for payment processing.",
            },
            {
                question: "What does the 'Unverified Organizer' badge mean?",
                answer: "An 'Unverified Organizer' badge means the campaign organizer has not yet completed identity verification (KYC). The campaign itself has been reviewed and approved, but the organizer's identity has not been independently confirmed. We encourage donors to exercise their own judgement when donating to campaigns with unverified organizers.",
            },
            {
                question: "Can I report a suspicious campaign?",
                answer: "Yes, if you have concerns about a campaign, please contact us immediately at support@ib4me.org or use the 'Report' button on the campaign page. We investigate all reports thoroughly.",
            },
        ],
    },
    {
        title: "Campaign Management",
        icon: Users,
        color: "text-orange-blaze",
        bgColor: "bg-orange-blaze/10",
        faqs: [
            {
                question: "How do I withdraw funds?",
                answer: "Once your campaign reaches the minimum withdrawal threshold, you can request a withdrawal from your dashboard. Funds are typically transferred within 2-3 business days after admin approval.",
            },
            {
                question: "Can I update my campaign after it's live?",
                answer: "Yes, you can post updates to keep donors informed about your campaign's progress. You can also edit certain campaign details, though significant changes may require re-verification.",
            },
            {
                question: "What if I raise more than my goal?",
                answer: "If you exceed your funding goal, you can either close the campaign or continue accepting donations for additional needs. Any unused funds should be used for the beneficiary's ongoing needs.",
            },
            {
                question: "Can I share my campaign on social media?",
                answer: "Absolutely! Sharing on social media is one of the best ways to reach more potential donors. We provide easy sharing buttons for WhatsApp, Facebook, Twitter, and other platforms.",
            },
        ],
    },
    {
        title: "Support",
        icon: Heart,
        color: "text-primary",
        bgColor: "bg-primary/10",
        faqs: [
            {
                question: "How can I contact support?",
                answer: "You can reach our support team via email at support@ib4me.org, through our contact form, or via WhatsApp. We typically respond within 24 hours.",
            },
            {
                question: "Do you offer campaign coaching?",
                answer: "Yes, we provide tips and resources to help your campaign succeed. Our team can offer guidance on storytelling, setting realistic goals, and promoting your campaign effectively.",
            },
            {
                question: "What if my campaign doesn't reach its goal?",
                answer: "You can still withdraw whatever funds have been raised (above the minimum threshold) to help with expenses. We encourage keeping donors updated and sharing your campaign widely to maximize donations.",
            },
        ],
    },
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
    return (
        <div className="border-b border-border last:border-b-0">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between py-4 sm:py-5 text-left"
            >
                <span className="font-semibold text-foreground text-sm sm:text-base pr-4">{item.question}</span>
                <ChevronDown
                    className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform flex-shrink-0",
                        isOpen && "rotate-180"
                    )}
                />
            </button>
            <div
                className={cn(
                    "overflow-hidden transition-all duration-300",
                    isOpen ? "max-h-96 pb-4 sm:pb-5" : "max-h-0"
                )}
            >
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{item.answer}</p>
            </div>
        </div>
    );
}

export default function FAQsPage() {
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState("");

    const toggleItem = (categoryIndex: number, faqIndex: number) => {
        const key = `${categoryIndex}-${faqIndex}`;
        setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredCategories = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return faqCategories;
        return faqCategories
            .map((cat) => ({
                ...cat,
                faqs: cat.faqs.filter(
                    (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
                ),
            }))
            .filter((cat) => cat.faqs.length > 0);
    }, [searchQuery]);

    const totalResults = filteredCategories.reduce((sum, c) => sum + c.faqs.length, 0);

    return (
        <>
        <div className="bg-background font-Sora">
            <div>
                {/* Hero Section */}
                <section className="relative py-12 sm:py-16 md:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-fun-green">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
                            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                            <span className="font-semibold text-sm sm:text-base">Help Center</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-white mb-4 sm:mb-6">
                            Frequently Asked <span className="text-blaze-orange">Questions</span>
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
                            Find answers to common questions about ib4me, donations, campaigns, and more.
                        </p>
                    </div>
                    {/* Wave divider */}
                    <div className="absolute -bottom-px left-0 right-0">
                        <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full" preserveAspectRatio="none">
                            <path d="M0 56h1440V28c-240-28-480-28-720 0S240 56 0 28v28Z" className="fill-background" />
                        </svg>
                    </div>
                </section>

                {/* Search */}
                <section className="px-4 pt-10 pb-2 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search questions..."
                                className="w-full rounded-full border border-border bg-background py-3.5 pl-12 pr-12 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                                aria-label="Search FAQs"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {searchQuery && (
                            <p className="mt-3 text-center text-sm text-muted-foreground">
                                {totalResults === 0 ? "No results found" : `${totalResults} result${totalResults !== 1 ? "s" : ""} found`}
                            </p>
                        )}
                    </div>
                </section>

                {/* FAQ Categories */}
                <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl space-y-8 sm:space-y-12">
                        {filteredCategories.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-border bg-muted/20 p-12 text-center">
                                <Search className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                                <p className="text-base font-medium text-foreground">No questions match &ldquo;{searchQuery}&rdquo;</p>
                                <p className="mt-1 text-sm text-muted-foreground">Try different keywords or browse all categories.</p>
                                <button onClick={() => setSearchQuery("")} className="mt-4 text-sm text-primary hover:underline">Clear search</button>
                            </div>
                        ) : filteredCategories.map((category, categoryIndex) => {
                            const Icon = category.icon;
                            return (
                                <div key={categoryIndex} className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                                    <div className="flex items-center gap-3 sm:gap-4 p-5 sm:p-6 border-b border-border bg-muted/30">
                                        <div className={cn("p-2.5 sm:p-3 rounded-xl", category.bgColor)}>
                                            <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", category.color)} />
                                        </div>
                                        <h2 className="text-lg sm:text-xl font-bold text-foreground">{category.title}</h2>
                                    </div>
                                    <div className="px-5 sm:px-6">
                                        {category.faqs.map((faq, faqIndex) => (
                                            <FAQAccordion
                                                key={faqIndex}
                                                item={faq}
                                                isOpen={searchQuery ? true : (openItems[`${categoryIndex}-${faqIndex}`] || false)}
                                                onToggle={() => toggleItem(categoryIndex, faqIndex)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Still Have Questions CTA */}
                <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl rounded-3xl bg-primary px-6 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 text-center text-white">
                        <h3 className="mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl font-bold">
                            Still have questions?
                        </h3>
                        <p className="mx-auto mb-6 sm:mb-8 max-w-xl text-base sm:text-lg text-white/90">
                            Can&#39;t find what you&#39;re looking for? Our support team is here to help you with any questions or concerns.
                        </p>
                        <a
                            href="/contact"
                            className="inline-flex items-center justify-center rounded-xl bg-blaze-orange px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white hover:bg-blaze-orange/90 transition-colors"
                        >
                            Contact Support
                        </a>
                    </div>
                </section>
            </div>
        </div>
        <BackToTop />
        </>
    );
}
