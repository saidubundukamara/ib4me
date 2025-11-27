"use client";

import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import Link from "next/link";

const tableOfContents = [
    { id: "who-we-are", title: "1. Who We Are" },
    { id: "information-collected", title: "2. Information We Collect" },
    { id: "how-we-use", title: "3. How We Use Your Information" },
    { id: "sharing", title: "4. Sharing Your Information" },
    { id: "medical-information", title: "5. Medical Information" },
    { id: "data-security", title: "6. Data Security" },
    { id: "data-retention", title: "7. Data Retention" },
    { id: "your-rights", title: "8. Your Rights" },
    { id: "cookies", title: "9. Cookies and Tracking" },
    { id: "third-party", title: "10. Third-Party Services" },
    { id: "international", title: "11. International Data Transfers" },
    { id: "children", title: "12. Children's Privacy" },
    { id: "changes", title: "13. Changes to This Policy" },
    { id: "legislation", title: "14. Data Protection Legislation" },
    { id: "contact", title: "15. Contact Us" },
    { id: "complaints", title: "16. Complaints" },
];

const PrivacyPolicy = () => {
    return (
        <div className="font-Sora">
            <main>
                {/* Hero Section */}
                <section className="py-12 sm:py-16 md:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-fun-green">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
                            <Shield className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                            <span className="font-semibold text-sm sm:text-base">Your Privacy Matters</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-white mb-4 sm:mb-6">
                            Privacy <span className="text-blaze-orange">Policy</span>
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
                            Learn how we collect, use, and protect your personal information.
                        </p>
                        <p className="text-sm text-white/60 mt-4">
                            Last Updated: November 2024
                        </p>
                    </div>
                </section>

                {/* Table of Contents */}
                <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-muted/30">
                    <div className="mx-auto max-w-4xl">
                        <Card className="p-6 sm:p-8 rounded-3xl border-0 shadow-[var(--shadow-soft)]">
                            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                                Table of Contents
                            </h2>
                            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {tableOfContents.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`#${item.id}`}
                                        className="text-sm sm:text-base text-muted-foreground hover:text-primary transition-colors py-1"
                                    >
                                        {item.title}
                                    </Link>
                                ))}
                            </nav>
                        </Card>
                    </div>
                </section>

                {/* Introduction */}
                <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl">
                        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                            IB4ME Ltd (&quot;IB4ME&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our medical crowdfunding platform (the &quot;Platform&quot;).
                        </p>
                        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-4">
                            By using the Platform, you consent to the practices described in this Privacy Policy. If you do not agree, please do not use the Platform.
                        </p>
                    </div>
                </section>

                {/* Content Section */}
                <section className="pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl space-y-12 sm:space-y-16">

                        {/* Who We Are */}
                        <div id="who-we-are" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                1. Who We Are
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                <strong>IB4ME Ltd</strong> is a company registered in Sierra Leone that operates a medical emergency crowdfunding platform. We act as the data controller for personal information collected through the Platform.
                            </p>
                            <div className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <p><strong>Contact Details:</strong></p>
                                <p><strong>Email</strong>: privacy@ib4me.org</p>
                                <p><strong>Address</strong>: Freetown, Sierra Leone</p>
                            </div>
                        </div>

                        {/* Information We Collect */}
                        <div id="information-collected" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                2. Information We Collect
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                We collect the following categories of personal information:
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                2.1 Account Information
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                When you register for an account, we collect:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Full name</li>
                                <li>Email address</li>
                                <li>Phone number</li>
                                <li>Password (stored in encrypted form)</li>
                                <li>Profile photo (optional)</li>
                                <li>Country and city of residence</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                2.2 Identity Verification Documents
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                To comply with Know Your Customer (KYC) and Know Your Business (KYB) regulations, we collect:
                            </p>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                <strong>For Individuals:</strong>
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Government-issued identification (national ID, passport, driver&apos;s license)</li>
                                <li>Proof of address (utility bill, bank statement)</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                <strong>For Organizations:</strong>
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Business registration certificate</li>
                                <li>Tax identification documents</li>
                                <li>Representative identification</li>
                                <li>Proof of registered address</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                2.3 Campaign Information
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                When you create a campaign, we collect:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Patient name, age, and photo</li>
                                <li>Medical diagnosis and condition details</li>
                                <li>Hospital or healthcare provider information</li>
                                <li>Medical documentation (diagnosis letters, cost estimates, receipts)</li>
                                <li>Campaign narrative and updates</li>
                                <li>Fundraising goal amount</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                2.4 Donation Information
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                When you make a donation, we collect:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Donation amount</li>
                                <li>Payment method selection</li>
                                <li>Donor name (optional for anonymous donations)</li>
                                <li>Donor email (optional)</li>
                                <li>Donation message (optional)</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                2.5 Payment Information
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                To process payments and payouts, we collect:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Mobile money account details (provider, phone number, account name)</li>
                                <li>Bank account information (bank name, account number, account holder name)</li>
                                <li>Transaction history</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <strong>Note</strong>: Full payment card details are processed directly by our payment processors and are not stored on our servers.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                2.6 Technical Information
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                We automatically collect:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>IP address</li>
                                <li>Browser type and version</li>
                                <li>Device information</li>
                                <li>Operating system</li>
                                <li>Login timestamps</li>
                                <li>Session duration</li>
                                <li>Pages visited</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                2.7 Communication Data
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                We collect information when you:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                                <li>Contact our support team</li>
                                <li>Receive notifications (email, SMS, WhatsApp)</li>
                                <li>Participate in surveys or feedback requests</li>
                            </ul>
                        </div>

                        {/* How We Use Your Information */}
                        <div id="how-we-use" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                3. How We Use Your Information
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                We use your personal information for the following purposes:
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                3.1 Platform Operations
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-2">
                                <li>Creating and managing your account</li>
                                <li>Processing campaign creation and verification</li>
                                <li>Facilitating donations and payouts</li>
                                <li>Providing customer support</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <strong>Legal Basis</strong>: Contractual necessity to provide our services.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                3.2 Verification and Compliance
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-2">
                                <li>Verifying your identity (KYC/KYB)</li>
                                <li>Preventing fraud and financial crimes</li>
                                <li>Complying with anti-money laundering (AML) regulations</li>
                                <li>Meeting legal and regulatory requirements</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <strong>Legal Basis</strong>: Legal obligation and legitimate interests in fraud prevention.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                3.3 Payments
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-2">
                                <li>Processing donation payments</li>
                                <li>Disbursing funds to campaign creators</li>
                                <li>Managing transaction records</li>
                                <li>Resolving payment disputes</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <strong>Legal Basis</strong>: Contractual necessity.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                3.4 Communications
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-2">
                                <li>Sending donation confirmations and receipts</li>
                                <li>Notifying you of campaign updates</li>
                                <li>Sending payout status updates</li>
                                <li>Delivering account security alerts</li>
                                <li>Providing customer support responses</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <strong>Legal Basis</strong>: Contractual necessity and legitimate interests.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                3.5 Security and Fraud Prevention
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-2">
                                <li>Detecting and preventing fraudulent activity</li>
                                <li>Monitoring for suspicious transactions</li>
                                <li>Protecting against unauthorized access</li>
                                <li>Maintaining audit logs</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <strong>Legal Basis</strong>: Legitimate interests in platform security.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                3.6 Platform Improvement
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-2">
                                <li>Analyzing usage patterns</li>
                                <li>Improving platform features</li>
                                <li>Fixing technical issues</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <strong>Legal Basis</strong>: Legitimate interests in service improvement.
                            </p>
                        </div>

                        {/* Sharing Your Information */}
                        <div id="sharing" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                4. Sharing Your Information
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                We share personal information with the following categories of recipients:
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                4.1 Payment Processors
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                We share payment information with:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li><strong>Monime</strong>: Our primary payment processing partner</li>
                                <li><strong>Orange Money</strong>: For mobile money transactions</li>
                                <li><strong>AfriMoney</strong>: For mobile money transactions</li>
                                <li><strong>Card Networks</strong>: Visa, Mastercard for card payments</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                These providers process payments on our behalf and have their own privacy policies.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                4.2 Cloud Service Providers
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                We use third-party services for:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li><strong>Cloudinary</strong>: Secure storage of images and documents</li>
                                <li><strong>Database Hosting</strong>: Secure data storage</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                These providers are contractually obligated to protect your data.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                4.3 Communication Providers
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                To send notifications, we share contact information with:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li><strong>WhatsApp Business API</strong>: For WhatsApp messages</li>
                                <li><strong>SMS Providers</strong>: For text message notifications</li>
                                <li><strong>Email Service Providers</strong>: For email communications</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                4.4 Legal and Regulatory Authorities
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                We may disclose information when required by:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Court orders or legal process</li>
                                <li>Government or regulatory requests</li>
                                <li>Law enforcement investigations</li>
                                <li>Anti-money laundering reporting obligations</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                4.5 Information We Do NOT Share
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                We do <strong>not</strong> sell, rent, or share your personal information with:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                                <li>Marketing companies</li>
                                <li>Data brokers</li>
                                <li>Third parties for their advertising purposes</li>
                            </ul>
                        </div>

                        {/* Medical Information */}
                        <div id="medical-information" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                5. Medical Information
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                We recognize that medical information is particularly sensitive and requires enhanced protection.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                5.1 Special Handling
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                Medical information shared through campaigns (diagnoses, medical records, health conditions) is:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Treated as sensitive personal data</li>
                                <li>Accessible only to authorized staff on a need-to-know basis</li>
                                <li>Subject to additional security controls</li>
                                <li>Not used for any purpose other than campaign verification and display</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                5.2 Consent Requirements
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                Campaign Creators must obtain consent from patients (or their legal guardians) before sharing medical information on the Platform. By creating a campaign, you represent that you have obtained such consent.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                5.3 Public Display
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                Medical information shared in campaign descriptions is publicly visible on the Platform. Campaign Creators control what medical details are shared publicly.
                            </p>
                        </div>

                        {/* Data Security */}
                        <div id="data-security" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                6. Data Security
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                We implement robust security measures to protect your personal information:
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                6.1 Technical Safeguards
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li><strong>Encryption</strong>: All data transmitted to and from the Platform uses HTTPS/TLS encryption</li>
                                <li><strong>Password Security</strong>: Passwords are hashed using bcrypt encryption</li>
                                <li><strong>Access Controls</strong>: Role-based permissions limit data access to authorized personnel</li>
                                <li><strong>Two-Factor Authentication</strong>: Optional additional security for user accounts</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                6.2 Administrative Safeguards
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li><strong>Staff Training</strong>: Employees receive privacy and security training</li>
                                <li><strong>Access Logging</strong>: All access to sensitive data is logged and auditable</li>
                                <li><strong>Confidentiality Agreements</strong>: Staff and contractors sign confidentiality agreements</li>
                                <li><strong>Incident Response</strong>: Procedures for detecting and responding to security incidents</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                6.3 Audit Logging
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                All administrative actions are logged, including:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                                <li>Account modifications</li>
                                <li>Campaign verification decisions</li>
                                <li>Payout approvals</li>
                                <li>Data access by staff</li>
                            </ul>
                        </div>

                        {/* Data Retention */}
                        <div id="data-retention" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                7. Data Retention
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                We retain personal information for the following periods:
                            </p>

                            <div className="overflow-x-auto mb-6">
                                <table className="w-full text-base text-muted-foreground border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50">
                                            <th className="text-left p-3 font-semibold text-foreground border border-muted">Data Type</th>
                                            <th className="text-left p-3 font-semibold text-foreground border border-muted">Retention Period</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="p-3 border border-muted">Account Information</td>
                                            <td className="p-3 border border-muted">Duration of account + 3 years</td>
                                        </tr>
                                        <tr className="bg-muted/30">
                                            <td className="p-3 border border-muted">Identity Verification Documents</td>
                                            <td className="p-3 border border-muted">Duration of account + 5 years</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 border border-muted">Campaign Data</td>
                                            <td className="p-3 border border-muted">Duration of campaign + 5 years</td>
                                        </tr>
                                        <tr className="bg-muted/30">
                                            <td className="p-3 border border-muted">Donation Records</td>
                                            <td className="p-3 border border-muted">7 years (regulatory requirement)</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 border border-muted">Payment Records</td>
                                            <td className="p-3 border border-muted">7 years (regulatory requirement)</td>
                                        </tr>
                                        <tr className="bg-muted/30">
                                            <td className="p-3 border border-muted">Audit Logs</td>
                                            <td className="p-3 border border-muted">7 years</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 border border-muted">Communication Records</td>
                                            <td className="p-3 border border-muted">3 years</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                After these periods, data is securely deleted unless retention is required for ongoing legal proceedings, regulatory investigations, or unresolved disputes.
                            </p>
                        </div>

                        {/* Your Rights */}
                        <div id="your-rights" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                8. Your Rights
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                You have the following rights regarding your personal information:
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.1 Right of Access
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                You can request a copy of the personal information we hold about you.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.2 Right of Correction
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                You can request correction of inaccurate or incomplete personal information.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.3 Right of Deletion
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                You can request deletion of your personal information, subject to:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Legal retention requirements</li>
                                <li>Ongoing transactions or disputes</li>
                                <li>Fraud prevention needs</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.4 Right to Data Portability
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                You can request your data in a commonly used, machine-readable format.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.5 Right to Object
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                You can object to processing based on legitimate interests.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.6 Right to Withdraw Consent
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                Where processing is based on consent, you can withdraw consent at any time.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.7 How to Exercise Your Rights
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                To exercise any of these rights, contact us at:
                            </p>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <strong>Email</strong>: privacy@ib4me.org
                            </p>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-4">
                                We will respond to requests within 30 days. We may request identity verification before processing requests.
                            </p>
                        </div>

                        {/* Cookies and Tracking */}
                        <div id="cookies" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                9. Cookies and Tracking
                            </h2>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                9.1 Cookies We Use
                            </h3>
                            <div className="overflow-x-auto mb-6">
                                <table className="w-full text-base text-muted-foreground border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50">
                                            <th className="text-left p-3 font-semibold text-foreground border border-muted">Cookie Type</th>
                                            <th className="text-left p-3 font-semibold text-foreground border border-muted">Purpose</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="p-3 border border-muted">Essential/Session</td>
                                            <td className="p-3 border border-muted">Maintain your login session and platform functionality</td>
                                        </tr>
                                        <tr className="bg-muted/30">
                                            <td className="p-3 border border-muted">Authentication</td>
                                            <td className="p-3 border border-muted">Remember your login status</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 border border-muted">Preferences</td>
                                            <td className="p-3 border border-muted">Store your language and display preferences</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                9.2 Analytics
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                We may use analytics tools to understand how the Platform is used. Analytics data is aggregated and does not identify individual users.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                9.3 Managing Cookies
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                You can manage cookies through your browser settings. Disabling essential cookies may affect Platform functionality.
                            </p>
                        </div>

                        {/* Third-Party Services */}
                        <div id="third-party" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                10. Third-Party Services
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                The Platform integrates with third-party services that have their own privacy practices:
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                10.1 Payment Processors
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li><strong>Monime</strong>: Subject to Monime Privacy Policy</li>
                                <li><strong>Orange Money</strong>: Subject to Orange Money terms and conditions</li>
                                <li><strong>AfriMoney</strong>: Subject to AfriMoney terms and conditions</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                10.2 Cloud Services
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li><strong>Cloudinary</strong>: Subject to Cloudinary Privacy Policy</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                10.3 Communication Services
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                Third-party messaging providers process communications on our behalf under data processing agreements.
                            </p>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-4">
                                We are not responsible for the privacy practices of third-party services. We encourage you to review their privacy policies.
                            </p>
                        </div>

                        {/* International Data Transfers */}
                        <div id="international" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                11. International Data Transfers
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                Your personal information may be transferred to and processed in countries outside Sierra Leone where our service providers operate. These countries may have different data protection laws.
                            </p>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                When transferring data internationally, we implement appropriate safeguards, including:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                                <li>Contractual protections with service providers</li>
                                <li>Security measures to protect data in transit and at rest</li>
                            </ul>
                        </div>

                        {/* Children's Privacy */}
                        <div id="children" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                12. Children&apos;s Privacy
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                The Platform is intended for users aged <strong>18 years and older</strong>. We do not knowingly collect personal information from children under 18.
                            </p>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                <strong>Campaigns for Minors</strong>: Adults may create campaigns on behalf of minors (e.g., for a child&apos;s medical treatment). In such cases, the adult Campaign Creator is responsible for obtaining appropriate consent.
                            </p>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                If we become aware that we have collected personal information from a child under 18 without appropriate consent, we will take steps to delete that information.
                            </p>
                        </div>

                        {/* Changes to This Policy */}
                        <div id="changes" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                13. Changes to This Policy
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                We may update this Privacy Policy from time to time. Changes will be communicated through:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Email notification to registered users</li>
                                <li>Notice posted on the Platform</li>
                                <li>Updated &quot;Last Updated&quot; date at the top of this policy</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                Continued use of the Platform after changes constitutes acceptance of the updated Privacy Policy. We encourage you to review this Privacy Policy periodically.
                            </p>
                        </div>

                        {/* Data Protection Legislation */}
                        <div id="legislation" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                14. Data Protection Legislation
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                Sierra Leone is developing comprehensive data protection legislation. We are committed to complying with applicable laws, including:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li><strong>Right to Access Information Act 2013</strong> (Sierra Leone)</li>
                                <li><strong>Upcoming Data Protection and Right to Access Information Bill</strong> (Sierra Leone)</li>
                                <li><strong>General Data Protection Regulation (GDPR)</strong> (for users in the European Union)</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                We aim to apply high data protection standards regardless of specific legal requirements.
                            </p>
                        </div>

                        {/* Contact Us */}
                        <div id="contact" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                15. Contact Us
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                            </p>
                            <div className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <p><strong>IB4ME Ltd</strong></p>
                                <p><strong>Privacy Inquiries</strong>: privacy@ib4me.org</p>
                                <p><strong>General Support</strong>: support@ib4me.org</p>
                                <p><strong>Address</strong>: Freetown, Sierra Leone</p>
                                <p><strong>Website</strong>: www.ib4me.org</p>
                            </div>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-4">
                                We aim to respond to all inquiries within 30 days.
                            </p>
                        </div>

                        {/* Complaints */}
                        <div id="complaints" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                16. Complaints
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                If you are not satisfied with our response to a privacy concern, you may have the right to lodge a complaint with a relevant data protection authority in your jurisdiction.
                            </p>
                        </div>

                        {/* Closing */}
                        <div className="pt-8 border-t border-muted">
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-center">
                                By using IB4ME, you acknowledge that you have read, understood, and agree to this Privacy Policy.
                            </p>
                        </div>

                    </div>
                </section>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
