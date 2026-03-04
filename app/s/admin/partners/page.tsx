"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Globe,
  Building,
  Heart,
  Building2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

type PartnerType = "corporate" | "healthcare" | "ngo";
type PartnerStatus = "active" | "inactive";

interface Partner {
  _id: string;
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  partnerType: PartnerType;
  status: PartnerStatus;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  total: number;
  active: number;
  inactive: number;
  byType: {
    corporate: number;
    healthcare: number;
    ngo: number;
  };
  recentlyAdded: number;
}

interface PartnerFormData {
  name: string;
  website: string;
  partnerType: PartnerType;
  status: PartnerStatus;
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Filters and pagination
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<PartnerFormData>({
    name: "",
    website: "",
    partnerType: "corporate",
    status: "active",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    partner: Partner | null;
  }>({ isOpen: false, partner: null });

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/partners/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  // Fetch partners
  const fetchPartners = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(search && { search }),
        ...(typeFilter !== "all" && { partnerType: typeFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/partners?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPartners(data.data.partners);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
      toast.error("Failed to fetch partners");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, typeFilter, statusFilter]);

  // Handle logo file change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setRemoveLogo(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url = editingPartner
        ? `/api/admin/partners/${editingPartner._id}`
        : "/api/admin/partners";

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("website", formData.website);
      formDataToSend.append("partnerType", formData.partnerType);
      formDataToSend.append("status", formData.status);

      if (logoFile) {
        formDataToSend.append("logo", logoFile);
      }

      if (removeLogo) {
        formDataToSend.append("removeLogo", "true");
      }

      const response = await fetch(url, {
        method: editingPartner ? "PUT" : "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        toast.success(
          editingPartner
            ? "Partner updated successfully"
            : "Partner created successfully"
        );
        setFormOpen(false);
        setEditingPartner(null);
        resetForm();
        await fetchPartners();
        await fetchAnalytics();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save partner");
      }
    } catch (error) {
      console.error("Error saving partner:", error);
      toast.error("Failed to save partner");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog.partner) return;

    try {
      setUpdating(deleteDialog.partner._id);

      const response = await fetch(
        `/api/admin/partners/${deleteDialog.partner._id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Partner deleted successfully");
        await fetchPartners();
        await fetchAnalytics();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete partner");
      }
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast.error("Failed to delete partner");
    } finally {
      setUpdating(null);
      setDeleteDialog({ isOpen: false, partner: null });
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (partner: Partner) => {
    try {
      setUpdating(partner._id);

      const response = await fetch(
        `/api/admin/partners/${partner._id}/toggle-status`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        toast.success(
          `Partner ${partner.status === "active" ? "deactivated" : "activated"} successfully`
        );
        await fetchPartners();
        await fetchAnalytics();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to toggle status");
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      toast.error("Failed to toggle status");
    } finally {
      setUpdating(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      website: "",
      partnerType: "corporate",
      status: "active",
    });
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openEditForm = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      website: partner.website || "",
      partnerType: partner.partnerType,
      status: partner.status,
    });
    setLogoPreview(partner.logoUrl || null);
    setLogoFile(null);
    setRemoveLogo(false);
    setFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingPartner(null);
    resetForm();
    setFormOpen(true);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [search, typeFilter, statusFilter, currentPage, fetchPartners]);

  const getTypeBadge = (type: PartnerType) => {
    const config = {
      corporate: { variant: "default" as const, icon: Building, label: "Corporate" },
      healthcare: { variant: "success" as const, icon: Building2, label: "Healthcare" },
      ngo: { variant: "secondary" as const, icon: Heart, label: "NGO" },
    };

    const { variant, icon: Icon, label } = config[type];

    return (
      <Badge variant={variant}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getStatusBadge = (status: PartnerStatus) => {
    return (
      <Badge variant={status === "active" ? "success" : "secondary"}>
        {status === "active" ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </>
        )}
      </Badge>
    );
  };

  if (loading && !analytics) {
    return (
      <div className="font-Sora space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-Sora space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Partners</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage platform partners and sponsors
          </p>
        </div>

        <Button onClick={openCreateForm}>
          <Plus className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Partners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: "#00712D" }}>
                {analytics.active}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: "#FF6000" }}>
                {analytics.inactive}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Added This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: "#00712D" }}>
                {analytics.recentlyAdded}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search partners..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="ngo">NGO</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Partners ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse h-16 bg-muted rounded"
                ></div>
              ))}
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No partners found
            </div>
          ) : (
            <div className="space-y-4">
              {partners.map((partner) => (
                <div
                  key={partner._id}
                  className="border rounded-lg p-4 hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Logo */}
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {partner.logoUrl ? (
                          <Image
                            src={partner.logoUrl}
                            alt={partner.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Building className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-foreground">
                            {partner.name}
                          </h3>
                          {getTypeBadge(partner.partnerType)}
                          {getStatusBadge(partner.status)}
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {partner.website && (
                            <a
                              href={partner.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center hover:underline"
                              style={{ color: "#00712D" }}
                            >
                              <Globe className="w-4 h-4 mr-1" />
                              Website
                            </a>
                          )}
                          <span>
                            Created:{" "}
                            {new Date(partner.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant={
                          partner.status === "active" ? "outline" : "default"
                        }
                        disabled={updating === partner._id}
                        onClick={() => handleToggleStatus(partner)}
                      >
                        {updating === partner._id
                          ? "..."
                          : partner.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditForm(partner)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updating === partner._id}
                        onClick={() =>
                          setDeleteDialog({ isOpen: true, partner })
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

      {/* Form Dialog */}
      {formOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              {editingPartner ? "Edit Partner" : "Add Partner"}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Logo
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                    {logoPreview && !removeLogo ? (
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        width={80}
                        height={80}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoPreview && !removeLogo ? "Change" : "Upload"} Logo
                    </Button>
                    {(logoPreview || editingPartner?.logoUrl) && !removeLogo && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(null);
                          setRemoveLogo(true);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Partner Name *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter partner name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Website
                </label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Partner Type *
                </label>
                <Select
                  value={formData.partnerType}
                  onValueChange={(value: PartnerType) =>
                    setFormData({ ...formData, partnerType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="ngo">NGO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Status *
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value: PartnerStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormOpen(false);
                    setEditingPartner(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading
                    ? "Saving..."
                    : editingPartner
                      ? "Update"
                      : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialog.isOpen && deleteDialog.partner && (
        <AlertDialog
          open={deleteDialog.isOpen}
          onOpenChange={(open) =>
            !open && setDeleteDialog({ isOpen: false, partner: null })
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Partner</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{deleteDialog.partner.name}
                &rdquo;? This action cannot be undone.
                {deleteDialog.partner.status === "active" && (
                  <p className="mt-2 font-medium" style={{ color: "#FF6000" }}>
                    Warning: This is an active partner. Removing it will remove
                    them from the public partners display.
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {updating === deleteDialog.partner._id
                  ? "Deleting..."
                  : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
