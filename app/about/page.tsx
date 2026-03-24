"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Heart, Users, Shield, TrendingUp, Target, CheckCircle, ArrowRight } from "lucide-react";
import { stats } from "../_components/stats";
import ib4meteam from "@/public/assets/team/ib4me_team.jpeg";
import Melvin from "@/public/assets/team/melvin.jpg";
import Saidu from "@/public/assets/team/Saidu.jpg";
import Shaka from "@/public/assets/team/Shaka.jpg";
import Abib from "@/public/assets/team/Abib.jpg";
import Namina from "@/public/assets/team/namina.jpg";

const About = () => {
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
            description: "Every campaign is verified by our medical team",
            color: "text-fun-green",
            bgColor: "bg-fun-green/10",
        },
        {
            icon: Users,
            title: "Community",
            description: "Together we can make healthcare accessible for all",
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
            name: 'Joseph Melvin Kanu',
            role: 'COO & Co-Founder',
            image: Melvin,
        },
        {
            name: 'Saidu Bundu Kamara',
            role: 'CTO & Co-Founder',
            image: Saidu,
        },
        {
            name: 'Umara Abib Kamara',
            role: 'Product and Platform Head & Co-Founder',
            image: Abib,
        },
        {
            name: 'Ishaka Kargbo',
            role: 'Head of Campaign & Community Outreach & Co-Founder',
            image: Shaka,
        },
        {
            name: 'Namina Warah Mansaray',
            role: 'Director of Communications & Co-Founder',
            image: Namina,
        },
    ];



    return (
        <div className="font-Sora">
            <main>
                {/* Hero Section */}
                <section className="py-12 sm:py-16 md:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 bg-fun-green">
                    <div className="mx-auto max-w-4xl text-center">
                        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-white mb-4 sm:mb-6">
                            About <span className="text-blaze-orange">ib4me</span>
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
                            We&#39;re on a mission to make life-saving medical care accessible to everyone through the power of community-driven crowdfunding.
                        </p>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8 sm:gap-10 lg:gap-12">
                            {/* Copy */}
                            <div>
                                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6">
                                    <Target className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                                    <span className="font-semibold text-sm sm:text-base">Our Mission</span>
                                </div>

                                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6">
                                    Helping Each Other Can Make The World A Better Place
                                </h2>

                                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">
                                    Founded in 2024, ib4me was born from a simple belief: no one should have to choose between their health and their financial security. We&#39;ve created a platform where communities come together to support those facing medical emergencies.
                                </p>

                                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                                    Our platform connects patients and donors in a transparent ecosystem where every contribution makes a real difference. With rigorous verification processes and zero platform fees, we ensure that help reaches those who need it most.
                                </p>
                            </div>

                            {/* Image + Badge */}
                            <div className="relative">
                                <Image
                                    src={ib4meteam}
                                    alt="Team helping"
                                    width={800}
                                    height={600}
                                    unoptimized
                                    className="w-full h-auto rounded-3xl shadow-2xl object-cover"
                                />
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 bg-accent text-accent-foreground px-6 sm:px-8 py-3 sm:py-4 rounded-2xl shadow-xl w-max">
                                    <div className="text-2xl sm:text-3xl font-bold leading-none">{stats.find(s => s.label === "Lives Impacted")?.value}</div>
                                    <div className="text-xs sm:text-sm">Lives Changed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
                    <div className="mx-auto max-w-6xl">
                        <div className="text-center mb-10 sm:mb-14">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl  font-bold text-foreground mb-3 sm:mb-4">
                                Our Core <span className="text-blaze-orange">Values</span>
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground">
                                The principles that guide everything we do
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-6 sm:gap-8">
                            {values.map((value, index) => {
                                const Icon = value.icon;
                                return (
                                    <Card
                                        key={index}
                                        className="h-full p-6 sm:p-8 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all text-center"
                                    >
                                        <div
                                            className={`${value.bgColor} ${value.color} w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}
                                        >
                                            <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                                        </div>

                                        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
                                            {value.title}
                                        </h3>
                                        <p className="text-sm sm:text-base text-muted-foreground">
                                            {value.description}
                                        </p>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Team */}
                <section className="py-12 md:py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-10 sm:mb-14">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-6">
                                Meet Our <span className="text-fun-green">Team</span>
                            </h2>
                            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
                                Passionate professionals and technologists working together to make healthcare accessible to everyone.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
                            {team.map((member, index) => (
                                <div key={index} className="text-center max-w-sm mx-auto">
                                    <div className="relative mb-4 sm:mb-6">
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            width={144}
                                            height={144}
                                            quality={100}
                                            priority={index < 3}
                                            className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full mx-auto object-cover border-4 border-blaze-orange shadow-xl"
                                        />
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-fun-green text-white p-2 rounded-full shadow-lg">
                                            <CheckCircle size={16} aria-hidden="true" />
                                            <span className="sr-only">Verified</span>
                                        </div>
                                    </div>

                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">
                                        {member.name}
                                    </h3>
                                    <p className="text-fun-green font-semibold text-sm sm:text-base">
                                        {member.role}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="text-center mb-10 sm:mb-14">
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl  font-bold text-foreground mb-3 sm:mb-4">
                                Our <span className="text-blaze-orange">Impact</span>
                            </h2>
                            <p className="text-base sm:text-lg text-muted-foreground">
                                Together, we&#39;re making a real difference
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-4 sm:gap-6 lg:gap-8">
                            {stats.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <Card
                                        key={index}
                                        className="h-full p-6 sm:p-8 rounded-3xl border-0 shadow-[var(--shadow-soft)] text-center hover:shadow-[var(--shadow-lift)] transition-all"
                                    >
                                        <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
                                        <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-1.5 sm:mb-2">
                                            {stat.value}
                                        </div>
                                        <div className="text-sm sm:text-base text-muted-foreground">
                                            {stat.label}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </section>


                {/* Story Section */}
                <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-primary/5">
                    <div className="mx-auto max-w-4xl">
                        <h2 className="text-center text-3xl sm:text-4xl lg:text-5xl  font-bold text-foreground mb-6 sm:mb-8">
                            Why We <span className="text-fun-green">Exist</span>
                        </h2>
                        <div className="mx-auto max-w-3xl text-muted-foreground">
                            <p className="text-base sm:text-lg lg:text-xl leading-relaxed sm:leading-loose mb-4 sm:mb-6">
                                Medical emergencies don&#39;t discriminate, but access to healthcare often does. We&#39;ve seen too many families torn apart by medical bills they couldn&#39;t afford. We&#39;ve witnessed talented individuals lose their futures because they couldn&rsquo;t access the care they needed.
                            </p>
                            <p className="text-base sm:text-lg lg:text-xl leading-relaxed sm:leading-loose mb-4 sm:mb-6">
                                That&#39;s why we built ib4me - a platform where compassion meets action. Where a mother in need can find support from strangers who become friends. Where a community rallies around one of their own in their darkest hour.
                            </p>
                            <p className="text-base sm:text-lg lg:text-xl leading-relaxed sm:leading-loose">
                                Every campaign on our platform represents more than a medical procedure, it represents hope, dignity, and the fundamental belief healthcare is a human right, not a privilege.
                            </p>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default About;
