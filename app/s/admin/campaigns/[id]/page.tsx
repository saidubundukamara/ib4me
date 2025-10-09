"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Campaign {
  _id: string;
  slug: string;
  patient?: { name?: string; age?: number; photoUrls?: string[] };
  diagnosis?: string;
  hospital?: { hospitalId?: string; name?: string };
  status: string;
  verification?: { 
    status?: string; 
    verifiedBy?: { firstName?: string; lastName?: string };
    verifiedAt?: string;
  };
  urgency?: string;
  totals?: { raisedMinor?: number; donationCount?: number; uniqueDonorCount?: number };
  goal?: { amountMinor?: number; currency?: string };
  story?: string;
  typeOfEmergency?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: { 
    _id: string;
    firstName?: string; 
    lastName?: string; 
    email?: string;
    phoneNumber?: string;
  };
  financial_account?: { id?: string; uvan?: string };
  withdrawals?: { totalPaidMinor?: number; count?: number };
}

interface Donation {
  _id: string;
  amount: { currency: string; minor: number };
  donorSnapshot?: { name?: string; email?: string };
  isAnonymous: boolean;
  message?: string;
  status: string;
  createdAt: string;
  provider: { name: string };
}

interface Payout {
  _id: string;
  amountMinor: number;
  status: string;
  method: { type: string; msisdn?: string; accountName?: string };
  createdAt: string;
  approvals?: Array<{
    action: string;
    adminId: { firstName: string; lastName: string };
    at: string;
    note?: string;
  }>;
}

type PageParams = {
  params: { id: string };
};

export default function AdminCampaignDetailPage({ params }: PageParams) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Action dialog state
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    action: "update_status" | "update_verification";
    title: string;
    description: string;
    value: string;
    reason: string;
  } | null>(null);

  const [id, setId] = useState<string>("");

  useEffect(() => {
    const getId = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getId();
  }, [params]);

  // Fetch campaign details
  const fetchCampaignDetails = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`/api/admin/campaigns/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCampaign(data.data);
      } else if (response.status === 404) {
        router.push("/campaigns");
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
    }
  }, [id, router]);

  // Fetch donations (mock for now - would need API endpoint)
  const fetchDonations = async () => {
    // This would be implemented with a real API endpoint
    // For now, setting empty array
    setDonations([]);
  };

  // Fetch payouts (mock for now - would need API endpoint)  
  const fetchPayouts = async () => {
    // This would be implemented with a real API endpoint
    // For now, setting empty array
    setPayouts([]);
  };

  useEffect(() => {
    if (id) {
      Promise.all([
        fetchCampaignDetails(),
        fetchDonations(),
        fetchPayouts()
      ]).finally(() => setLoading(false));
    }
  }, [id, fetchCampaignDetails]);

  // Handle admin actions
  const handleAction = async () => {
    if (!actionDialog || !campaign) return;
    
    try {
      setUpdating(true);
      
      const response = await fetch(`/api/admin/campaigns/${campaign._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionDialog.action,
          ...(actionDialog.action === "update_status" && { status: actionDialog.value }),
          ...(actionDialog.action === "update_verification" && { verificationStatus: actionDialog.value }),
          reason: actionDialog.reason,
        }),
      });

      if (response.ok) {
        await fetchCampaignDetails();
        setActionDialog(null);
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
    } finally {
      setUpdating(false);
    }
  };

  const formatAmount = (amountMinor: number, currency: string = "SLE") => {
    return new Intl.NumberFormat("en-SL", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amountMinor / 100);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
      active: "success",
      paused: "warning", 
      completed: "info",
      draft: "secondary",
      archived: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getVerificationBadge = (status?: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
      approved: "success",
      pending: "warning",
      under_review: "info",
      rejected: "destructive",
    };
    return <Badge variant={variants[status || "pending"] || "default"}>{status || "pending"}</Badge>;
  };

  const getProgressPercentage = () => {
    if (!campaign?.totals?.raisedMinor || !campaign?.goal?.amountMinor) return 0;
    return Math.min(100, (campaign.totals.raisedMinor / campaign.goal.amountMinor) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Campaign not found</p>
        <Button 
          variant="outline" 
          onClick={() => router.push("/campaigns")}
          className="mt-4"
        >
          Back to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Link 
              href="/campaigns"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              ← Back to Campaigns
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {campaign.patient?.name || campaign.diagnosis || campaign.slug}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Campaign ID: {campaign._id}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {getStatusBadge(campaign.status)}
          {getVerificationBadge(campaign.verification?.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Patient Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900">{campaign.patient?.name || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Age</label>
                    <p className="text-gray-900">{campaign.patient?.age || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Diagnosis</label>
                    <p className="text-gray-900">{campaign.diagnosis || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Emergency Type</label>
                    <p className="text-gray-900">{campaign.typeOfEmergency || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Hospital</label>
                    <p className="text-gray-900">{campaign.hospital?.name || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Urgency</label>
                    <div className="mt-1">
                      <Badge variant={
                        campaign.urgency === "high" ? "destructive" : 
                        campaign.urgency === "medium" ? "warning" : "secondary"
                      }>
                        {campaign.urgency || "medium"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Story */}
              {campaign.story && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Campaign Story</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{campaign.story}</p>
                  </div>
                </div>
              )}

              {/* Campaign Owner */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Campaign Owner</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900">
                      {campaign.ownerId?.firstName} {campaign.ownerId?.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{campaign.ownerId?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{campaign.ownerId?.phoneNumber || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Fundraising Progress</span>
                  <span className="text-sm text-gray-500">{getProgressPercentage().toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-semibold text-gray-900">
                    {formatAmount(campaign.totals?.raisedMinor || 0, campaign.goal?.currency)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Goal: {formatAmount(campaign.goal?.amountMinor || 0, campaign.goal?.currency)}
                  </span>
                </div>
              </div>

              {/* Financial Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {campaign.totals?.donationCount || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Donations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {campaign.totals?.uniqueDonorCount || 0}
                  </p>
                  <p className="text-sm text-gray-600">Unique Donors</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatAmount(campaign.withdrawals?.totalPaidMinor || 0, campaign.goal?.currency)}
                  </p>
                  <p className="text-sm text-gray-600">Withdrawn</p>
                </div>
              </div>

              {/* Financial Account */}
              {campaign.financial_account && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Financial Account</h4>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><span className="font-medium">Account ID:</span> {campaign.financial_account.id}</p>
                    <p><span className="font-medium">UVAN:</span> {campaign.financial_account.uvan}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Donations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Donations</CardTitle>
            </CardHeader>
            <CardContent>
              {donations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No donations found</p>
              ) : (
                <div className="space-y-3">
                  {donations.slice(0, 5).map((donation) => (
                    <div key={donation._id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <p className="font-medium">
                          {donation.isAnonymous ? "Anonymous" : donation.donorSnapshot?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(donation.createdAt).toLocaleDateString()} • {donation.provider.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatAmount(donation.amount.minor, donation.amount.currency)}
                        </p>
                        <Badge variant={donation.status === "succeeded" ? "success" : "warning"}>
                          {donation.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Admin Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">Campaign Status</label>
                <Select
                  value={campaign.status}
                  onValueChange={(value) => setActionDialog({
                    isOpen: true,
                    action: "update_status",
                    title: "Update Campaign Status",
                    description: `Are you sure you want to change the status to "${value}"?`,
                    value,
                    reason: "",
                  })}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 block mb-2">Verification Status</label>
                <Select
                  value={campaign.verification?.status || "pending"}
                  onValueChange={(value) => setActionDialog({
                    isOpen: true,
                    action: "update_verification",
                    title: "Update Verification Status",
                    description: `Are you sure you want to change the verification status to "${value}"?`,
                    value,
                    reason: "",
                  })}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Slug</label>
                <p className="text-gray-900 break-all">{campaign.slug}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-gray-900">{new Date(campaign.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                <p className="text-gray-900">{new Date(campaign.updatedAt).toLocaleString()}</p>
              </div>
              {campaign.verification?.verifiedBy && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Verified By</label>
                  <p className="text-gray-900">
                    {campaign.verification.verifiedBy.firstName} {campaign.verification.verifiedBy.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {campaign.verification.verifiedAt ? 
                      new Date(campaign.verification.verifiedAt).toLocaleString() : ""
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payouts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No payouts found</p>
              ) : (
                <div className="space-y-3">
                  {payouts.slice(0, 3).map((payout) => (
                    <div key={payout._id} className="border-b pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {formatAmount(payout.amountMinor, campaign.goal?.currency)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          payout.status === "paid" ? "success" : 
                          payout.status === "approved" ? "info" : "warning"
                        }>
                          {payout.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {payout.method.type}: {payout.method.accountName || payout.method.msisdn}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      {actionDialog && (
        <AlertDialog open={actionDialog.isOpen} onOpenChange={(open) => !open && setActionDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{actionDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {actionDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium text-gray-600 block mb-2">
                Reason (optional)
              </label>
              <Input
                value={actionDialog.reason}
                onChange={(e) => setActionDialog({ ...actionDialog, reason: e.target.value })}
                placeholder="Enter reason for this change..."
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAction} disabled={updating}>
                {updating ? "Updating..." : "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}


