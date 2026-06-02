"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { generateAvatarDataUri } from "@/lib/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MessageSquareQuote,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string;
  quote: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: { label: "Pending Review", variant: "secondary", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
};

export default function TestimonialsPage() {
  const { data: session } = useSession();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [authorRole, setAuthorRole] = useState("");
  const [quote, setQuote] = useState("");

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasApproved = testimonials.some((t) => t.status === "approved");

  const fetchTestimonials = useCallback(async () => {
    try {
      const response = await fetch("/api/user/testimonials");
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data.testimonials || []);
      } else {
        console.error("Failed to fetch testimonials");
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchTestimonials();
    }
  }, [session, fetchTestimonials]);

  const resetForm = () => {
    setAuthorRole("");
    setQuote("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingId
        ? `/api/user/testimonials/${editingId}`
        : "/api/user/testimonials";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorRole, quote }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          editingId
            ? "Testimonial updated successfully"
            : "Testimonial submitted successfully"
        );
        resetForm();
        fetchTestimonials();
      } else {
        toast.error(data.message || "Failed to save testimonial");
      }
    } catch (error) {
      console.error("Error saving testimonial:", error);
      toast.error("Failed to save testimonial");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setAuthorRole(testimonial.authorRole);
    setQuote(testimonial.quote);
    setEditingId(testimonial.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/user/testimonials/${deleteId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Testimonial deleted successfully");
        setDeleteId(null);
        fetchTestimonials();
      } else {
        toast.error(data.message || "Failed to delete testimonial");
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    } finally {
      setDeleting(false);
    }
  };

  const getAvatarUrl = (name: string) => generateAvatarDataUri(name);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <MessageSquareQuote className="h-7 w-7 text-primary" />
            My Testimonials
          </h1>
          <p className="text-muted-foreground mt-1">
            Share your story and help inspire others
          </p>
        </div>
        {!hasApproved && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Testimonial
          </Button>
        )}
      </div>

      {/* Info card for users with approved testimonial */}
      {hasApproved && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">
              You have an approved testimonial displayed on the homepage. Only
              one approved testimonial is allowed per user.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Testimonials list */}
      {testimonials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquareQuote className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Testimonials Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Share your experience with ib4me. Your story can inspire others
              to help those in need.
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your Testimonial
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {testimonials.map((testimonial) => {
            const config = statusConfig[testimonial.status];
            const StatusIcon = config.icon;
            const canEdit = testimonial.status !== "approved";

            return (
              <Card key={testimonial.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={getAvatarUrl(testimonial.authorName)}
                          alt={testimonial.authorName}
                        />
                        <AvatarFallback>
                          {testimonial.authorName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {testimonial.authorName}
                        </CardTitle>
                        <CardDescription>
                          {testimonial.authorRole}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={config.variant} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic mb-4">
                    &quot;{testimonial.quote}&quot;
                  </p>

                  {/* Rejection reason */}
                  {testimonial.status === "rejected" &&
                    testimonial.rejectionReason && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg mb-4">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">
                            Rejection Reason
                          </p>
                          <p className="text-sm text-red-700">
                            {testimonial.rejectionReason}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Actions */}
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(testimonial)}
                        className="gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(testimonial.id)}
                        className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Testimonial" : "Add Testimonial"}
            </DialogTitle>
            <DialogDescription>
              Share your experience with ib4me. Your testimonial will be
              reviewed before appearing on the homepage.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {session?.user?.name || "Your Name"}
                </p>
                <p className="text-xs text-muted-foreground">
                  This is your account name and will be displayed with your testimonial
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorRole">Your Role / Experience</Label>
                <Input
                  id="authorRole"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  placeholder="e.g., Cancer Survivor, Grateful Donor"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote">Your Testimonial</Label>
                <Textarea
                  id="quote"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="Share how ib4me has impacted your life or why you support our mission..."
                  rows={4}
                  maxLength={500}
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {quote.length}/500 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Submitting..."
                  : editingId
                  ? "Update Testimonial"
                  : "Submit Testimonial"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this testimonial? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
