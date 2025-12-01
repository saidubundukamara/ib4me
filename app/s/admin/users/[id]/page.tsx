"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Save, User, Building2 } from "lucide-react";

interface Organization {
  name?: string | null;
  type?: "ngo" | "charity" | null;
  registrationNumber?: string | null;
  taxId?: string | null;
  description?: string | null;
  website?: string | null;
  address?: {
    street?: string | null;
    city?: string | null;
    country?: string | null;
  } | null;
}

interface UserData {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SuperAdmin" | "Admin" | "User" | "Organization";
  isActive: boolean;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<UserData | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    isActive: true,
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Check if current user can edit (Admin or SuperAdmin)
  const canEdit = currentUser?.role === "SuperAdmin" || currentUser?.role === "Admin";
  const isOrganization = user?.role === "Organization";
  const { id: userId } = React.use(params);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch user");
      }

      const userData = data.user;
      setUser(userData);

      // Initialize form data
      setFormData({
        name: `${userData.firstName} ${userData.lastName}`.trim(),
        email: userData.email,
        phone: userData.phone || "",
        isActive: userData.isActive,
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch user";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Check if there are changes
      const originalData = {
        name: `${user?.firstName} ${user?.lastName}`.trim(),
        email: user?.email || "",
        phone: user?.phone || "",
        isActive: user?.isActive || false,
      };

      const hasChanges = JSON.stringify(newData) !== JSON.stringify(originalData);
      setHasChanges(hasChanges);

      return newData;
    });

    if (error) setError(""); // Clear error when user starts typing
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Phone validation (if provided)
    if (formData.phone && formData.phone.length < 8) {
      setError("Please enter a valid phone number");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !hasChanges) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      toast.success("User updated successfully!", {
        description: `${formData.name}'s information has been updated.`,
      });

      // Refresh user data
      await fetchUser();
      setHasChanges(false);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      toast.error("Failed to update user", {
        description: errorMessage,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmed) return;
    }
    router.push('/s/admin/users');
  };

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId, fetchUser]);

  // Redirect if not admin or super admin
  if (!canEdit) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h2>
              <p className="text-gray-600 mb-4">You do not have permission to edit users.</p>
              <Button onClick={() => router.push('/s/admin/users')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p>Loading user information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-lg font-medium text-gray-900 mb-2">User Not Found</h2>
              <p className="text-gray-600 mb-4">The requested user could not be found.</p>
              <Button onClick={() => router.push('/s/admin/users')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOrganization ? (
              <Building2 className="h-8 w-8 text-gray-400" />
            ) : (
              <User className="h-8 w-8 text-gray-400" />
            )}
            <div>
              <h1 className="text-3xl font-bold">
                {isOrganization ? "Edit Organisation" : "Edit User"}
              </h1>
              <p className="text-muted-foreground">
                {isOrganization
                  ? "Update organisation account information"
                  : "Update user account information"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {isOrganization ? "Contact Information" : "User Information"}
                </CardTitle>
                <CardDescription>
                  {isOrganization
                    ? "Primary contact details for this organisation"
                    : "Basic account details"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {isOrganization ? "Contact Name *" : "Full Name *"}
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder={isOrganization ? "Enter contact name" : "Enter full name"}
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={saving}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={saving}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter phone number"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Account Status</Label>
                      <Select
                        value={formData.isActive ? "active" : "inactive"}
                        onValueChange={(value) => handleInputChange('isActive', value === "active")}
                        disabled={saving}
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
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={saving || !hasChanges}
                      className="flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Organisation Details (only for Organisation accounts) */}
            {isOrganization && user.organization && (
              <Card>
                <CardHeader>
                  <CardTitle>Organisation Details</CardTitle>
                  <CardDescription>
                    Registered organisation information (read-only)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {user.organization.name && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Organisation Name</Label>
                        <p className="font-medium">{user.organization.name}</p>
                      </div>
                    )}
                    {user.organization.type && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Type</Label>
                        <p className="font-medium capitalize">{user.organization.type}</p>
                      </div>
                    )}
                    {user.organization.registrationNumber && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Registration Number</Label>
                        <p className="font-medium">{user.organization.registrationNumber}</p>
                      </div>
                    )}
                    {user.organization.taxId && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Tax ID</Label>
                        <p className="font-medium">{user.organization.taxId}</p>
                      </div>
                    )}
                    {user.organization.website && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Website</Label>
                        <p className="font-medium">
                          <a
                            href={user.organization.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {user.organization.website}
                          </a>
                        </p>
                      </div>
                    )}
                    {user.organization.description && (
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-muted-foreground text-xs">Description</Label>
                        <p className="text-sm">{user.organization.description}</p>
                      </div>
                    )}
                    {user.organization.address && (
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-muted-foreground text-xs">Address</Label>
                        <p className="font-medium">
                          {[
                            user.organization.address.street,
                            user.organization.address.city,
                            user.organization.address.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={isOrganization ? "outline" : "secondary"} className="flex items-center gap-1">
                    {isOrganization ? (
                      <>
                        <Building2 className="h-3 w-3" />
                        Organisation
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3" />
                        Individual
                      </>
                    )}
                  </Badge>
                </div>
                <div>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">User ID:</span>
                  <p className="font-mono text-xs break-all">{user._id}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Updated:</span>
                  <p>{new Date(user.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}