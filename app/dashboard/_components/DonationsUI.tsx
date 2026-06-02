"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Download, Heart, Users } from "lucide-react";

export type DonationsUIProps = {
  totalRaised: number;
  donationCount: number;
  avgDonation: number;
  uniqueCampaigns: number;
  donationsReceived: Array<{
    id: string;
    campaignTitle: string;
    date: string;
    donorName?: string;
    status: string;
    amountMinor: number;
    currency?: string;
  }>;
  totalDonated: number;
  campaignsSupported: number;
  donationsMade: Array<{
    id: string;
    campaignTitle: string;
    slug?: string;
    date: string;
    status: string;
    amountMinor: number;
    currency?: string;
  }>;
  csvHref: string;
  avgPct: number;
  primaryCurrency?: string;
};

function formatCurrency(valueMajor: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(valueMajor);
  } catch {
    return `${currency} ${valueMajor.toFixed(2)}`;
  }
}

export default function DonationsUI({
  totalRaised,
  donationCount,
  avgDonation,
  uniqueCampaigns,
  donationsReceived,
  totalDonated,
  campaignsSupported,
  donationsMade,
  csvHref,
  avgPct,
  primaryCurrency = "SLE",
}: DonationsUIProps) {
  const [activeTab, setActiveTab] = useState("received");

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Donations</h2>
          <p className="text-muted-foreground mt-1">
            Track donations to your campaigns, analytics, and download your
            records.
          </p>
        </div>
        <Button variant="outline" className="rounded-2xl" asChild>
          <a href={csvHref} download="donations.csv">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </a>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full flex-col gap-2 rounded-2xl bg-muted/30 p-1 mb-6 sm:grid sm:max-w-md sm:grid-cols-2 sm:gap-0">
          <TabsTrigger
            value="received"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm sm:flex-row"
          >
            <Heart className="mr-2 h-4 w-4" />
            <span>Donations Received</span>
          </TabsTrigger>
          <TabsTrigger
            value="made"
            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm sm:flex-row"
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Donations Made</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Raised
                  </p>
                  <p className="text-xs text-muted-foreground">All time</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-primary">
                {formatCurrency(totalRaised, primaryCurrency)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {donationCount} donations
              </p>
            </Card>

            <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] bg-gradient-to-br from-orange-blaze/10 to-orange-blaze/5">
              <p className="text-sm text-muted-foreground mb-3">
                Average Donation
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(avgDonation, primaryCurrency)}
              </p>
              <div className="mt-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 bg-blaze-orange rounded-full transition-all"
                    style={{ width: `${avgPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Relative to your highest monthly total
                </p>
              </div>
            </Card>

            <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] bg-gradient-to-br from-chartereuse/10 to-chartereuse/5">
              <p className="text-sm text-muted-foreground mb-3">
                Campaigns Receiving Donations
              </p>
              <p className="text-3xl font-bold text-foreground">
                {uniqueCampaigns}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Unique campaigns supported
              </p>
            </Card>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              Recent Donations Received
            </h3>
            <div className="space-y-2">
              {donationsReceived.length === 0 ? (
                <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] text-sm text-muted-foreground">
                  No donations received yet.
                </Card>
              ) : (
                donationsReceived.map((d) => (
                  <Card
                    key={d.id}
                    className="p-4 sm:p-5 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-foreground text-sm sm:text-base">
                          {d.campaignTitle}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {d.donorName ? `From ${d.donorName}` : "Anonymous donor"}
                        </p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-1">
                        <Badge variant="outline" className="rounded-xl">
                          {d.status}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(
                            d.amountMinor / 100,
                            d.currency ?? primaryCurrency,
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {d.date}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="made" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] bg-gradient-to-br from-primary/10 to-primary/5">
              <p className="text-sm text-muted-foreground mb-1">Total Donated</p>
              <h3 className="text-3xl font-bold text-foreground">
                {formatCurrency(totalDonated, primaryCurrency)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Across {campaignsSupported} campaigns
              </p>
            </Card>

            <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] bg-gradient-to-br from-blaze-orange/10 to-blaze-orange/5">
              <p className="text-sm text-muted-foreground mb-1">
                Campaigns Supported
              </p>
              <h3 className="text-3xl font-bold text-foreground">
                {campaignsSupported}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Successful donations only
              </p>
            </Card>

            <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] bg-gradient-to-br from-chartereuse/10 to-chartereuse/5">
              <p className="text-sm text-muted-foreground mb-1">
                Average Donation
              </p>
              <h3 className="text-3xl font-bold text-foreground">
                {formatCurrency(avgDonation, primaryCurrency)}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Across your successful donations
              </p>
            </Card>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              Recent Donations Made
            </h3>
            <div className="space-y-2">
              {donationsMade.length === 0 ? (
                <Card className="p-6 rounded-3xl border-0 shadow-[var(--shadow-soft)] text-sm text-muted-foreground">
                  You have not made any donations yet.
                </Card>
              ) : (
                donationsMade.map((d) => (
                  <Card
                    key={d.id}
                    className="p-4 sm:p-5 rounded-3xl border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)] transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-foreground text-sm sm:text-base">
                          {d.campaignTitle}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {d.status}
                        </p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-1">
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(
                            d.amountMinor / 100,
                            d.currency ?? primaryCurrency,
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {d.date}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


