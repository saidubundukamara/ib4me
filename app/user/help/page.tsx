"use client"


import React from 'react'
import Card from '../_components/Card'
import { Bell, Heart, HelpCircle, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

const Help = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground mb-6">Help & Support</h2>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all cursor-pointer">
                    <HelpCircle className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-bold text-foreground mb-2">FAQs</h3>
                    <p className="text-sm text-muted-foreground">Find answers to common questions</p>
                </Card>

                <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all cursor-pointer">
                    <Heart className="w-8 h-8 text-blaze-orange mb-3" />
                    <h3 className="font-bold text-foreground mb-2">Contact Support</h3>
                    <p className="text-sm text-muted-foreground">Get help from our team</p>
                </Card>
            </div>

            {/* Common Topics */}
            <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)]">
                <h3 className="text-xl font-bold text-foreground mb-4">Common Topics</h3>
                <div className="space-y-3">
                    {[
                        "How to start a campaign",
                        "Donation fees and processing",
                        "Withdrawal guidelines",
                        "Using Welbodi Box savings",
                        "Account security and privacy",
                        "Tax deductions for donors"
                    ].map((topic, idx) => (
                        <Button key={idx} variant="ghost" className="w-full justify-start rounded-xl">
                            <span className="text-left">{topic}</span>
                        </Button>
                    ))}
                </div>
            </Card>

            {/* Contact Options */}
            <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)]">
                <h3 className="text-xl font-bold text-foreground mb-4">Contact Us</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bell className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground">Email Support</h4>
                            <p className="text-sm text-muted-foreground">support@ib4me.org</p>
                            <p className="text-xs text-muted-foreground mt-1">Response within 24 hours</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blaze-text-blaze-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-blaze-orange" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground">Community Forum</h4>
                            <p className="text-sm text-muted-foreground">Join discussions with other users</p>
                            <Button variant="link" className="h-auto p-0 text-primary">Visit Forum →</Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

export default Help