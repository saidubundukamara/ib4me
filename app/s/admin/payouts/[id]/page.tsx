"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Clock, XCircle, ArrowLeft, User, CreditCard, History, ShieldCheck, AlertCircle } from "lucide-react";

interface PayoutMethod {
  type: "mobile_money" | "bank";
  provider?: string;
  msisdn?: string;
  accountNumber?: string;
  accountName?: string;
}

interface PolicyCheck {
  minThresholdMet?: boolean;
  overrideBy?: string | null;
}

interface Approval {
  adminId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  action: string;
  note?: string;
  at: string;
}

interface AuditLog {
  _id: string;
  actor: {
    userId?: string;
    role?: string;
  };
  action: string;
  target: {
    type: string;
    id?: string;
  };
  diff?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  at: string;
}

interface Payout {
  _id: string;
  campaignId: {
    _id: string;
    slug: string;
    beneficiary?: { name: string };
    details?: { condition: string };
    goal?: { targetMinor: number; currency: string };
    ownerId: string;
  };
  requestedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  amountMinor: number;
  method: PayoutMethod;
  status: string;
  policyCheck?: PolicyCheck;
  approvals?: Approval[];
  paymentProofUrl?: string;
  failureReason?: string;
  monimePayoutId?: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig = {
  processing: { label: "Processing", color: "bg-blue-500/15 text-blue-700", icon: Clock },
  threshold_review: { label: "Threshold Review", color: "bg-yellow-500/15 text-yellow-700", icon: AlertTriangle },
  in_review: { label: "In Review", color: "bg-orange-500/15 text-orange-700", icon: Clock },
  approved: { label: "Approved", color: "bg-green-500/15 text-green-700", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500/15 text-red-700", icon: XCircle },
  completed: { label: "Completed", color: "bg-green-500/15 text-green-700", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-500/15 text-red-700", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: XCircle },
  paid: { label: "Paid", color: "bg-green-500/15 text-green-700", icon: CheckCircle },
};

const formatCurrency = (amountMinor: number, currency: string = "SLE") => {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-SL", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function PayoutDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const payoutId = params.id as string;

  const [payout, setPayout] = useState<Payout | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [actionNote, setActionNote] = useState("");

  const fetchPayoutDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [payoutResponse, auditResponse] = await Promise.all([
        fetch(`/api/admin/payouts/${payoutId}`),
        fetch(`/api/admin/payouts/${payoutId}/audit`)
      ]);

      if (!payoutResponse.ok) {
        const payoutError = await payoutResponse.json();
        throw new Error(payoutError.message || "Failed to fetch payout");
      }

      if (!auditResponse.ok) {
        console.warn("Failed to fetch audit logs");
      }

      const payoutData = await payoutResponse.json();
      const auditData = auditResponse.ok ? await auditResponse.json() : { data: [] };

      setPayout(payoutData.data);
      setAuditLogs(auditData.data || []);
    } catch (err) {
      console.error("Error fetching payout details:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch payout details");
    } finally {
      setLoading(false);
    }
  }, [payoutId]);

  useEffect(() => {
    if (payoutId) {
      fetchPayoutDetails();
    }
  }, [payoutId, fetchPayoutDetails]);

  const handleAction = async (action: "approve" | "reject" | "override") => {
    if (!payout || !session?.user?.id) return;

    try {
      setActionLoading(action);

      let endpoint = "";
      const body: Record<string, unknown> = {};

      switch (action) {
        case "approve":
          endpoint = `/api/admin/payouts/${payoutId}/approve`;
          if (actionNote.trim()) body.note = actionNote.trim();
          break;
        case "reject":
          endpoint = `/api/admin/payouts/${payoutId}/reject`;
          body.reason = actionNote.trim() || "No reason provided";
          break;
        case "override":
          endpoint = `/api/admin/payouts/${payoutId}/override-threshold`;
          body.reason = actionNote.trim() || "Administrative override";
          break;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${action} payout`);
      }

      // Refresh data
      await fetchPayoutDetails();

      // Close dialogs and reset form
      setShowApproveDialog(false);
      setShowRejectDialog(false);
      setShowOverrideDialog(false);
      setActionNote("");

      // Show success message (you might want to use a toast here)
      alert(`Payout ${action}d successfully!`);
    } catch (err) {
      console.error(`Error ${action}ing payout:`, err);
      alert(err instanceof Error ? err.message : `Failed to ${action} payout`);
    } finally {
      setActionLoading(null);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="secondary">{status}</Badge>;

    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-4 h-4 mr-2" />
        {config.label}
      </Badge>
    );
  };

  // Show loading state while checking authentication
  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading payout details...</div>
      </div>
    );
  }

  // Redirect if not authenticated or not admin
  if (!session || !session.user || !["Admin", "SuperAdmin"].some(role => session.user.roles?.includes(role))) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8 text-red-600">
          <p>Access denied. Admin authentication required.</p>
          <Button onClick={() => router.push("/login")} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (error || !payout) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8 text-red-600">
          <p>{error || "Payout not found"}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const canApprove = ["processing", "in_review", "threshold_review"].includes(payout.status);
  const canReject = ["processing", "in_review", "approved", "threshold_review"].includes(payout.status);
  const canOverride = payout.status === "threshold_review" && !payout.policyCheck?.minThresholdMet;

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Payout Details</h1>
              <p className="text-muted-foreground">
                {payout.campaignId.beneficiary?.name} - #{payout.campaignId.slug}
              </p>
            </div>
          </div>
          <StatusBadge status={payout.status} />
        </div>

        {/* Action Buttons */}
        {(canApprove || canReject || canOverride) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2" />
                Admin Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                {canApprove && (
                  <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Approve Payout</DialogTitle>
                        <DialogDescription>
                          Approve this payout request of {formatCurrency(payout.amountMinor, payout.campaignId.goal?.currency)}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Add a note (optional)"
                          value={actionNote}
                          onChange={(e) => setActionNote(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleAction("approve")}
                          disabled={actionLoading === "approve"}
                        >
                          {actionLoading === "approve" ? "Approving..." : "Approve"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {canReject && (
                  <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reject Payout</DialogTitle>
                        <DialogDescription>
                          Reject this payout request. Please provide a reason.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Reason for rejection (required)"
                          value={actionNote}
                          onChange={(e) => setActionNote(e.target.value)}
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={() => handleAction("reject")}
                          disabled={!actionNote.trim() || actionLoading === "reject"}
                        >
                          {actionLoading === "reject" ? "Rejecting..." : "Reject"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {canOverride && (
                  <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Override Threshold
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Override Minimum Threshold</DialogTitle>
                        <DialogDescription>
                          This payout is below the minimum withdrawal threshold. Provide a reason to override this requirement.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                          <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                            <div>
                              <div className="font-medium text-yellow-700">Threshold Warning</div>
                              <div className="text-sm text-yellow-700">
                                Amount: {formatCurrency(payout.amountMinor, payout.campaignId.goal?.currency)} is below minimum threshold
                              </div>
                            </div>
                          </div>
                        </div>
                        <Textarea
                          placeholder="Reason for threshold override (required)"
                          value={actionNote}
                          onChange={(e) => setActionNote(e.target.value)}
                          required
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleAction("override")}
                          disabled={!actionNote.trim() || actionLoading === "override"}
                        >
                          {actionLoading === "override" ? "Overriding..." : "Override"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="audit">
              <History className="w-4 h-4 mr-2" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Amount</label>
                    <p className="text-2xl font-bold">
                      {formatCurrency(payout.amountMinor, payout.campaignId.goal?.currency)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">
                      <StatusBadge status={payout.status} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Payout ID</label>
                    <p className="text-sm text-muted-foreground font-mono">{payout._id}</p>
                  </div>

                  {payout.monimePayoutId && (
                    <div>
                      <label className="text-sm font-medium">Monime Payout ID</label>
                      <p className="text-sm text-muted-foreground font-mono">{payout.monimePayoutId}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Created</label>
                    <p className="text-sm">{new Date(payout.createdAt).toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Last Updated</label>
                    <p className="text-sm">{new Date(payout.updatedAt).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Beneficiary</label>
                    <p>{payout.campaignId.beneficiary?.name || "N/A"}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Campaign Slug</label>
                    <p className="text-sm text-muted-foreground">#{payout.campaignId.slug}</p>
                  </div>

                  {payout.campaignId.details?.condition && (
                    <div>
                      <label className="text-sm font-medium">Details</label>
                      <p>{payout.campaignId.details.condition}</p>
                    </div>
                  )}

                  {payout.campaignId.goal && (
                    <div>
                      <label className="text-sm font-medium">Campaign Goal</label>
                      <p>{formatCurrency(payout.campaignId.goal.targetMinor, payout.campaignId.goal.currency)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Requester Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Requester Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p>{payout.requestedBy.firstName} {payout.requestedBy.lastName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p>{payout.requestedBy.email}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <p className="capitalize">{payout.method.type.replace("_", " ")}</p>
                  </div>
                  
                  {payout.method.type === "mobile_money" ? (
                    <>
                      {payout.method.provider && (
                        <div>
                          <label className="text-sm font-medium">Provider</label>
                          <p>{payout.method.provider}</p>
                        </div>
                      )}
                      {payout.method.msisdn && (
                        <div>
                          <label className="text-sm font-medium">Phone Number</label>
                          <p>{payout.method.msisdn}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {payout.method.accountNumber && (
                        <div>
                          <label className="text-sm font-medium">Account Number</label>
                          <p>{payout.method.accountNumber}</p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {payout.method.accountName && (
                    <div>
                      <label className="text-sm font-medium">Account Name</label>
                      <p>{payout.method.accountName}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Policy Check & Approvals */}
            {(payout.policyCheck || (payout.approvals && payout.approvals.length > 0)) && (
              <div className="space-y-6">
                {payout.policyCheck && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Policy Check</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Minimum Threshold Met</label>
                          <div className="mt-1">
                            {payout.policyCheck.minThresholdMet ? (
                              <Badge className="bg-green-500/15 text-green-700">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Yes
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/15 text-red-700">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                No
                              </Badge>
                            )}
                          </div>
                        </div>
                        {payout.policyCheck.overrideBy && (
                          <div>
                            <label className="text-sm font-medium">Override Applied By</label>
                            <p>Admin (ID: {payout.policyCheck.overrideBy})</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {payout.approvals && payout.approvals.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Approval History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {payout.approvals.map((approval, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{approval.adminId.firstName} {approval.adminId.lastName}</p>
                                <p className="text-sm text-muted-foreground">{approval.adminId.email}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant={approval.action === "approved" ? "default" : "destructive"}>
                                  {approval.action}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(approval.at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {approval.note && (
                              <div className="mt-2">
                                <label className="text-xs font-medium text-muted-foreground">Note:</label>
                                <p className="text-sm">{approval.note}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Error Information */}
            {payout.failureReason && (
              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="text-red-700">Failure Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700">{payout.failureReason}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Audit Trail
                </CardTitle>
                <CardDescription>
                  Complete history of all actions performed on this payout
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No audit logs available</p>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{log.action}</Badge>
                            <span className="text-sm text-muted-foreground">
                              by {log.actor.role || "system"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.at).toLocaleString()}
                          </span>
                        </div>
                        
                        {log.diff && Object.keys(log.diff).length > 0 && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                            <details>
                              <summary className="cursor-pointer font-medium">View Changes</summary>
                              <pre className="mt-2 whitespace-pre-wrap">
                                {JSON.stringify(log.diff, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}

                        {log.ip && (
                          <div className="text-xs text-muted-foreground mt-2">
                            IP: {log.ip}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}