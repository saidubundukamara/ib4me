"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, CheckCircle, XCircle, Building2, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

interface Hospital {
  _id: string;
  name: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  verified: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  total: number;
  verified: number;
  unverified: number;
  recentlyAdded: number;
}

interface HospitalFormData {
  name: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  verified: boolean;
}

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Filters and pagination
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [formData, setFormData] = useState<HospitalFormData>({
    name: "",
    address: "",
    contactPhone: "",
    contactEmail: "",
    notes: "",
    verified: false,
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    hospital: Hospital | null;
  }>({ isOpen: false, hospital: null });

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/hospitals/analytics");
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  // Fetch hospitals
  const fetchHospitals = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(search && { search }),
        ...(verifiedFilter !== "all" && { verified: verifiedFilter }),
      });

      const response = await fetch(`/api/admin/hospitals?${params}`);
      if (response.ok) {
        const data = await response.json();
        setHospitals(data.data.hospitals);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      toast.error("Failed to fetch hospitals");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url = editingHospital 
        ? `/api/admin/hospitals/${editingHospital._id}`
        : "/api/admin/hospitals";
      
      const response = await fetch(url, {
        method: editingHospital ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingHospital ? "Hospital updated successfully" : "Hospital created successfully");
        setFormOpen(false);
        setEditingHospital(null);
        resetForm();
        await fetchHospitals();
        await fetchAnalytics();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save hospital");
      }
    } catch (error) {
      console.error("Error saving hospital:", error);
      toast.error("Failed to save hospital");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog.hospital) return;

    try {
      setUpdating(deleteDialog.hospital._id);
      
      const response = await fetch(`/api/admin/hospitals/${deleteDialog.hospital._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Hospital deleted successfully");
        await fetchHospitals();
        await fetchAnalytics();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete hospital");
      }
    } catch (error) {
      console.error("Error deleting hospital:", error);
      toast.error("Failed to delete hospital");
    } finally {
      setUpdating(null);
      setDeleteDialog({ isOpen: false, hospital: null });
    }
  };

  // Handle verification toggle
  const handleToggleVerification = async (hospital: Hospital) => {
    try {
      setUpdating(hospital._id);
      
      const response = await fetch(`/api/admin/hospitals/${hospital._id}/toggle-verification`, {
        method: "PUT",
      });

      if (response.ok) {
        toast.success(`Hospital ${hospital.verified ? 'unverified' : 'verified'} successfully`);
        await fetchHospitals();
        await fetchAnalytics();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to toggle verification");
      }
    } catch (error) {
      console.error("Error toggling verification:", error);
      toast.error("Failed to toggle verification");
    } finally {
      setUpdating(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      contactPhone: "",
      contactEmail: "",
      notes: "",
      verified: false,
    });
  };

  const openEditForm = (hospital: Hospital) => {
    setEditingHospital(hospital);
    setFormData({
      name: hospital.name,
      address: hospital.address || "",
      contactPhone: hospital.contactPhone || "",
      contactEmail: hospital.contactEmail || "",
      notes: hospital.notes || "",
      verified: hospital.verified,
    });
    setFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingHospital(null);
    resetForm();
    setFormOpen(true);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [search, verifiedFilter, currentPage]);

  const getVerificationBadge = (verified: boolean) => {
    return (
      <Badge variant={verified ? "success" : "secondary"}>
        {verified ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            Unverified
          </>
        )}
      </Badge>
    );
  };

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hospitals</h2>
          <p className="text-sm text-gray-600 mt-1">Manage partner hospitals and verification status</p>
        </div>
        
        <Button onClick={openCreateForm}>
          <Plus className="w-4 h-4 mr-2" />
          Add Hospital
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Hospitals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.verified}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unverified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{analytics.unverified}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Added This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{analytics.recentlyAdded}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search hospitals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearch("");
                setVerifiedFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hospitals Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Hospitals ({total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : hospitals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hospitals found
            </div>
          ) : (
            <div className="space-y-4">
              {hospitals.map((hospital) => (
                <div key={hospital._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center">
                          <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                          <h3 className="font-medium text-gray-900">{hospital.name}</h3>
                        </div>
                        {getVerificationBadge(hospital.verified)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p>{hospital.address || "No address provided"}</p>
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          <p>{hospital.contactPhone || "No phone provided"}</p>
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          <p>{hospital.contactEmail || "No email provided"}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        Created: {new Date(hospital.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant={hospital.verified ? "outline" : "default"}
                        disabled={updating === hospital._id}
                        onClick={() => handleToggleVerification(hospital)}
                      >
                        {updating === hospital._id ? "..." : hospital.verified ? "Unverify" : "Verify"}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditForm(hospital)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updating === hospital._id}
                        onClick={() => setDeleteDialog({ isOpen: true, hospital })}
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
          <p className="text-sm text-gray-600">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingHospital ? "Edit Hospital" : "Add Hospital"}
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital Name *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter hospital name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <Input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter any notes"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="verified"
                  checked={formData.verified}
                  onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="verified" className="text-sm font-medium text-gray-700">
                  Mark as verified
                </label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormOpen(false);
                    setEditingHospital(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? "Saving..." : editingHospital ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialog.isOpen && deleteDialog.hospital && (
        <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, hospital: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Hospital</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{deleteDialog.hospital.name}&rdquo;? This action cannot be undone.
                {deleteDialog.hospital.verified && (
                  <p className="text-orange-600 mt-2 font-medium">
                    Warning: This is a verified hospital. Deleting it may affect existing campaigns.
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
                {updating === deleteDialog.hospital._id ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}


