"use client";

import {
    FileText, Info, BookOpen, UserCheck, Target, Heart,
    CreditCard, Wallet, ShieldAlert, Ban, Copyright,
    Handshake, Settings, Mail, CheckCircle, X, ArrowRight, Building2, Globe,
} from "lucide-react";
import Link from "next/link";
import BackToTop from "@/app/_components/BackToTop";

/* ─── Primitives (same pattern as Privacy page) ──────────────── */

function SectionCard({
    id, number, title, icon: Icon, accent, bg, children,
}: {
    id: string; number: string; title: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string; bg: string; children: React.ReactNode;
}) {
    return (
        <div id={id} className="scroll-mt-24 rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
            <div className={`flex items-center gap-3 sm:gap-4 px-5 sm:px-7 py-4 border-b border-border ${bg}`}>
                <div className="p-2 rounded-xl bg-white/60 dark:bg-white/10 shrink-0">
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${accent}`} />
                </div>
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Section {number}</p>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">{title}</h2>
                </div>
            </div>
            <div className="px-5 sm:px-7 py-5 sm:py-7 space-y-5">{children}</div>
        </div>
    );
}

function Check({ items }: { items: (string | React.ReactNode)[] }) {
    return (
        <ul className="space-y-2.5">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 mt-0.5 text-fun-green shrink-0" />
                    <span className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item}</span>
                </li>
            ))}
        </ul>
    );
}

function XList({ items }: { items: string[] }) {
    return (
        <ul className="space-y-2.5">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                    <X className="h-4 w-4 mt-0.5 text-blaze-orange shrink-0" />
                    <span className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item}</span>
                </li>
            ))}
        </ul>
    );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3">
            <h3 className="text-sm sm:text-base font-semibold text-foreground">{title}</h3>
            {children}
        </div>
    );
}

function Callout({ color, children }: { color?: "green" | "orange" | "blue"; children: React.ReactNode }) {
    const styles = {
        green: "bg-fun-green/5 border-fun-green/30 text-fun-green",
        orange: "bg-blaze-orange/5 border-blaze-orange/30 text-blaze-orange",
        blue: "bg-primary/5 border-primary/20 text-primary",
    }[color ?? "blue"];
    return (
        <div className={`rounded-2xl border px-4 py-3 ${styles}`}>
            <p className="text-sm font-medium leading-relaxed">{children}</p>
        </div>
    );
}

function OrderedList({ items }: { items: string[] }) {
    return (
        <ol className="space-y-2.5">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">{i + 1}</span>
                    <span className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item}</span>
                </li>
            ))}
        </ol>
    );
}

/* ─── Nav items ───────────────────────────────────────────────── */
const navItems = [
    { id: "introduction", label: "Introduction", icon: Info },
    { id: "definitions", label: "Definitions", icon: BookOpen },
    { id: "eligibility", label: "Eligibility", icon: UserCheck },
    { id: "campaigns", label: "Campaigns", icon: Target },
    { id: "donations", label: "Donations", icon: Heart },
    { id: "payments", label: "Payments & Fees", icon: CreditCard },
    { id: "withdrawals", label: "Withdrawals", icon: Wallet },
    { id: "liability", label: "Liability", icon: ShieldAlert },
    { id: "prohibited", label: "Prohibited Conduct", icon: Ban },
    { id: "intellectual-property", label: "IP Rights", icon: Copyright },
    { id: "disputes", label: "Disputes", icon: Handshake },
    { id: "modifications", label: "Modifications", icon: Settings },
    { id: "general", label: "General", icon: FileText },
    { id: "contact", label: "Contact", icon: Mail },
];

/* ─── Page ────────────────────────────────────────────────────── */

export default function TermsAndConditions() {
    return (
        <>
        <div className="min-h-screen bg-background font-Sora">
            {/* ── Hero ── */}
            <section className="relative py-16 sm:py-20 md:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 bg-fun-green overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-blaze-orange/10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

                <div className="relative mx-auto max-w-3xl text-center">
                    <div className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-full mb-5 text-sm font-semibold">
                        <FileText className="w-4 h-4" />
                        Legal Agreement
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-5">
                        Terms &amp; <span className="text-blaze-orange">Conditions</span>
                    </h1>
                    <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
                        Please read these terms carefully before using our platform. They govern your rights and responsibilities as an ib4me user.
                    </p>
                    <p className="text-sm text-white/50 mt-4">Last Updated: November 2024</p>
                </div>

                <div className="absolute -bottom-px left-0 right-0">
                    <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full" preserveAspectRatio="none">
                        <path d="M0 56h1440V28c-240-28-480-28-720 0S240 56 0 28v28Z" className="fill-background" />
                    </svg>
                </div>
            </section>

            {/* ── Quick nav ── */}
            <section className="pt-10 sm:pt-14 pb-6 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="px-5 sm:px-7 py-4 border-b border-border bg-muted/30">
                            <h2 className="font-bold text-foreground text-base sm:text-lg">Jump to Section</h2>
                        </div>
                        <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {navItems.map(({ id, label, icon: Icon }) => (
                                <Link
                                    key={id}
                                    href={`#${id}`}
                                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                                >
                                    <Icon className="h-3.5 w-3.5 shrink-0" />
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Intro callout ── */}
            <section className="pb-2 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-3xl border border-primary/20 bg-primary/5 px-5 sm:px-7 py-5 sm:py-6">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            Welcome to <strong className="text-foreground">ib4me</strong>. These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of the ib4me platform, website, and services. By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── All sections ── */}
            <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">

                    {/* 1. Introduction */}
                    <SectionCard id="introduction" number="01" title="Introduction" icon={Info} accent="text-primary" bg="bg-primary/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">ib4me</strong> is a crowdfunding platform for social good, operated by <strong className="text-foreground">ib4me Ltd</strong> — a company registered in Sierra Leone. The Platform enables individuals and organisations to create fundraising campaigns for causes that matter, and allows donors to contribute to those campaigns.
                        </p>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            The Platform facilitates connections between those in need and those willing to help. ib4me does not guarantee campaign success or guarantee that funds will be used as intended by campaign creators.
                        </p>
                        <Callout color="blue">By creating an account or making a donation, you confirm that you have read and agree to these Terms in full.</Callout>
                    </SectionCard>

                    {/* 2. Definitions */}
                    <SectionCard id="definitions" number="02" title="Definitions" icon={BookOpen} accent="text-blaze-orange" bg="bg-blaze-orange/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">Key terms used throughout these Terms:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { term: "Platform", def: "The ib4me website, mobile applications, and all related services." },
                                { term: "User", def: "Any person who accesses or uses the Platform, including Campaign Creators and Donors." },
                                { term: "Campaign Creator", def: "A User who creates a fundraising campaign on the Platform." },
                                { term: "Donor", def: "A User who makes a monetary contribution to a campaign." },
                                { term: "Campaign", def: "A fundraising page created on the Platform for a specific cause or need." },
                                { term: "Donation", def: "A monetary contribution made by a Donor to a Campaign." },
                                { term: "Individual Account", def: "A personal user account for individuals." },
                                { term: "Organisation Account", def: "An account for registered NGOs, charities, or other legal entities." },
                            ].map(({ term, def }, i) => (
                                <div key={i} className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3">
                                    <p className="text-sm font-bold text-foreground mb-0.5">&quot;{term}&quot;</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{def}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* 3. Eligibility */}
                    <SectionCard id="eligibility" number="03" title="Eligibility & Account Registration" icon={UserCheck} accent="text-fun-green" bg="bg-fun-green/5">
                        <Callout color="green">You must be at least <strong>18 years old</strong> to create an account, make donations, or use any features of the Platform.</Callout>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Sub title="Individual Accounts">
                                <p className="text-sm text-muted-foreground leading-relaxed">For personal use — raising funds for yourself, family, or others. Requires:</p>
                                <Check items={["Full legal name", "Valid email address or phone number", "Government-issued ID (for campaigns)", "Proof of address"]} />
                            </Sub>
                            <Sub title="Organisation Accounts">
                                <p className="text-sm text-muted-foreground leading-relaxed">For registered NGOs, charities, schools, and other legal entities. Additional requirements:</p>
                                <Check items={["Organisation name and type", "Registration number", "Tax ID (if applicable)", "Registered address", "Authorised representative details"]} />
                            </Sub>
                        </div>

                        <Sub title="Account Security">
                            <p className="text-sm text-muted-foreground mb-3">You are responsible for:</p>
                            <Check items={["Keeping your login credentials confidential", "All activity that occurs under your account", "Notifying ib4me immediately of any unauthorised access"]} />
                            <Callout color="orange">ib4me is not liable for losses resulting from unauthorised use of your account.</Callout>
                        </Sub>

                        <Sub title="Account Suspension or Termination">
                            <p className="text-sm text-muted-foreground mb-3">ib4me may suspend or terminate your account if you:</p>
                            <XList items={["Violate these Terms", "Are suspected of fraudulent activity", "Provide false or misleading information", "Are required by law or regulatory authority"]} />
                        </Sub>
                    </SectionCard>

                    {/* 4. Campaigns */}
                    <SectionCard id="campaigns" number="04" title="Campaign Creation & Management" icon={Target} accent="text-orange-blaze" bg="bg-orange-blaze/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Sub title="Campaign Creator Obligations">
                                <p className="text-sm text-muted-foreground mb-3">By creating a campaign, you agree to:</p>
                                <Check items={["Provide truthful, accurate, and complete information", "Use funds exclusively for the stated purpose", "Provide regular updates on progress and fund usage", "Respond to verification requests from ib4me", "Obtain consent from beneficiaries to share their information"]} />
                            </Sub>
                            <Sub title="Required Documentation">
                                <p className="text-sm text-muted-foreground mb-3">Campaign Creators must submit supporting documentation, which may include:</p>
                                <Check items={["Relevant supporting documents for the cause", "Cost estimates or financial projections", "Beneficiary identification", "Proof of relationship (if applicable)"]} />
                            </Sub>
                        </div>

                        <Sub title="Verification Process">
                            <p className="text-sm text-muted-foreground mb-3">All campaigns go through verification before going live:</p>
                            <OrderedList items={["Campaign submission and documentation upload", "Review by the ib4me verification team", "Verification of submitted information", "Approval, rejection, or request for additional information"]} />
                            <Callout color="blue">ib4me aims to complete verification promptly but does not guarantee specific timeframes.</Callout>
                        </Sub>

                        <div className="rounded-2xl bg-blaze-orange/5 border border-blaze-orange/30 p-4 sm:p-5">
                            <p className="text-sm font-bold text-foreground mb-3">Prohibited Campaign Types</p>
                            <XList items={[
                                "Campaigns based on false or misleading information",
                                "Campaigns for purposes not aligned with the stated cause",
                                "Campaigns promoting illegal activities",
                                "Campaigns that violate the rights of others",
                                "Duplicate campaigns for the same need",
                            ]} />
                        </div>

                        <Sub title="Fund Usage">
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                Campaign Creators must use all funds received for the stated purpose. Misuse of funds may result in:
                            </p>
                            <XList items={["Account termination", "Legal action", "Reporting to relevant authorities", "Requirement to refund donors"]} />
                        </Sub>
                    </SectionCard>

                    {/* 5. Donations */}
                    <SectionCard id="donations" number="05" title="Donations" icon={Heart} accent="text-blaze-orange" bg="bg-blaze-orange/5">
                        <Callout color="orange">Donations made through the Platform are <strong>voluntary gifts</strong>. You are not entitled to goods, services, or any financial return.</Callout>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Sub title="Anonymous Donations">
                                <p className="text-sm text-muted-foreground leading-relaxed">You may donate anonymously. Your name will not be displayed publicly, though ib4me retains donor information for compliance purposes.</p>
                            </Sub>
                            <Sub title="Tax Implications">
                                <p className="text-sm text-muted-foreground leading-relaxed">ib4me does not provide tax advice. Consult a qualified tax professional. Donations may or may not be tax-deductible depending on your jurisdiction.</p>
                            </Sub>
                        </div>

                        <Sub title="Refund Policy">
                            <p className="text-sm text-muted-foreground mb-3">Donations are generally <strong className="text-foreground">non-refundable</strong>. Refunds may be issued only if:</p>
                            <Check items={["A campaign is cancelled by ib4me due to fraud or policy violation", "A duplicate or erroneous transaction is verified by ib4me", "Required by applicable law"]} />
                            <Callout color="blue">Refund requests must be submitted within 30 days of the donation.</Callout>
                        </Sub>

                        <Sub title="Unverified Organizers & Donor Responsibility">
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                Some campaigns may display an <strong className="text-foreground">&quot;Unverified Organizer&quot;</strong> badge, meaning the organizer has not completed identity verification (KYC). While all campaigns are reviewed before publication, an unverified organizer badge indicates additional risk. Donors should:
                            </p>
                            <Check items={["Exercise their own judgement before donating to any campaign", "Consider the organizer's verification status when making decisions", "Understand that ib4me does not guarantee the identity or intentions of unverified organizers", "Report any concerns about a campaign to support@ib4me.org"]} />
                            <Callout color="orange">Donations are made at your own risk. ib4me facilitates connections but does not act as a guarantor of campaign outcomes or organizer credibility.</Callout>
                        </Sub>

                        <Sub title="Donor Rights">
                            <p className="text-sm text-muted-foreground mb-3">As a donor, you have <strong className="text-foreground">no right</strong> to:</p>
                            <XList items={["Direct how funds are used beyond the campaign's stated purpose", "Receive a detailed accounting of expenditures", "Make claims against the beneficiary or Campaign Creator", "Demand repayment of donations"]} />
                        </Sub>
                    </SectionCard>

                    {/* 6. Payments & Fees */}
                    <SectionCard id="payments" number="06" title="Payments & Fees" icon={CreditCard} accent="text-fun-green" bg="bg-fun-green/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Sub title="Accepted Payment Methods">
                                <Check items={["Orange Money & AfriMoney (mobile money)", "Visa & Mastercard (debit/credit cards)", "Bank transfers (where available)"]} />
                            </Sub>
                            <Sub title="Currency">
                                <p className="text-sm text-muted-foreground leading-relaxed">The primary currency is the <strong className="text-foreground">Sierra Leonean Leone (SLE)</strong>. International donations may be subject to currency conversion by the payment processor.</p>
                            </Sub>
                        </div>

                        <Sub title="Platform Fees">
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">ib4me charges fees to sustain platform operations. Fees are displayed clearly before you confirm your donation.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="rounded-xl bg-background border border-border/40 p-3">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Individual Campaigns</p>
                                    <p className="text-2xl font-bold text-foreground">3.6%</p>
                                    <p className="text-xs text-muted-foreground mt-1">1% payment processing + 2.6% platform fee</p>
                                </div>
                                <div className="rounded-xl bg-background border border-border/40 p-3">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Organisation Campaigns</p>
                                    <p className="text-2xl font-bold text-foreground">3.0%</p>
                                    <p className="text-xs text-muted-foreground mt-1">1% payment processing + 2.0% platform fee</p>
                                </div>
                            </div>
                            <Callout color="green">Fees are added on top of the donation amount — 100% of what you donate goes directly to the campaign.</Callout>
                        </Sub>

                        <Sub title="Processing Times">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                    { method: "Mobile Money", time: "Usually instant – a few hours" },
                                    { method: "Card Payments", time: "2 – 5 business days" },
                                    { method: "Bank Transfers", time: "1 – 3 business days" },
                                ].map(({ method, time }, i) => (
                                    <div key={i} className="rounded-xl bg-background border border-border/40 px-3 py-3">
                                        <p className="text-xs font-bold text-foreground mb-0.5">{method}</p>
                                        <p className="text-xs text-muted-foreground">{time}</p>
                                    </div>
                                ))}
                            </div>
                        </Sub>
                    </SectionCard>

                    {/* 7. Withdrawals */}
                    <SectionCard id="withdrawals" number="07" title="Withdrawals & Payouts" icon={Wallet} accent="text-chartereuse" bg="bg-chartereuse/10">
                        <Sub title="Eligibility to Withdraw">
                            <p className="text-sm text-muted-foreground mb-3">To withdraw funds, Campaign Creators must:</p>
                            <Check items={["Complete identity verification (KYC/KYB)", "Have their campaign verified and approved", "Meet the minimum withdrawal threshold"]} />
                        </Sub>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Sub title="Payout Methods">
                                <Check items={["Orange Money & AfriMoney (mobile money)", "Bank transfer to a verified bank account"]} />
                            </Sub>
                            <Sub title="Payout Processing Times">
                                <Check items={["Mobile Money: typically 1 – 3 business days", "Bank Transfers: typically 3 – 7 business days"]} />
                            </Sub>
                        </div>

                        <Sub title="Approval Process">
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">Withdrawal requests are reviewed by ib4me to ensure:</p>
                            <Check items={["Compliance with platform policies", "Verification of fund-usage intentions", "Fraud prevention"]} />
                        </Sub>
                    </SectionCard>

                    {/* 8. Liability */}
                    <SectionCard id="liability" number="08" title="Platform Liability Limitations" icon={ShieldAlert} accent="text-orange-blaze" bg="bg-orange-blaze/5">
                        <Callout color="orange">ib4me is a technology platform connecting campaign creators with donors — we are not a financial institution, charity, or guarantor of any campaign outcome.</Callout>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Sub title="No Guarantee of Success">
                                <p className="text-sm text-muted-foreground leading-relaxed mb-3">ib4me does not guarantee that:</p>
                                <XList items={["Any campaign will reach its funding goal", "Donations will be received", "Campaigns represent accurate information"]} />
                            </Sub>
                            <Sub title="No Responsibility for Fund Misuse">
                                <p className="text-sm text-muted-foreground leading-relaxed mb-3">While ib4me takes measures to verify campaigns, we are not responsible for:</p>
                                <XList items={["How creators use funds after disbursement", "Fraudulent activities by campaign creators", "Misrepresentation of circumstances"]} />
                            </Sub>
                            <Sub title="Payment Processor Liability">
                                <p className="text-sm text-muted-foreground leading-relaxed mb-3">ib4me is not liable for:</p>
                                <XList items={["Failures or delays by payment processors", "Currency conversion discrepancies", "Transaction disputes with payment providers"]} />
                            </Sub>
                            <Sub title="Limitation of Liability">
                                <p className="text-sm text-muted-foreground leading-relaxed mb-3">To the maximum extent permitted by law:</p>
                                <Check items={["ib4me's total liability shall not exceed fees paid by you in the preceding 12 months", "ib4me is not liable for indirect, incidental, or consequential damages"]} />
                            </Sub>
                        </div>

                        <Sub title="Indemnification">
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">You agree to indemnify ib4me, its officers, directors, and employees from any claims arising from:</p>
                            <Check items={["Your violation of these Terms", "Your use of the Platform", "Content you submit to the Platform", "Your campaign or donation activities"]} />
                        </Sub>
                    </SectionCard>

                    {/* 9. Prohibited Conduct */}
                    <SectionCard id="prohibited" number="09" title="Prohibited Conduct" icon={Ban} accent="text-blaze-orange" bg="bg-blaze-orange/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">The following activities are strictly prohibited on the Platform:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3">
                                <h3 className="text-sm font-semibold text-foreground">Fraudulent Activities</h3>
                                <XList items={["Creating campaigns with false information", "Misusing donated funds", "Providing false identity information", "Impersonating others"]} />
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3">
                                <h3 className="text-sm font-semibold text-foreground">Financial Crimes</h3>
                                <XList items={["Money laundering", "Terrorist financing", "Tax evasion", "Circumventing financial regulations"]} />
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3">
                                <h3 className="text-sm font-semibold text-foreground">Platform Abuse</h3>
                                <XList items={["Multiple accounts to circumvent limits", "Manipulating campaign statistics", "Automated or bot-driven activities", "Interfering with platform operations"]} />
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 sm:p-5 space-y-3">
                                <h3 className="text-sm font-semibold text-foreground">Harmful Behaviour</h3>
                                <XList items={["Harassment of other users", "Discriminatory content or behaviour", "Sharing others' personal data without consent", "Uploading malicious content or code"]} />
                            </div>
                        </div>
                        <Callout color="orange">Violations may result in immediate account termination, legal action, and reporting to relevant authorities.</Callout>
                    </SectionCard>

                    {/* 10. Intellectual Property */}
                    <SectionCard id="intellectual-property" number="10" title="Intellectual Property" icon={Copyright} accent="text-primary" bg="bg-primary/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Sub title="Your Content">
                                <p className="text-sm text-muted-foreground leading-relaxed mb-3">You retain ownership of content you submit (photos, text, videos). By submitting, you grant ib4me a non-exclusive, worldwide, royalty-free licence to:</p>
                                <Check items={["Display content on the Platform", "Use content for platform promotion and marketing", "Adapt content for technical purposes"]} />
                            </Sub>
                            <Sub title="Platform Content">
                                <p className="text-sm text-muted-foreground leading-relaxed">All platform content — logos, designs, text, and software — is owned by ib4me or its licensors and protected by intellectual property laws. You may not copy, modify, or distribute it without permission.</p>
                            </Sub>
                        </div>
                        <Callout color="blue">&quot;ib4me&quot; and associated logos are trademarks of ib4me Ltd. Unauthorised use is prohibited.</Callout>
                    </SectionCard>

                    {/* 11. Dispute Resolution */}
                    <SectionCard id="disputes" number="11" title="Dispute Resolution" icon={Handshake} accent="text-fun-green" bg="bg-fun-green/5">
                        <Sub title="Internal Resolution Process">
                            <p className="text-sm text-muted-foreground mb-3">For disputes related to platform use:</p>
                            <OrderedList items={["Contact ib4me support with your complaint", "ib4me will investigate and respond within 30 days", "Appeals may be submitted within 14 days of the initial decision"]} />
                        </Sub>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Sub title="Governing Law">
                                <p className="text-sm text-muted-foreground leading-relaxed">These Terms are governed by and construed in accordance with the <strong className="text-foreground">laws of Sierra Leone</strong>.</p>
                            </Sub>
                            <Sub title="Jurisdiction">
                                <p className="text-sm text-muted-foreground leading-relaxed">Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the <strong className="text-foreground">courts in Freetown, Sierra Leone</strong>.</p>
                            </Sub>
                        </div>
                        <Callout color="green">ib4me may facilitate communication between donors and campaign creators but is not obligated to resolve disputes between them.</Callout>
                    </SectionCard>

                    {/* 12. Modifications */}
                    <SectionCard id="modifications" number="12" title="Modifications & Termination" icon={Settings} accent="text-orange-blaze" bg="bg-orange-blaze/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Sub title="Changes to These Terms">
                                <p className="text-sm text-muted-foreground mb-3">ib4me may modify these Terms at any time. You will be notified via:</p>
                                <Check items={["Email notification to registered users", "A prominent notice on the Platform", 'An updated "Last Updated" date']} />
                                <Callout color="blue">Continued use after modifications constitutes acceptance of the updated Terms.</Callout>
                            </Sub>
                            <Sub title="Account Termination">
                                <p className="text-sm text-muted-foreground mb-3">You may close your account at any time by contacting support. Active campaigns must be resolved first.</p>
                                <p className="text-sm text-muted-foreground mb-3">ib4me may terminate accounts for:</p>
                                <XList items={["Violation of these Terms", "Suspected fraud or illegal activity", "If required by law", "Extended inactivity"]} />
                            </Sub>
                        </div>
                    </SectionCard>

                    {/* 13. General Provisions */}
                    <SectionCard id="general" number="13" title="General Provisions" icon={FileText} accent="text-chartereuse" bg="bg-chartereuse/10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { title: "Entire Agreement", desc: "These Terms, together with our Privacy Policy, constitute the entire agreement between you and ib4me regarding platform use." },
                                { title: "Severability", desc: "If any provision is found unenforceable, the remaining provisions continue in full force." },
                                { title: "Waiver", desc: "Failure by ib4me to enforce any right or provision does not constitute a waiver of that right or provision." },
                                { title: "Assignment", desc: "You may not assign your rights under these Terms. ib4me may assign its rights to any successor or affiliate." },
                                { title: "Force Majeure", desc: "ib4me is not liable for delays or failures due to circumstances beyond reasonable control — natural disasters, war, pandemic, government action, or infrastructure failures." },
                            ].map(({ title, desc }, i) => (
                                <div key={i} className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                                    <p className="text-sm font-bold text-foreground mb-1">{title}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* 14. Contact */}
                    <SectionCard id="contact" number="14" title="Contact Information" icon={Mail} accent="text-blaze-orange" bg="bg-blaze-orange/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">For questions, concerns, or support regarding these Terms:</p>
                        <div className="rounded-2xl border border-border/50 bg-muted/30 p-5 sm:p-6">
                            <p className="text-base font-bold text-foreground mb-4">ib4me Ltd</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { icon: Mail, label: "Support", value: "support@ib4me.org" },
                                    { icon: Mail, label: "Legal", value: "legal@ib4me.org" },
                                    { icon: Building2, label: "Address", value: "Freetown, Sierra Leone" },
                                    { icon: Globe, label: "Website", value: "www.ib4me.org" },
                                ].map(({ icon: Icon, label, value }, i) => (
                                    <div key={i} className="flex items-center gap-3 rounded-xl bg-background border border-border/40 px-3 py-2.5">
                                        <Icon className="h-4 w-4 text-primary shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">{label}</p>
                                            <p className="text-sm font-semibold text-foreground">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SectionCard>

                    {/* Closing */}
                    <div className="rounded-3xl bg-fun-green/5 border border-fun-green/30 px-6 sm:px-8 py-6 sm:py-8 text-center">
                        <FileText className="h-8 w-8 text-fun-green mx-auto mb-3" />
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            By using ib4me, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-5">
                            <Link href="/privacy" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                                Read our Privacy Policy <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:underline">
                                Have questions? Contact us <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                </div>
            </section>
        </div>
        <BackToTop />
        </>
    );
}
