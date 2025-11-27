"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, CreditCard, Shield, Users, Heart, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
                answer: "ib4me is a medical emergency crowdfunding platform designed specifically for Sierra Leone. We connect patients and families facing medical emergencies with donors who want to help. Our platform verifies all campaigns to ensure donations go to legitimate medical needs.",
            },
            {
                question: "How do I start a campaign?",
                answer: "Starting a campaign is free and easy. Simply create an account, click 'Start a Campaign', and fill in details about the medical emergency, including patient information, diagnosis, required treatment, and funding goal. You'll need to provide supporting documentation for verification.",
            },
            {
                question: "Is it free to create a campaign?",
                answer: "Yes, creating a campaign on ib4me is completely free. Campaign organizers pay nothing. The small fees (3.6% for individuals, 3.0% for organizations) are covered by donors and added on top of their donation amount.",
            },
            {
                question: "How long does campaign verification take?",
                answer: "Our team reviews campaigns within 24-48 hours. We verify the medical documentation, patient information, and hospital details to ensure legitimacy. Once approved, your campaign goes live immediately.",
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
                answer: "Organizations include registered hospitals, healthcare facilities, NGOs, and charitable organizations. You'll need to provide registration documents and verification during the application process.",
            },
            {
                question: "Why do organizations pay lower fees?",
                answer: "Verified organizations receive a reduced platform fee of 2.0% (vs 2.6% for individuals), bringing their total fee to 3.0%. This helps established healthcare organizations maximize the impact of donations they receive.",
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
                answer: "Every campaign undergoes a thorough verification process. We review medical documentation, verify hospital partnerships, confirm patient identity, and assess the legitimacy of the funding request before approving any campaign.",
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
                answer: "Yes, you can post updates to keep donors informed about the patient's progress. You can also edit certain campaign details, though significant changes may require re-verification.",
            },
            {
                question: "What if I raise more than my goal?",
                answer: "If you exceed your funding goal, you can either close the campaign or continue accepting donations for additional medical expenses. Any unused funds should be used for the patient's ongoing healthcare needs.",
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
                answer: "You can still withdraw whatever funds have been raised (above the minimum threshold) to help with medical expenses. We encourage keeping donors updated and sharing your campaign widely to maximize donations.",
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

    const toggleItem = (categoryIndex: number, faqIndex: number) => {
        const key = `${categoryIndex}-${faqIndex}`;
        setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="min-h-screen bg-background font-Sora">
            <main>
                {/* Hero Section */}
                <section className="py-12 sm:py-16 md:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-fun-green">
                    <div className="mx-auto max-w-4xl text-center">
                        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-white mb-4 sm:mb-6">
                            Frequently Asked <span className="text-blaze-orange">Questions</span>
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
                            Find answers to common questions about ib4me, donations, campaigns, and more.
                        </p>
                    </div>
                </section>

                {/* FAQ Categories */}
                <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl space-y-8 sm:space-y-12">
                        {faqCategories.map((category, categoryIndex) => {
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
                                                isOpen={openItems[`${categoryIndex}-${faqIndex}`] || false}
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
            </main>
        </div>
    );
}
