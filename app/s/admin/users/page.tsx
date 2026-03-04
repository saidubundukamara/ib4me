"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { toast } from "sonner";
import {
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  User,
  Building2
} from "lucide-react";

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

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);

  // Tab state: "individual" or "organization"
  const [activeTab, setActiveTab] = useState<"individual" | "organization">("individual");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Check if current user is SuperAdmin
  const isSuperAdmin = currentUser?.role === "SuperAdmin";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        accountType: activeTab, // "individual" or "organization"
      });

      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("isActive", statusFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }

      setUsers(data.users);
      setPagination({
        page: data.page,
        totalPages: data.totalPages,
        total: data.total,
        hasNextPage: data.hasNextPage,
        hasPrevPage: data.hasPrevPage,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, activeTab]);

  const handleDeleteClick = (user: UserData) => {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${deletingUser._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      toast.success("User deleted successfully!", {
        description: `${deletingUser.firstName} ${deletingUser.lastName} has been removed from the system.`,
      });
      fetchUsers();
    } catch (err: unknown) {
      toast.error("Failed to delete user", {
        description: err instanceof Error ? err.message : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingUser(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update user status");
      }

      setSuccess(`User ${!currentStatus ? "activated" : "deactivated"} successfully`);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update user status");
    }
  };

  const handleEditUser = (userId: string) => {
    router.push(`/s/admin/users/${userId}`);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "individual" | "organization");
    setCurrentPage(1);
    setSearch("");
    setStatusFilter("all");
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, activeTab, fetchUsers]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="font-Sora space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">
            {activeTab === "individual"
              ? "Manage individual user accounts"
              : "Manage organisation accounts"}
          </p>
        </div>
      </div>

      {/* Tabs for Individuals and Organisations */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Individuals
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Organisations
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === "individual" ? "Individuals" : "Organisations"} ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading {activeTab === "individual" ? "users" : "organisations"}...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p>No {activeTab === "individual" ? "users" : "organisations"} found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {activeTab === "individual" ? (
                        <User className="h-10 w-10 text-muted-foreground" />
                      ) : (
                        <Building2 className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {activeTab === "organization" && user.organization?.name ? (
                          <h3 className="font-medium truncate">{user.organization.name}</h3>
                        ) : (
                          <h3 className="font-medium truncate">
                            {user.firstName} {user.lastName}
                          </h3>
                        )}
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {activeTab === "organization" && user.organization?.type && (
                          <Badge variant="outline" className="capitalize">
                            {user.organization.type}
                          </Badge>
                        )}
                      </div>
                      {activeTab === "organization" && user.organization?.name && (
                        <p className="text-sm text-muted-foreground">
                          Contact: {user.firstName} {user.lastName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                      {user.phone && (
                        <p className="text-sm text-muted-foreground">
                          {user.phone}
                        </p>
                      )}
                      {activeTab === "organization" && user.organization?.registrationNumber && (
                        <p className="text-xs text-muted-foreground">
                          Reg: {user.organization.registrationNumber}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(user._id, user.isActive)}
                      className="flex items-center gap-1"
                    >
                      {user.isActive ? (
                        <>
                          <UserX className="h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditUser(user._id)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    {isSuperAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(user)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user &quot;{deletingUser?.firstName} {deletingUser?.lastName}&quot;?
              <br /><br />
              This will permanently remove their account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setDeletingUser(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
