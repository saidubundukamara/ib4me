"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Heart, Users, Shield, TrendingUp, Target, CheckCircle, ArrowRight } from "lucide-react";
import { usePlatformStats, getStatItems, StatItem } from "../_components/LiveStatsGrid";
import ib4meteam from "@/public/assets/team/ib4me_team.jpeg";
import Melvin from "@/public/assets/team/melvin.jpg";
import Saidu from "@/public/assets/team/Saidu.jpg";
import Shaka from "@/public/assets/team/Shaka.jpg";
import Abib from "@/public/assets/team/Abib.jpg";
import Namina from "@/public/assets/team/namina.jpg";

const About = () => {
    const platformData = usePlatformStats();
    const stats = getStatItems(platformData);

    const values = [
        {
            icon: Heart,
            title: "Compassion",
            description: "We believe in the power of human kindness to change lives",
            color: "text-blaze-orange",
            bgColor: "bg-blaze-orange/10",
        },
        {
            icon: Shield,
            title: "Trust",
            description: "Every campaign is reviewed by our team to ensure legitimacy",
            color: "text-fun-green",
            bgColor: "bg-fun-green/10",
        },
        {
            icon: Users,
            title: "Community",
            description: "Together we can make a difference for all",
            color: "text-orange-blaze",
            bgColor: "bg-orange-blaze/10",
        },
        {
            icon: TrendingUp,
            title: "Transparency",
            description: "100% of donations go directly to beneficiaries",
            color: "text-chartereuse",
            bgColor: "bg-chartereuse/10",
        },
    ];

    const team = [
        {
            name: "Joseph Melvin Kanu",
            role: "COO & Co-Founder",
            image: Melvin,
        },
        {
            name: "Saidu Bundu Kamara",
            role: "CTO & Co-Founder",
            image: Saidu,
        },
        {
            name: "Umara Abib Kamara",
            role: "Product & Platform Head",
            subtitle: "Co-Founder",
            image: Abib,
        },
        {
            name: "Ishaka Kargbo",
            role: "Campaign & Outreach Lead",
            subtitle: "Co-Founder",
            image: Shaka,
        },
        {
            name: "Namina Warah Mansaray",
            role: "Director of Communications",
            subtitle: "Co-Founder",
            image: Namina,
        },
    ];

    return (
        <div className="font-Sora">
            <main>
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-fun-green py-14 px-4 sm:py-18 sm:px-6 lg:py-24 lg:px-8">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl sm:h-96 sm:w-96" />
                        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blaze-orange/10 blur-3xl sm:h-[28rem] sm:w-[28rem]" />
                        <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-chartereuse/10 blur-3xl sm:h-64 sm:w-64" />
                    </div>
                    <div className="relative mx-auto max-w-4xl text-center">
                        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-6xl">
                            About <span className="text-blaze-orange">ib4me</span>
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:mt-6 sm:text-lg lg:text-xl">
                            We&#39;re on a mission to empower communities and change lives through the power of crowdfunding for social good.
                        </p>
                    </div>
                    <div className="absolute -bottom-px left-0 right-0">
                        <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="block w-full" preserveAspectRatio="none">
                            <path d="M0 56h1440V28c-240-28-480-28-720 0S240 56 0 28v28Z" fill="white" />
                        </svg>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-14 px-4 sm:py-18 sm:px-6 lg:py-24 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-12">
                            {/* Copy */}
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-primary sm:mb-6 sm:px-4 sm:py-2">
                                    <Target className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                                    <span className="text-sm font-semibold sm:text-base">Our Mission</span>
                                </div>

                                <h2 className="mb-4 text-2xl font-bold text-foreground sm:mb-6 sm:text-3xl lg:text-4xl">
                                    Helping Each Other Can Make The World A Better Place
                                </h2>

                                <p className="mb-4 text-base leading-relaxed text-muted-foreground sm:mb-6 sm:text-lg">
                                    Founded in 2024, ib4me was born from a simple belief: no one should face a crisis alone. We&#39;ve created a platform where communities come together to support those in need, from education and healthcare to personal emergencies and community development.
                                </p>

                                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                                    Our platform connects people and donors in a transparent ecosystem where every contribution makes a real difference. With a small fee covered by donors, 100% of each donation goes directly to the campaign.
                                </p>
                            </div>

                            {/* Image + Badge */}
                            <div className="relative">
                                <Image
                                    src={ib4meteam}
                                    alt="The ib4me team"
                                    width={800}
                                    height={600}
                                    unoptimized
                                    className="h-auto w-full rounded-3xl object-cover shadow-2xl"
                                />
                                <div className="absolute -bottom-6 left-1/2 w-max -translate-x-1/2 rounded-2xl bg-accent px-6 py-3 text-accent-foreground shadow-xl sm:left-auto sm:translate-x-0 sm:px-8 sm:py-4">
                                    <div className="text-2xl font-bold leading-none sm:text-3xl">{platformData ? stats.find(s => s.label === "Donations Made")?.value.toLocaleString() : "—"}</div>
                                    <div className="text-xs sm:text-sm">Donations Made</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="bg-muted/30 py-14 px-4 sm:py-18 sm:px-6 lg:py-24 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-10 text-center sm:mb-14">
                            <h2 className="mb-3 text-3xl font-bold text-foreground sm:mb-4 sm:text-4xl lg:text-5xl">
                                Our Core <span className="text-blaze-orange">Values</span>
                            </h2>
                            <p className="text-base text-muted-foreground sm:text-lg">
                                The principles that guide everything we do
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {values.map((value, index) => {
                                const Icon = value.icon;
                                return (
                                    <Card
                                        key={index}
                                        className="h-full rounded-3xl border-0 p-6 text-center shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-lift)] sm:p-8"
                                    >
                                        <div
                                            className={`${value.bgColor} ${value.color} mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full sm:mb-4 sm:h-16 sm:w-16`}
                                        >
                                            <Icon className="h-7 w-7 sm:h-8 sm:w-8" />
                                        </div>

                                        <h3 className="mb-2 text-lg font-bold text-foreground sm:mb-3 sm:text-xl">
                                            {value.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground sm:text-base">
                                            {value.description}
                                        </p>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Team */}
                <section className="py-14 px-4 sm:py-18 sm:px-6 lg:py-24 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-10 text-center sm:mb-14">
                            <h2 className="mb-3 text-3xl font-bold text-foreground sm:mb-6 sm:text-4xl lg:text-5xl">
                                Meet Our <span className="text-fun-green">Team</span>
                            </h2>
                            <p className="mx-auto max-w-3xl text-base text-muted-foreground sm:text-lg lg:text-xl">
                                Passionate professionals and technologists working together to make a difference for everyone.
                            </p>
                        </div>

                        {/* Top row: 3 members */}
                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3 lg:gap-12">
                            {team.slice(0, 3).map((member, index) => (
                                <div key={index} className="mx-auto max-w-sm text-center">
                                    <div className="relative mb-4 sm:mb-6">
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            width={144}
                                            height={144}
                                            quality={100}
                                            priority={index < 3}
                                            className="mx-auto h-28 w-28 rounded-full border-4 border-blaze-orange object-cover shadow-xl sm:h-32 sm:w-32 lg:h-36 lg:w-36"
                                        />
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-fun-green p-2 text-white shadow-lg">
                                            <CheckCircle size={16} aria-hidden="true" />
                                            <span className="sr-only">Verified</span>
                                        </div>
                                    </div>

                                    <h3 className="mb-1.5 text-lg font-bold text-foreground sm:mb-2 sm:text-xl">
                                        {member.name}
                                    </h3>
                                    <p className="text-sm font-semibold text-fun-green sm:text-base">
                                        {member.role}
                                    </p>
                                    {"subtitle" in member && member.subtitle && (
                                        <p className="mt-0.5 text-xs text-muted-foreground">{member.subtitle}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Bottom row: 2 members, centered */}
                        <div className="mt-8 grid grid-cols-1 gap-8 sm:mt-10 sm:grid-cols-2 sm:gap-10 lg:mx-auto lg:max-w-3xl lg:gap-12">
                            {team.slice(3).map((member, index) => (
                                <div key={index} className="mx-auto max-w-sm text-center">
                                    <div className="relative mb-4 sm:mb-6">
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            width={144}
                                            height={144}
                                            quality={100}
                                            className="mx-auto h-28 w-28 rounded-full border-4 border-blaze-orange object-cover shadow-xl sm:h-32 sm:w-32 lg:h-36 lg:w-36"
                                        />
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-fun-green p-2 text-white shadow-lg">
                                            <CheckCircle size={16} aria-hidden="true" />
                                            <span className="sr-only">Verified</span>
                                        </div>
                                    </div>

                                    <h3 className="mb-1.5 text-lg font-bold text-foreground sm:mb-2 sm:text-xl">
                                        {member.name}
                                    </h3>
                                    <p className="text-sm font-semibold text-fun-green sm:text-base">
                                        {member.role}
                                    </p>
                                    {"subtitle" in member && member.subtitle && (
                                        <p className="mt-0.5 text-xs text-muted-foreground">{member.subtitle}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="bg-muted/30 py-14 px-4 sm:py-18 sm:px-6 lg:py-24 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-10 text-center sm:mb-14">
                            <h2 className="mb-3 text-3xl font-bold text-foreground sm:mb-4 sm:text-4xl lg:text-5xl">
                                Our <span className="text-blaze-orange">Impact</span>
                            </h2>
                            <p className="text-base text-muted-foreground sm:text-lg">
                                Together, we&#39;re making a real difference
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
                            {stats.map((stat, index) => (
                                <Card
                                    key={index}
                                    className="h-full rounded-3xl border-0 p-6 text-center shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-lift)] sm:p-8"
                                >
                                    <StatItem stat={stat} loaded={!!platformData} />
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Story Section */}
                <section className="py-14 px-4 sm:py-18 sm:px-6 lg:py-24 lg:px-8">
                    <div className="mx-auto max-w-4xl">
                        <h2 className="mb-6 text-center text-3xl font-bold text-foreground sm:mb-8 sm:text-4xl lg:text-5xl">
                            Why We <span className="text-fun-green">Exist</span>
                        </h2>
                        <div className="mx-auto max-w-3xl text-muted-foreground">
                            <p className="mb-4 text-base leading-relaxed sm:mb-6 sm:text-lg sm:leading-loose lg:text-xl">
                                Crises don&#39;t discriminate, but access to support often does. We&#39;ve seen too many families torn apart by emergencies they couldn&#39;t afford. We&#39;ve witnessed talented individuals lose their futures because they couldn&#39;t access the help they needed.
                            </p>
                            <p className="mb-4 text-base leading-relaxed sm:mb-6 sm:text-lg sm:leading-loose lg:text-xl">
                                That&#39;s why we built ib4me &mdash; a platform where compassion meets action. Whether it&apos;s a family navigating a medical crisis, a student pursuing education, an entrepreneur building a community business, or a town recovering from disaster &mdash; everyone deserves a place to find support.
                            </p>
                            <p className="text-base leading-relaxed sm:text-lg sm:leading-loose lg:text-xl">
                                Every campaign on our platform represents more than a fundraising goal &mdash; it represents hope, dignity, and the fundamental belief that everyone deserves a helping hand.
                            </p>
                        </div>

                        {/* CTA */}
                        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:mt-14 sm:flex-row sm:gap-4">
                            <Button size="lg" className="group rounded-2xl bg-blaze-orange px-8 font-semibold text-white hover:bg-blaze-orange/90" asChild>
                                <Link href="/campaigns">
                                    Browse Campaigns
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="rounded-2xl px-8 font-semibold" asChild>
                                <Link href="/dashboard">Start a Campaign</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default About;
