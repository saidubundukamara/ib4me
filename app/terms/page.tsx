"use client";

import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import Link from "next/link";

const tableOfContents = [
    { id: "introduction", title: "1. Introduction" },
    { id: "definitions", title: "2. Definitions" },
    { id: "eligibility", title: "3. Eligibility and Account Registration" },
    { id: "campaigns", title: "4. Campaign Creation and Management" },
    { id: "donations", title: "5. Donations" },
    { id: "payments", title: "6. Payments and Fees" },
    { id: "withdrawals", title: "7. Withdrawals and Payouts" },
    { id: "liability", title: "8. Platform Liability Limitations" },
    { id: "prohibited", title: "9. Prohibited Conduct" },
    { id: "intellectual-property", title: "10. Intellectual Property" },
    { id: "disputes", title: "11. Dispute Resolution" },
    { id: "modifications", title: "12. Modifications and Termination" },
    { id: "general", title: "13. General Provisions" },
    { id: "contact", title: "14. Contact Information" },
];

const TermsAndConditions = () => {
    return (
        <div className="font-Sora">
            <main>
                {/* Hero Section */}
                <section className="py-12 sm:py-16 md:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-fun-green">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="inline-flex items-center gap-2 bg-white/10 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                            <span className="font-semibold text-sm sm:text-base">Legal</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-white mb-4 sm:mb-6">
                            Terms and <span className="text-blaze-orange">Conditions</span>
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
                            Please read these terms carefully before using our platform.
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

                {/* Content Section */}
                <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-4xl space-y-12 sm:space-y-16">

                        {/* Introduction */}
                        <div id="introduction" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                1. Introduction
                            </h2>
                            <div className="space-y-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <p>
                                    Welcome to IB4ME. These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the IB4ME platform, website, and services (collectively, the &quot;Platform&quot;). By accessing or using the Platform, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.
                                </p>
                                <p>
                                    IB4ME is a medical emergency crowdfunding platform operated by <strong>IB4ME Ltd</strong>, a company registered in Sierra Leone. The Platform enables individuals and organizations to create fundraising campaigns for medical emergencies and allows donors to contribute to these campaigns.
                                </p>
                                <p>
                                    The Platform facilitates connections between those in medical need and those willing to help. IB4ME does not provide medical advice, guarantee campaign success, or guarantee that funds will be used as intended by campaign creators.
                                </p>
                            </div>
                        </div>

                        {/* Definitions */}
                        <div id="definitions" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                2. Definitions
                            </h2>
                            <ul className="space-y-3 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                                <li><strong>&quot;Platform&quot;</strong> refers to the IB4ME website, mobile applications, and all related services.</li>
                                <li><strong>&quot;User&quot;</strong> refers to any person who accesses or uses the Platform, including Campaign Creators and Donors.</li>
                                <li><strong>&quot;Campaign Creator&quot;</strong> refers to a User who creates a fundraising campaign on the Platform.</li>
                                <li><strong>&quot;Donor&quot;</strong> refers to a User who makes a donation to a campaign.</li>
                                <li><strong>&quot;Campaign&quot;</strong> refers to a fundraising page created on the Platform for a specific medical need.</li>
                                <li><strong>&quot;Donation&quot;</strong> refers to a monetary contribution made by a Donor to a Campaign.</li>
                                <li><strong>&quot;Individual Account&quot;</strong> refers to a personal user account for individuals.</li>
                                <li><strong>&quot;Organization Account&quot;</strong> refers to an account for registered non-governmental organizations (NGOs), charities, or other legal entities.</li>
                            </ul>
                        </div>

                        {/* Eligibility and Account Registration */}
                        <div id="eligibility" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                3. Eligibility and Account Registration
                            </h2>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                3.1 Age Requirement
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                You must be at least <strong>18 years old</strong> to create an account, make donations, or use any features of the Platform. By using the Platform, you represent and warrant that you meet this age requirement.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                3.2 Account Types
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                The Platform offers two types of accounts:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li><strong>Individual Accounts</strong>: For personal use by individuals raising funds for themselves, family members, or others.</li>
                                <li><strong>Organization Accounts</strong>: For registered NGOs, charities, hospitals, and other legal entities. Organization accounts require additional verification.</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                3.3 Registration Requirements
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                To create an account, you must provide accurate, current, and complete information, including:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Full legal name</li>
                                <li>Valid email address or phone number</li>
                                <li>Password (kept confidential)</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                For Organization Accounts, additional information is required:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Organization name and type</li>
                                <li>Registration number</li>
                                <li>Tax identification number (if applicable)</li>
                                <li>Registered address</li>
                                <li>Authorized representative details</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                3.4 Identity Verification (KYC/KYB)
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                To create campaigns or receive payouts, Users must complete identity verification:
                            </p>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                <strong>For Individuals (KYC - Know Your Customer):</strong>
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Valid government-issued identification document</li>
                                <li>Proof of address</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                <strong>For Organizations (KYB - Know Your Business):</strong>
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Organization registration certificate</li>
                                <li>Representative identification</li>
                                <li>Proof of registered address</li>
                                <li>Tax certificate (if applicable)</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                IB4ME reserves the right to request additional documentation as needed.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                3.5 Account Security
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                You are responsible for:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Maintaining the confidentiality of your login credentials</li>
                                <li>All activities that occur under your account</li>
                                <li>Notifying IB4ME immediately of any unauthorized access</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                IB4ME is not liable for losses resulting from unauthorized use of your account.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                3.6 Account Suspension and Termination
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                IB4ME may suspend or terminate your account if:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                                <li>You violate these Terms</li>
                                <li>We suspect fraudulent activity</li>
                                <li>Required by law or regulatory authority</li>
                                <li>You provide false or misleading information</li>
                            </ul>
                        </div>

                        {/* Campaign Creation and Management */}
                        <div id="campaigns" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                4. Campaign Creation and Management
                            </h2>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                4.1 Campaign Creator Obligations
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                By creating a campaign, you agree to:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Provide truthful, accurate, and complete information about the patient and medical condition</li>
                                <li>Use funds <strong>exclusively</strong> for the stated medical purpose</li>
                                <li>Provide updates on the patient&apos;s condition and fund usage</li>
                                <li>Respond to reasonable verification requests from IB4ME</li>
                                <li>Obtain consent from the patient (or legal guardian) to share their medical information</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                4.2 Required Documentation
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                Campaign Creators must submit supporting documentation, which may include:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Medical diagnosis or hospital admission letter</li>
                                <li>Cost estimates from the treating hospital</li>
                                <li>Patient identification</li>
                                <li>Proof of relationship to the patient (if applicable)</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                4.3 Verification Process
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                All campaigns undergo a verification process before becoming publicly visible:
                            </p>
                            <ol className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-decimal list-inside mb-4">
                                <li>Campaign submission and documentation upload</li>
                                <li>Review by IB4ME verification team</li>
                                <li>Hospital and medical information verification</li>
                                <li>Approval, rejection, or request for additional information</li>
                            </ol>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                IB4ME aims to complete verification promptly but does not guarantee specific timeframes.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                4.4 Campaign Limits
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                The Platform may impose limits on the number of active campaigns per user:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Individual accounts may be limited in the number of concurrent campaigns</li>
                                <li>Organization accounts may have different limits based on verification status</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                4.5 Prohibited Campaigns
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                The following campaign types are prohibited:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Campaigns based on false or misleading medical information</li>
                                <li>Campaigns for non-medical purposes disguised as medical needs</li>
                                <li>Campaigns for cosmetic procedures (unless medically necessary)</li>
                                <li>Campaigns promoting illegal activities</li>
                                <li>Campaigns that violate the rights of others</li>
                                <li>Duplicate campaigns for the same medical need</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                4.6 Fund Usage
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                Campaign Creators must use all funds received for the stated medical purpose. Misuse of funds may result in:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Account termination</li>
                                <li>Legal action</li>
                                <li>Reporting to relevant authorities</li>
                                <li>Requirement to refund donors</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                4.7 Campaign Updates
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                Campaign Creators are encouraged to provide regular updates on:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                                <li>Patient&apos;s medical progress</li>
                                <li>How funds are being used</li>
                                <li>Medical receipts and documentation</li>
                            </ul>
                        </div>

                        {/* Donations */}
                        <div id="donations" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                5. Donations
                            </h2>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                5.1 Nature of Donations
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                Donations made through the Platform are <strong>voluntary gifts</strong>. By making a donation, you acknowledge that:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>You are making a gift with no expectation of goods, services, or financial return</li>
                                <li>You have no ownership, equity, or creditor rights in the campaign or to the patient</li>
                                <li>You are not entitled to a refund except as described in Section 5.3</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                5.2 Anonymous Donations
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                Donors may choose to donate anonymously. Anonymous donations will not display the donor&apos;s name publicly, though IB4ME retains donor information for record-keeping and compliance purposes.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                5.3 Refund Policy
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                Donations are generally <strong>non-refundable</strong>. Refunds may be issued in the following circumstances:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Campaign is cancelled by IB4ME due to fraud or policy violation</li>
                                <li>Duplicate or erroneous transactions (verified by IB4ME)</li>
                                <li>As required by law</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                Refund requests must be submitted to IB4ME support within 30 days of the donation.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                5.4 Tax Implications
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                IB4ME does not provide tax advice. Donors should consult with qualified tax professionals regarding the tax implications of their donations. Donations to IB4ME campaigns may or may not be tax-deductible depending on your jurisdiction and the campaign&apos;s status.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                5.5 Donor Rights
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                Donors have no right to:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                                <li>Direct how funds are specifically used beyond the stated campaign purpose</li>
                                <li>Receive detailed accounting of expenditures</li>
                                <li>Make claims against the patient or Campaign Creator</li>
                                <li>Demand repayment of donations</li>
                            </ul>
                        </div>

                        {/* Payments and Fees */}
                        <div id="payments" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                6. Payments and Fees
                            </h2>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                6.1 Payment Methods
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                The Platform accepts payments through:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li><strong>Mobile Money</strong>: Orange Money, AfriMoney</li>
                                <li><strong>Debit/Credit Cards</strong>: Visa, Mastercard</li>
                                <li><strong>Bank Transfers</strong> (where available)</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                6.2 Fees
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                IB4ME charges fees to sustain platform operations and provide services. Fees include:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li><strong>Platform Fee</strong>: A percentage or fixed amount retained by IB4ME</li>
                                <li><strong>Payment Processing Fee</strong>: Fees charged by payment processors</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <strong>Fee amounts are clearly displayed during the checkout process before you confirm your donation.</strong> Fees are charged in addition to the donation amount and are non-refundable.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                6.3 Currency
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                The primary currency of the Platform is the <strong>Sierra Leonean Leone (SLE)</strong>. International donations may be subject to currency conversion, and exchange rates are determined by payment processors.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                6.4 Processing Times
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                                <li><strong>Donations</strong>: Typically processed within 1-3 business days</li>
                                <li><strong>Mobile Money</strong>: Usually instant to a few hours</li>
                                <li><strong>Card Payments</strong>: May take 2-5 business days to settle</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-4">
                                Processing times may vary based on payment provider and external factors.
                            </p>
                        </div>

                        {/* Withdrawals and Payouts */}
                        <div id="withdrawals" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                7. Withdrawals and Payouts
                            </h2>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                7.1 Eligibility
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                To withdraw funds, Campaign Creators must:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Complete identity verification (KYC/KYB)</li>
                                <li>Have their campaign verified and approved</li>
                                <li>Meet minimum withdrawal thresholds</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                7.2 Minimum Withdrawal Thresholds
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                The Platform enforces minimum withdrawal amounts to ensure efficient fund distribution. Threshold amounts are displayed in your campaign dashboard.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                7.3 Payout Methods
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                Funds can be withdrawn via:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li><strong>Mobile Money</strong>: Orange Money, AfriMoney</li>
                                <li><strong>Bank Transfer</strong>: To verified bank accounts</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                7.4 Payout Approval
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                Withdrawal requests are subject to review and approval by IB4ME. This process ensures:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Compliance with platform policies</li>
                                <li>Verification of fund usage intentions</li>
                                <li>Fraud prevention</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                7.5 Processing Times
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                                <li><strong>Mobile Money Payouts</strong>: Typically 1-3 business days</li>
                                <li><strong>Bank Transfers</strong>: Typically 3-7 business days</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-4">
                                Times may vary based on payment provider availability and verification requirements.
                            </p>
                        </div>

                        {/* Platform Liability Limitations */}
                        <div id="liability" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                8. Platform Liability Limitations
                            </h2>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.1 No Medical Advice
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                IB4ME is <strong>not a medical provider</strong> and does not:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Provide medical advice or recommendations</li>
                                <li>Verify the accuracy of medical diagnoses</li>
                                <li>Guarantee medical treatment outcomes</li>
                                <li>Recommend specific hospitals or treatments</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                Users should consult qualified medical professionals for medical advice.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.2 No Guarantee of Success
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                IB4ME does not guarantee that:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Any campaign will reach its funding goal</li>
                                <li>Donations will be received</li>
                                <li>Medical treatment will be successful</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.3 No Responsibility for Fund Misuse
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                While IB4ME takes measures to verify campaigns and monitor fund usage, we are <strong>not responsible</strong> for:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>How Campaign Creators use funds after disbursement</li>
                                <li>Fraudulent activities by Campaign Creators</li>
                                <li>Misrepresentation of medical conditions</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.4 Payment Processor Liability
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                IB4ME is not liable for:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Failures, delays, or errors by payment processors</li>
                                <li>Currency conversion discrepancies</li>
                                <li>Transaction disputes with payment providers</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.5 Limitation of Liability
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                To the maximum extent permitted by law:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>IB4ME&apos;s total liability shall not exceed the amount of fees paid by you to IB4ME in the 12 months preceding the claim</li>
                                <li>IB4ME is not liable for indirect, incidental, consequential, or punitive damages</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                8.6 Indemnification
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                You agree to indemnify and hold harmless IB4ME, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                                <li>Your violation of these Terms</li>
                                <li>Your use of the Platform</li>
                                <li>Content you submit to the Platform</li>
                                <li>Your campaign or donation activities</li>
                            </ul>
                        </div>

                        {/* Prohibited Conduct */}
                        <div id="prohibited" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                9. Prohibited Conduct
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                Users are prohibited from:
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                9.1 Fraudulent Activities
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Creating campaigns with false medical information</li>
                                <li>Misusing donated funds</li>
                                <li>Providing false identity information</li>
                                <li>Impersonating others</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                9.2 Financial Crimes
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Money laundering</li>
                                <li>Terrorist financing</li>
                                <li>Tax evasion</li>
                                <li>Circumventing financial regulations</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                9.3 Platform Abuse
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Creating multiple accounts to circumvent limits</li>
                                <li>Manipulating campaign statistics</li>
                                <li>Automated or bot-driven activities</li>
                                <li>Interfering with Platform operations</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                9.4 Harmful Behavior
                            </h3>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Harassment of other Users</li>
                                <li>Discriminatory content or behavior</li>
                                <li>Sharing others&apos; personal information without consent</li>
                                <li>Uploading malicious content or code</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                Violations may result in account termination, legal action, and reporting to authorities.
                            </p>
                        </div>

                        {/* Intellectual Property */}
                        <div id="intellectual-property" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                10. Intellectual Property
                            </h2>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                10.1 User Content
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                You retain ownership of content you submit to the Platform (photos, text, videos). By submitting content, you grant IB4ME a non-exclusive, worldwide, royalty-free license to:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Display content on the Platform</li>
                                <li>Use content for platform promotion and marketing</li>
                                <li>Adapt content for technical purposes</li>
                            </ul>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                10.2 Platform Content
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                All Platform content, including logos, designs, text, and software, is owned by IB4ME or its licensors and protected by intellectual property laws. You may not copy, modify, or distribute Platform content without permission.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                10.3 Trademarks
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                &quot;IB4ME&quot; and associated logos are trademarks of IB4ME Ltd. Unauthorized use is prohibited.
                            </p>
                        </div>

                        {/* Dispute Resolution */}
                        <div id="disputes" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                11. Dispute Resolution
                            </h2>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                11.1 Internal Resolution
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                For disputes related to Platform use:
                            </p>
                            <ol className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-decimal list-inside mb-4">
                                <li>Contact IB4ME support with your complaint</li>
                                <li>IB4ME will investigate and respond within 30 days</li>
                                <li>Appeals may be submitted within 14 days of the initial decision</li>
                            </ol>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                11.2 Governing Law
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                These Terms are governed by and construed in accordance with the <strong>laws of Sierra Leone</strong>.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                11.3 Jurisdiction
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the <strong>courts in Freetown, Sierra Leone</strong>.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                11.4 Donor-Campaign Creator Disputes
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                IB4ME may facilitate communication between Donors and Campaign Creators but is not obligated to resolve disputes between them. Users are encouraged to resolve disputes directly.
                            </p>
                        </div>

                        {/* Modifications and Termination */}
                        <div id="modifications" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                12. Modifications and Termination
                            </h2>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                12.1 Modifications to Terms
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                IB4ME may modify these Terms at any time. Changes will be communicated through:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Email notification to registered Users</li>
                                <li>Notice on the Platform</li>
                                <li>Updated &quot;Last Updated&quot; date</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                Continued use of the Platform after modifications constitutes acceptance of the updated Terms.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                12.2 Account Termination by User
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                You may terminate your account at any time by:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside mb-4">
                                <li>Contacting IB4ME support</li>
                                <li>Following the account deletion process in your settings</li>
                            </ul>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                Active campaigns must be resolved (completed or cancelled) before account deletion.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                12.3 Account Termination by IB4ME
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-2">
                                IB4ME may terminate accounts:
                            </p>
                            <ul className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed list-disc list-inside">
                                <li>For violation of these Terms</li>
                                <li>For suspected fraud or illegal activity</li>
                                <li>If required by law</li>
                                <li>For extended inactivity</li>
                            </ul>
                        </div>

                        {/* General Provisions */}
                        <div id="general" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                13. General Provisions
                            </h2>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                13.1 Entire Agreement
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                These Terms, together with our Privacy Policy, constitute the entire agreement between you and IB4ME regarding Platform use.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                13.2 Severability
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                If any provision of these Terms is found unenforceable, the remaining provisions continue in full force.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                13.3 Waiver
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                Failure by IB4ME to enforce any right or provision does not constitute a waiver of that right or provision.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                13.4 Assignment
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                You may not assign your rights under these Terms. IB4ME may assign its rights and obligations to any successor or affiliate.
                            </p>

                            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 mt-6">
                                13.5 Force Majeure
                            </h3>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                IB4ME is not liable for delays or failures due to circumstances beyond reasonable control, including natural disasters, war, pandemic, government action, or infrastructure failures.
                            </p>
                        </div>

                        {/* Contact Information */}
                        <div id="contact" className="scroll-mt-24">
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                                14. Contact Information
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4">
                                For questions, concerns, or support:
                            </p>
                            <div className="space-y-2 text-base sm:text-lg text-muted-foreground leading-relaxed">
                                <p><strong>IB4ME Ltd</strong></p>
                                <p><strong>Email</strong>: support@ib4me.org</p>
                                <p><strong>Address</strong>: Freetown, Sierra Leone</p>
                                <p><strong>Website</strong>: www.ib4me.org</p>
                            </div>
                        </div>

                        {/* Closing */}
                        <div className="pt-8 border-t border-muted">
                            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-center">
                                By using IB4ME, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                            </p>
                        </div>

                    </div>
                </section>
            </main>
        </div>
    );
};

export default TermsAndConditions;
