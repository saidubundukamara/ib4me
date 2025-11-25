"use client";

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, DollarSign, Heart, CheckCircle, Shield, Users, ArrowRight } from "lucide-react";
import { stats } from "../_components/stats";
import Link from "next/link";

const HowItWorks = () => {

  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: UserPlus,
      title: 'Create Your Campaign',
      description: 'Share your medical story and connect with our verified healthcare providers.',
      details: [
        'Complete our secure verification process',
        'Upload medical documentation',
        'Set your fundraising goal',
        'Tell your story with photos and videos'
      ],
      color: 'bg-fun-green'
    },
    {
      icon: Shield,
      title: 'Get Verified',
      description: 'Our medical team reviews and verifies all campaigns for transparency and trust.',
      details: [
        'Medical professional review',
        'Documentation verification',
        'Provider authentication',
        'Campaign approval within 24 hours'
      ],
      color: 'bg-blaze-orange'
    },
    {
      icon: Heart,
      title: 'Share & Fundraise',
      description: 'Launch your campaign and start receiving support from our compassionate community.',
      details: [
        'Campaign goes live on our platform',
        'Share with family, friends, and social media',
        'Receive donations from our community',
        'Regular updates to donors'
      ],
      color: 'bg-chartereuse'
    },
    {
      icon: DollarSign,
      title: 'Receive Funds',
      description: 'Funds are securely transferred directly to your healthcare provider.',
      details: [
        'Direct payment to medical providers',
        'Real-time fund tracking',
        'Transparent fee structure',
        'Secure, encrypted transactions'
      ],
      color: 'bg-blaze-orange'
    }
  ];


  const forDonors = [
    {
      icon: Shield,
      title: 'Browse Verified Campaigns',
      description: 'All campaigns are medically verified and transparent',
      color: 'bg-blaze-orange'
    },
    {
      icon: Heart,
      title: 'Choose Your Impact',
      description: 'Select campaigns that resonate with your values',
      color: 'bg-chartereuse'
    },
    {
      icon: CheckCircle,
      title: 'Donate Securely',
      description: 'Safe, encrypted payments with tax-deductible receipts',
      color: 'bg-blaze-orange'
    },
    {
      icon: Users,
      title: 'Stay Connected',
      description: 'Receive updates on the patients you\'ve helped',
      color: 'bg-fun-green'
    }
  ];

  return (
    <div className="font-Sora">
      <main className="">
        {/* Hero Section */}
        <section className="bg-fun-green py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-3 sm:mb-4 text-balance text-white font-bold tracking-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                How <span className="text-blaze-orange">ib4me</span> Works
              </h1>
              <p className="mx-auto max-w-2xl text-pretty text-white/80 leading-relaxed text-base sm:text-lg lg:text-xl">
                Our platform connects people in need of medical assistance with generous donors,
                creating a community of hope and healing.
              </p>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-6">
                For <span className="text-fun-green">Patients</span>
              </h2>
              <p className="mx-auto max-w-3xl text-base sm:text-lg text-gray-600">
                Getting the medical care you need shouldn&#39;t be complicated. Here&#39;s how we make it simple.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 items-start gap-8 sm:gap-12 lg:gap-16">
              {/* Steps Navigation */}
              <div className="space-y-4 sm:space-y-6">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl p-5 sm:p-6 cursor-pointer transition-all ${activeStep === index
                      ? "bg-gradient-to-r from-fun-green/10 to-chartreuse/10 border-2 border-fun-green/20"
                      : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    onClick={() => setActiveStep(index)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl ${step.color}`}>
                        <step.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">
                          {step.title}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600">
                          {step.description}
                        </p>
                      </div>

                      <div
                        className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 ${activeStep === index ? "border-fun-green bg-fun-green" : "border-gray-300"
                          }`}
                      >
                        {activeStep === index && <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Step Details */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-2xl lg:sticky lg:top-24">
                <div className={`mb-6 flex h-20 sm:h-24 items-center justify-center rounded-xl bg-gradient-to-r ${steps[activeStep].color}`}>
                  {(() => {
                    const StepIcon = steps[activeStep].icon;
                    return <StepIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white" />;
                  })()}
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {steps[activeStep].title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 leading-relaxed">
                  {steps[activeStep].description}
                </p>

                <ul className="space-y-2.5 sm:space-y-3">
                  {steps[activeStep].details.map((detail, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle className="mr-3 h-4 w-4 text-chartreuse flex-shrink-0" />
                      <span className="text-gray-700 text-sm sm:text-base">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* For Donors */}
        <section className="bg-gray-50 py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-6">
                For <span className="text-blaze-orange">Donors</span>
              </h2>
              <p className="mx-auto max-w-3xl text-base sm:text-lg text-gray-600">
                Making a difference is easy when you know your donation goes directly to verified medical care.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-6 sm:gap-8">
              {forDonors.map((item, index) => (
                <div
                  key={index}
                  className="group h-full rounded-2xl bg-white p-6 sm:p-7 shadow-md transition-all hover:-translate-y-1.5 hover:shadow-xl focus-within:ring-2 focus-within:ring-primary"
                >
                  <div className={`mb-4 inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl ${item.color}`}>
                    <item.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" aria-hidden="true" />
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust & Safety */}
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">
              Your Safety is Our <span className='text-fun-green'>Priority</span>
            </h2>
            <p className="mx-auto max-w-3xl text-base sm:text-lg text-muted-foreground">
              We verify every campaign and ensure transparent fund management
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Verified Campaigns",
                description: "All campaigns undergo thorough verification before going live",
              },
              {
                title: "Secure Payments",
                description: "Industry-standard encryption protects your financial information",
              },
              {
                title: "Full Transparency",
                description: "Track exactly how funds are used with regular updates",
              },
            ].map((item, index) => (
              <Card
                key={index}
                className="h-full rounded-3xl border-0 p-6 sm:p-8 text-center shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-shadow"
              >
                <Shield className="mx-auto mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5 sm:mb-2">
                  {item.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {item.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Success Stats */}
        <section className="bg-fun-green py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-6">
                Proven <span className="text-orange-blaze">Results</span>
              </h2>
              <p className="mx-auto max-w-3xl text-base sm:text-lg text-white/90">
                Our transparent process and verified network deliver real results for patients and providers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 auto-rows-fr gap-6 sm:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex h-full flex-col items-center rounded-2xl border border-white/20 bg-white/10 p-6 sm:p-8 backdrop-blur-sm">
                    <stat.icon className="mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12 text-white" aria-hidden="true" />
                    <div className="mb-1.5 sm:mb-2 text-3xl sm:text-4xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm sm:text-base text-white/80">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Call to Action */}
        <section className="bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="mb-3 sm:mb-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Ready to Get <span className="text-fun-green">Started</span>?
            </h2>
            <p className="mx-auto mb-6 sm:mb-8 max-w-3xl text-base sm:text-lg lg:text-xl text-gray-600">
              Whether you need medical support or want to help others, ib4me makes it simple and secure.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto rounded-full bg-fun-green font-bold text-white transition-all hover:scale-[1.02] hover:bg-fun-green/90"
              >
                <Link href="/dashboard" className="inline-flex items-center justify-center">
                  Start a Campaign
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>

              <Button
                size="lg"
                asChild
                className="w-full sm:w-auto rounded-full bg-blaze-orange font-bold text-white transition-all hover:scale-[1.02] hover:bg-blaze-orange/90"
              >
                <Link href="/campaigns" className="inline-flex items-center justify-center">
                  Browse Campaigns
                </Link>
              </Button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default HowItWorks;