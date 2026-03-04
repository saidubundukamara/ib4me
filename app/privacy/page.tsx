"use client";

import {
    Shield, Building2, Database, Settings2, Share2, Heart,
    Lock, Clock, UserCheck, Cookie, Globe, Users, Bell,
    Scale, Mail, AlertTriangle, CheckCircle, ArrowRight, X,
} from "lucide-react";
import Link from "next/link";
import BackToTop from "@/app/_components/BackToTop";

/* ─── Reusable primitives ─────────────────────────────────────── */

function SectionCard({
    id, number, title, icon: Icon, accent, bg, children,
}: {
    id: string; number: string; title: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string; bg: string; children: React.ReactNode;
}) {
    return (
        <div id={id} className="scroll-mt-24 rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
            {/* coloured header strip */}
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

function StripedTable({ head, rows }: { head: [string, string]; rows: [string, string][] }) {
    return (
        <div className="rounded-2xl border border-border/50 overflow-hidden text-sm">
            <table className="w-full">
                <thead>
                    <tr className="bg-muted/60">
                        <th className="text-left px-4 py-3 font-semibold text-foreground">{head[0]}</th>
                        <th className="text-left px-4 py-3 font-semibold text-foreground">{head[1]}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(([a, b], i) => (
                        <tr key={i} className={i % 2 ? "bg-muted/20" : ""}>
                            <td className="px-4 py-3 text-foreground font-medium border-t border-border/30 align-top">{a}</td>
                            <td className="px-4 py-3 text-muted-foreground border-t border-border/30">{b}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ─── Page ────────────────────────────────────────────────────── */

const navItems = [
    { id: "who-we-are", label: "Who We Are", icon: Building2 },
    { id: "information-collected", label: "Info We Collect", icon: Database },
    { id: "how-we-use", label: "How We Use It", icon: Settings2 },
    { id: "sharing", label: "Sharing", icon: Share2 },
    { id: "sensitive-information", label: "Sensitive Info", icon: Heart },
    { id: "data-security", label: "Security", icon: Lock },
    { id: "data-retention", label: "Retention", icon: Clock },
    { id: "your-rights", label: "Your Rights", icon: UserCheck },
    { id: "cookies", label: "Cookies", icon: Cookie },
    { id: "third-party", label: "Third Parties", icon: Globe },
    { id: "children", label: "Children", icon: Users },
    { id: "changes", label: "Policy Changes", icon: Bell },
    { id: "legislation", label: "Law & Compliance", icon: Scale },
    { id: "contact", label: "Contact", icon: Mail },
];

export default function PrivacyPolicy() {
    return (
        <>
        <div className="min-h-screen bg-background font-Sora">
            {/* ── Hero ── */}
            <section className="relative py-16 sm:py-20 md:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 bg-fun-green overflow-hidden">
                {/* decorative blobs */}
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-blaze-orange/10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

                <div className="relative mx-auto max-w-3xl text-center">
                    <div className="inline-flex items-center gap-2 bg-white/15 text-white px-4 py-2 rounded-full mb-5 text-sm font-semibold">
                        <Shield className="w-4 h-4" />
                        Your Privacy Matters
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-5">
                        Privacy <span className="text-blaze-orange">Policy</span>
                    </h1>
                    <p className="text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
                        We believe transparency builds trust. Here&apos;s exactly how we handle your data.
                    </p>
                    <p className="text-sm text-white/50 mt-4">Last Updated: November 2024</p>
                </div>

                {/* wave */}
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
                            <strong className="text-foreground">ib4me Ltd</strong> (&quot;ib4me&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our crowdfunding platform (the &quot;Platform&quot;). By using the Platform, you consent to the practices described here.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── All sections ── */}
            <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">

                    {/* 1. Who We Are */}
                    <SectionCard id="who-we-are" number="01" title="Who We Are" icon={Building2} accent="text-primary" bg="bg-primary/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            <strong className="text-foreground">ib4me Ltd</strong> is a company registered in Sierra Leone that operates a crowdfunding platform for social good. We act as the data controller for personal information collected through the Platform.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 rounded-2xl bg-muted/30 border border-border/50 px-4 py-3">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Privacy Inquiries</p>
                                    <p className="text-sm font-semibold text-foreground">privacy@ib4me.org</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 rounded-2xl bg-muted/30 border border-border/50 px-4 py-3">
                                <Building2 className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Registered Address</p>
                                    <p className="text-sm font-semibold text-foreground">Freetown, Sierra Leone</p>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* 2. Information We Collect */}
                    <SectionCard id="information-collected" number="02" title="Information We Collect" icon={Database} accent="text-blaze-orange" bg="bg-blaze-orange/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">We collect the following categories of personal information:</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Sub title="Account Information">
                                <Check items={["Full name", "Email address & phone number", "Password (encrypted)", "Profile photo (optional)", "Country and city of residence"]} />
                            </Sub>
                            <Sub title="Donation Information">
                                <Check items={["Donation amount & payment method", "Donor name (optional for anonymous)", "Donor email (optional)", "Donation message (optional)"]} />
                            </Sub>
                            <Sub title="Campaign Information">
                                <Check items={["Beneficiary name, age & photo", "Campaign narrative and updates", "Supporting documentation", "Fundraising goal amount"]} />
                            </Sub>
                            <Sub title="Technical Information">
                                <Check items={["IP address & browser type", "Device & operating system info", "Login timestamps & session data", "Pages visited"]} />
                            </Sub>
                        </div>

                        <Sub title="Identity Verification (KYC / KYB)">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="rounded-xl bg-background border border-border/40 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">For Individuals</p>
                                    <Check items={["Government-issued ID (national ID, passport, driver's licence)", "Proof of address (utility bill, bank statement)"]} />
                                </div>
                                <div className="rounded-xl bg-background border border-border/40 p-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">For Organisations</p>
                                    <Check items={["Business registration certificate", "Tax identification documents", "Representative identification", "Proof of registered address"]} />
                                </div>
                            </div>
                        </Sub>

                        <Sub title="Payment Information">
                            <Check items={["Mobile money account details (provider, phone, account name)", "Bank account information", "Transaction history"]} />
                            <Callout color="blue">Card details are processed directly by our payment processors — they are never stored on our servers.</Callout>
                        </Sub>
                    </SectionCard>

                    {/* 3. How We Use Your Information */}
                    <SectionCard id="how-we-use" number="03" title="How We Use Your Information" icon={Settings2} accent="text-fun-green" bg="bg-fun-green/5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { title: "Platform Operations", items: ["Account creation & management", "Campaign creation & verification", "Facilitating donations & payouts", "Customer support"], basis: "Contractual necessity" },
                                { title: "Verification & Compliance", items: ["Identity verification (KYC/KYB)", "Fraud & financial crime prevention", "AML regulatory compliance", "Meeting legal obligations"], basis: "Legal obligation" },
                                { title: "Payments", items: ["Processing donation payments", "Disbursing funds to creators", "Managing transaction records", "Resolving payment disputes"], basis: "Contractual necessity" },
                                { title: "Communications", items: ["Donation confirmations & receipts", "Campaign update notifications", "Payout status updates", "Security alerts & support"], basis: "Contractual & legitimate interests" },
                                { title: "Security & Fraud Prevention", items: ["Detecting fraudulent activity", "Monitoring suspicious transactions", "Guarding against unauthorised access", "Maintaining audit logs"], basis: "Legitimate interests" },
                                { title: "Platform Improvement", items: ["Analysing usage patterns", "Improving platform features", "Fixing technical issues"], basis: "Legitimate interests" },
                            ].map((u, i) => (
                                <div key={i} className="rounded-2xl border border-border/50 bg-muted/20 p-4 flex flex-col">
                                    <p className="text-sm font-bold text-foreground mb-3">{u.title}</p>
                                    <Check items={u.items} />
                                    <div className="mt-auto pt-3 border-t border-border/40">
                                        <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">Basis:</span> {u.basis}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    {/* 4. Sharing */}
                    <SectionCard id="sharing" number="04" title="Sharing Your Information" icon={Share2} accent="text-orange-blaze" bg="bg-orange-blaze/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">We share personal information only as necessary to operate the platform:</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Sub title="Payment Processors">
                                <Check items={["Monime (primary partner)", "Orange Money", "AfriMoney", "Visa / Mastercard"]} />
                            </Sub>
                            <Sub title="Cloud Services">
                                <Check items={["Cloudinary — image & document storage", "Secure database hosting"]} />
                            </Sub>
                            <Sub title="Communication Providers">
                                <Check items={["WhatsApp Business API", "SMS providers", "Email service providers"]} />
                            </Sub>
                        </div>

                        <Sub title="Legal & Regulatory Authorities">
                            <p className="text-sm text-muted-foreground mb-3">We may disclose information when required by:</p>
                            <Check items={["Court orders or legal process", "Government or regulatory requests", "Law enforcement investigations", "Anti-money laundering obligations"]} />
                        </Sub>

                        <div className="rounded-2xl bg-fun-green/5 border border-fun-green/30 p-4 sm:p-5">
                            <p className="text-sm font-bold text-foreground mb-3">What we will NEVER do</p>
                            <XList items={["Sell or rent your personal information", "Share your data with marketing companies", "Share with data brokers", "Share with third parties for their advertising"]} />
                        </div>
                    </SectionCard>

                    {/* 5. Sensitive Information */}
                    <SectionCard id="sensitive-information" number="05" title="Sensitive Information" icon={Heart} accent="text-blaze-orange" bg="bg-blaze-orange/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            Some campaigns involve sensitive personal details (health conditions, financial hardship, etc.). We treat this information with enhanced care.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Sub title="Special Handling">
                                <Check items={["Treated as sensitive personal data", "Need-to-know access only", "Additional security controls applied", "Used only for verification & display"]} />
                            </Sub>
                            <Sub title="Consent Requirements">
                                <p className="text-sm text-muted-foreground leading-relaxed">Campaign Creators must obtain consent from beneficiaries (or their guardians) before sharing sensitive information publicly on the Platform.</p>
                            </Sub>
                            <Sub title="Public Display">
                                <p className="text-sm text-muted-foreground leading-relaxed">Information shared in campaign descriptions is publicly visible. Campaign Creators control what details appear publicly — share only what you are comfortable with.</p>
                            </Sub>
                        </div>
                    </SectionCard>

                    {/* 6. Data Security */}
                    <SectionCard id="data-security" number="06" title="Data Security" icon={Lock} accent="text-fun-green" bg="bg-fun-green/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">We implement robust, layered security to protect your personal information:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Sub title="Technical Safeguards">
                                <Check items={["HTTPS/TLS encryption for all data in transit", "Passwords hashed with bcrypt", "Role-based access controls", "Optional two-factor authentication"]} />
                            </Sub>
                            <Sub title="Administrative Safeguards">
                                <Check items={["Regular staff privacy & security training", "All sensitive data access logged & auditable", "Confidentiality agreements for all staff", "Documented incident-response procedures"]} />
                            </Sub>
                        </div>
                        <Sub title="Audit Logging">
                            <p className="text-sm text-muted-foreground mb-3">Every administrative action is logged, including:</p>
                            <Check items={["Account modifications", "Campaign verification decisions", "Payout approvals", "Staff data access"]} />
                        </Sub>
                    </SectionCard>

                    {/* 7. Data Retention */}
                    <SectionCard id="data-retention" number="07" title="Data Retention" icon={Clock} accent="text-chartereuse" bg="bg-chartereuse/10">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">We keep data only as long as necessary:</p>
                        <StripedTable
                            head={["Data Type", "Retention Period"]}
                            rows={[
                                ["Account Information", "Duration of account + 3 years"],
                                ["Identity Verification Documents", "Duration of account + 5 years"],
                                ["Campaign Data", "Duration of campaign + 5 years"],
                                ["Donation Records", "7 years (regulatory requirement)"],
                                ["Payment Records", "7 years (regulatory requirement)"],
                                ["Audit Logs", "7 years"],
                                ["Communication Records", "3 years"],
                            ]}
                        />
                        <Callout color="blue">After retention periods expire, data is securely deleted — unless required for ongoing legal proceedings, investigations, or unresolved disputes.</Callout>
                    </SectionCard>

                    {/* 8. Your Rights */}
                    <SectionCard id="your-rights" number="08" title="Your Rights" icon={UserCheck} accent="text-primary" bg="bg-primary/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">You have the following rights regarding your personal information:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {[
                                { title: "Right of Access", desc: "Request a copy of all personal information we hold about you." },
                                { title: "Right of Correction", desc: "Request correction of inaccurate or incomplete data." },
                                { title: "Right of Deletion", desc: "Request deletion, subject to legal retention requirements." },
                                { title: "Data Portability", desc: "Receive your data in a machine-readable format." },
                                { title: "Right to Object", desc: "Object to processing based on legitimate interests." },
                                { title: "Withdraw Consent", desc: "Withdraw consent at any time where processing is consent-based." },
                            ].map((r, i) => (
                                <div key={i} className="rounded-2xl border border-border/50 bg-muted/20 p-4">
                                    <p className="text-sm font-bold text-foreground mb-1">{r.title}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                                </div>
                            ))}
                        </div>
                        <Callout color="green">To exercise any right, email <strong>privacy@ib4me.org</strong>. We respond within 30 days and may verify your identity before processing the request.</Callout>
                    </SectionCard>

                    {/* 9. Cookies */}
                    <SectionCard id="cookies" number="09" title="Cookies & Tracking" icon={Cookie} accent="text-orange-blaze" bg="bg-orange-blaze/5">
                        <StripedTable
                            head={["Cookie Type", "Purpose"]}
                            rows={[
                                ["Essential / Session", "Maintain your login session and platform functionality"],
                                ["Authentication", "Remember your login status across visits"],
                                ["Preferences", "Store your language and display preferences"],
                            ]}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Sub title="Analytics">
                                <p className="text-sm text-muted-foreground leading-relaxed">We may use analytics tools to understand how the Platform is used. Analytics data is always aggregated and never identifies individual users.</p>
                            </Sub>
                            <Sub title="Managing Cookies">
                                <p className="text-sm text-muted-foreground leading-relaxed">You can manage cookies through your browser settings. Disabling essential cookies may affect Platform functionality.</p>
                            </Sub>
                        </div>
                    </SectionCard>

                    {/* 10. Third-Party Services */}
                    <SectionCard id="third-party" number="10" title="Third-Party Services" icon={Globe} accent="text-blaze-orange" bg="bg-blaze-orange/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">The Platform integrates with third-party services that have their own privacy practices:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Sub title="Payment Processors">
                                <Check items={["Monime — primary processor", "Orange Money", "AfriMoney", "Visa / Mastercard"]} />
                            </Sub>
                            <Sub title="Cloud Services">
                                <Check items={["Cloudinary — image & document storage"]} />
                            </Sub>
                            <Sub title="Communication Services">
                                <p className="text-sm text-muted-foreground leading-relaxed">Third-party messaging providers process communications on our behalf under signed data-processing agreements.</p>
                            </Sub>
                        </div>
                        <Callout color="orange">We are not responsible for the privacy practices of third-party services. We encourage you to review their policies.</Callout>
                    </SectionCard>

                    {/* 11. International Transfers */}
                    <SectionCard id="international" number="11" title="International Data Transfers" icon={Globe} accent="text-fun-green" bg="bg-fun-green/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            Your personal information may be transferred to and processed in countries outside Sierra Leone where our service providers operate. These countries may have different data-protection laws.
                        </p>
                        <Sub title="Safeguards we apply">
                            <Check items={["Contractual protections with every service provider", "Security measures protecting data in transit and at rest"]} />
                        </Sub>
                    </SectionCard>

                    {/* 12. Children */}
                    <SectionCard id="children" number="12" title="Children's Privacy" icon={Users} accent="text-orange-blaze" bg="bg-orange-blaze/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            The Platform is intended for users aged <strong className="text-foreground">18 years and older</strong>. We do not knowingly collect personal information from children under 18.
                        </p>
                        <Sub title="Campaigns for Minors">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Adults may create campaigns on behalf of minors. The adult Campaign Creator is solely responsible for obtaining appropriate consent from the child&apos;s guardian.
                            </p>
                        </Sub>
                        <Callout color="orange">If we discover we have collected personal data from a child under 18 without appropriate consent, we will delete it promptly.</Callout>
                    </SectionCard>

                    {/* 13. Changes */}
                    <SectionCard id="changes" number="13" title="Changes to This Policy" icon={Bell} accent="text-chartereuse" bg="bg-chartereuse/10">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">We may update this Privacy Policy from time to time. You will be notified of any changes through:</p>
                        <Check items={["Email notification to registered users", "A notice posted prominently on the Platform", 'An updated "Last Updated" date at the top of this policy']} />
                        <Callout color="blue">Continued use of the Platform after changes constitutes acceptance of the updated Privacy Policy.</Callout>
                    </SectionCard>

                    {/* 14. Legislation */}
                    <SectionCard id="legislation" number="14" title="Data Protection Law & Compliance" icon={Scale} accent="text-primary" bg="bg-primary/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">We are committed to complying with applicable data-protection laws, including:</p>
                        <Check items={[
                            <span key={0}><strong className="text-foreground">Right to Access Information Act 2013</strong> — Sierra Leone</span>,
                            <span key={1}><strong className="text-foreground">Upcoming Data Protection & Right to Access Information Bill</strong> — Sierra Leone</span>,
                            <span key={2}><strong className="text-foreground">General Data Protection Regulation (GDPR)</strong> — for users in the European Union</span>,
                        ]} />
                        <Callout color="green">We apply high data-protection standards regardless of the minimum required by law.</Callout>
                    </SectionCard>

                    {/* 15. Contact */}
                    <SectionCard id="contact" number="15" title="Contact Us" icon={Mail} accent="text-blaze-orange" bg="bg-blaze-orange/5">
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please reach out:
                        </p>
                        <div className="rounded-2xl border border-border/50 bg-muted/30 p-5 sm:p-6">
                            <p className="text-base font-bold text-foreground mb-4">ib4me Ltd</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { icon: Mail, label: "Privacy", value: "privacy@ib4me.org" },
                                    { icon: Mail, label: "Support", value: "support@ib4me.org" },
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
                            <p className="text-xs text-muted-foreground mt-4">We aim to respond to all inquiries within 30 days.</p>
                        </div>
                    </SectionCard>

                    {/* Complaints */}
                    <div className="rounded-3xl border border-border/50 bg-muted/20 px-5 sm:px-7 py-5 sm:py-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-blaze-orange mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-foreground mb-1">Complaints</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    If you are not satisfied with our response to a privacy concern, you may have the right to lodge a complaint with a relevant data-protection authority in your jurisdiction.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Closing */}
                    <div className="rounded-3xl bg-fun-green/5 border border-fun-green/30 px-6 sm:px-8 py-6 sm:py-8 text-center">
                        <Shield className="h-8 w-8 text-fun-green mx-auto mb-3" />
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            By using ib4me, you acknowledge that you have read, understood, and agreed to this Privacy Policy.
                        </p>
                        <Link href="/contact" className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-primary hover:underline">
                            Have questions? Contact us <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                </div>
            </section>
        </div>
        <BackToTop />
        </>
    );
}
