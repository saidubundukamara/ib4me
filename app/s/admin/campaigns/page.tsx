"use client";

import { useState, useEffect, useCallback } from "react";
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
  beneficiary?: { name?: string; age?: number };
  details?: string;
  status: string;
  verification?: { status?: string };
  urgency?: string;
  totals?: { raisedMinor?: number };
  goal?: { amountMinor?: number; currency?: string };
  createdAt: string;
  ownerId?: { firstName?: string; lastName?: string; email?: string };
}

interface Analytics {
  totalCampaigns: number;
  activeCampaigns: number;
  unverifiedOwnerCampaigns: number;
  totalRaised: number;
  verificationBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Filters and pagination
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Quick action dialog
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    campaignId: string;
    action: "pause" | "resume" | "urgent";
    title: string;
    description: string;
  } | null>(null);

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/campaigns/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(verificationFilter !== "all" && { verificationStatus: verificationFilter }),
        ...(urgencyFilter !== "all" && { urgency: urgencyFilter }),
      });

      const response = await fetch(`/api/admin/campaigns?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.data.campaigns);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, verificationFilter, urgencyFilter]);

  // Quick actions
  const handleQuickAction = async (campaignId: string, action: string) => {
    try {
      setUpdating(campaignId);
      
      let status = "";
      if (action === "pause") status = "paused";
      else if (action === "resume") status = "active";
      
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          status,
          reason: `Quick action: ${action}`,
        }),
      });

      if (response.ok) {
        fetchCampaigns();
        fetchAnalytics();
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
    } finally {
      setUpdating(null);
      setActionDialog(null);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [search, statusFilter, verificationFilter, urgencyFilter, currentPage, fetchCampaigns]);

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

  const getUrgencyBadge = (urgency?: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
      high: "destructive",
      medium: "warning",
      low: "secondary",
    };
    return <Badge variant={variants[urgency || "medium"] || "default"}>{urgency || "medium"}</Badge>;
  };

  if (loading && !analytics) {
    return (
      <div className="space-y-6 font-Sora">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-Sora">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Campaigns</h2>
        <p className="text-sm text-muted-foreground mt-1">Review, approve, and manage campaigns</p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Campaigns", value: analytics.totalCampaigns, color: "#00712D" },
            { label: "Active Campaigns", value: analytics.activeCampaigns, color: "#00712D" },
            { label: "Unverified Owner Campaigns", value: analytics.unverifiedOwnerCampaigns, color: "#FF6000" },
            { label: "Total Raised", value: formatAmount(analytics.totalRaised), color: "#FBB03B" },
          ].map((card) => (
            <Card key={card.label} className="rounded-2xl">
              <CardContent className="pt-5">
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Verifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verifications</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Urgencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgencies</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setVerificationFilter("all");
                setUrgencyFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Campaigns ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded-xl"></div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No campaigns found
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign._id} className="border rounded-lg p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <Link 
                            href={`/campaigns/${campaign._id}`}
                            className="font-medium hover:underline" style={{ color: "#00712D" }}
                          >
                            {campaign.beneficiary?.name || campaign.details || campaign.slug}
                          </Link>
                          <div className="text-sm text-muted-foreground mt-1">
                            Owner: {campaign.ownerId?.firstName} {campaign.ownerId?.lastName} ({campaign.ownerId?.email})
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {getStatusBadge(campaign.status)}
                          {getVerificationBadge(campaign.verification?.status)}
                          {getUrgencyBadge(campaign.urgency)}
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-6 text-sm text-muted-foreground">
                        <span>
                          Raised: {formatAmount(campaign.totals?.raisedMinor || 0, campaign.goal?.currency)} / 
                          {formatAmount(campaign.goal?.amountMinor || 0, campaign.goal?.currency)}
                        </span>
                        <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      {campaign.status === "active" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={updating === campaign._id}
                          onClick={() => setActionDialog({
                            isOpen: true,
                            campaignId: campaign._id,
                            action: "pause",
                            title: "Pause Campaign",
                            description: "Are you sure you want to pause this campaign? It will stop accepting new donations."
                          })}
                        >
                          {updating === campaign._id ? "..." : "Pause"}
                        </Button>
                      )}
                      
                      {campaign.status === "paused" && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={updating === campaign._id}
                          onClick={() => setActionDialog({
                            isOpen: true,
                            campaignId: campaign._id,
                            action: "resume",
                            title: "Resume Campaign",
                            description: "Are you sure you want to resume this campaign? It will start accepting donations again."
                          })}
                        >
                          {updating === campaign._id ? "..." : "Resume"}
                        </Button>
                      )}
                      
                      <Link href={`/campaigns/${campaign._id}`}>
                        <Button size="sm" variant="default">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing page {currentPage} of {totalPages}
          </p>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Quick Action Dialog */}
      {actionDialog && (
        <AlertDialog open={actionDialog.isOpen} onOpenChange={(open) => !open && setActionDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{actionDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {actionDialog.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => handleQuickAction(actionDialog.campaignId, actionDialog.action)}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}


