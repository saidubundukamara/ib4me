"use client";

import { useState, useEffect, useCallback } from "react";
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
  Tag,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

// Available icon options for categories
const ICON_OPTIONS = [
  { value: "MdOutlineHealthAndSafety", label: "Health & Safety" },
  { value: "FaHeartbeat", label: "Heartbeat" },
  { value: "GiMedicines", label: "Medicines" },
  { value: "TfiSupport", label: "Support" },
  { value: "MdOutlineMedicalServices", label: "Medical Services" },
  { value: "MdOutlineDeviceThermostat", label: "Device/Equipment" },
  { value: "RiMentalHealthLine", label: "Mental Health" },
  { value: "FaResearchgate", label: "Research" },
  { value: "RiUserCommunityFill", label: "Community" },
];

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  total: number;
  active: number;
  inactive: number;
  recentlyAdded: number;
}

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // Filters and pagination
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    icon: "",
    displayOrder: 0,
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({ isOpen: false, category: null });

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sortBy: "displayOrder",
        sortOrder: "asc",
        ...(search && { search }),
        ...(activeFilter !== "all" && { isActive: activeFilter }),
      });

      const response = await fetch(`/api/admin/categories?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data.categories);
        setTotalPages(data.data.totalPages);
        setTotal(data.data.total);

        // Calculate analytics from response
        const allCategories = data.data.categories;
        const activeCount = allCategories.filter(
          (c: Category) => c.isActive
        ).length;
        setAnalytics({
          total: data.data.total,
          active: activeCount,
          inactive: data.data.total - activeCount,
          recentlyAdded: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, activeFilter]);

  // Handle form submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory._id}`
        : "/api/admin/categories";

      const response = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingCategory
            ? "Category updated successfully"
            : "Category created successfully"
        );
        setFormOpen(false);
        setEditingCategory(null);
        resetForm();
        await fetchCategories();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save category");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteDialog.category) return;

    try {
      setUpdating(deleteDialog.category._id);

      const response = await fetch(
        `/api/admin/categories/${deleteDialog.category._id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        toast.success("Category deleted successfully");
        await fetchCategories();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to delete category");
    } finally {
      setUpdating(null);
      setDeleteDialog({ isOpen: false, category: null });
    }
  };

  // Handle active toggle
  const handleToggleActive = async (category: Category) => {
    try {
      setUpdating(category._id);

      const response = await fetch(
        `/api/admin/categories/${category._id}/toggle-active`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        toast.success(
          `Category ${category.isActive ? "deactivated" : "activated"} successfully`
        );
        await fetchCategories();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to toggle active status");
      }
    } catch (error) {
      console.error("Error toggling active status:", error);
      toast.error("Failed to toggle active status");
    } finally {
      setUpdating(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "",
      displayOrder: 0,
      isActive: true,
    });
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    });
    setFormOpen(true);
  };

  const openCreateForm = () => {
    setEditingCategory(null);
    resetForm();
    setFormOpen(true);
  };

  useEffect(() => {
    fetchCategories();
  }, [search, activeFilter, currentPage, fetchCategories]);

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "success" : "secondary"}>
        {isActive ? (
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

  const getIconLabel = (iconValue?: string) => {
    if (!iconValue) return "No icon";
    const option = ICON_OPTIONS.find((o) => o.value === iconValue);
    return option ? option.label : iconValue;
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
          <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage campaign categories for the platform
          </p>
        </div>

        <Button onClick={openCreateForm}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics.active}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Inactive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {analytics.inactive}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {analytics.active}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setActiveFilter("all");
                setCurrentPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Categories ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse h-16 bg-gray-200 rounded"
                ></div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No categories found
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center">
                          <Tag className="w-5 h-5 text-gray-400 mr-2" />
                          <h3 className="font-medium text-gray-900">
                            {category.name}
                          </h3>
                        </div>
                        {getStatusBadge(category.isActive)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="text-gray-500">Slug: {category.slug}</p>
                        </div>
                        <div className="flex items-center">
                          <ArrowUpDown className="w-4 h-4 mr-1" />
                          <p>Order: {category.displayOrder}</p>
                        </div>
                        <div>
                          <p>Icon: {getIconLabel(category.icon)}</p>
                        </div>
                      </div>

                      {category.description && (
                        <p className="mt-2 text-sm text-gray-500">
                          {category.description}
                        </p>
                      )}

                      <div className="mt-2 text-xs text-gray-500">
                        Created:{" "}
                        {new Date(category.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant={category.isActive ? "outline" : "default"}
                        disabled={updating === category._id}
                        onClick={() => handleToggleActive(category)}
                      >
                        {updating === category._id
                          ? "..."
                          : category.isActive
                            ? "Deactivate"
                            : "Activate"}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditForm(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updating === category._id}
                        onClick={() =>
                          setDeleteDialog({ isOpen: true, category })
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
              {editingCategory ? "Edit Category" : "Add Category"}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) =>
                    setFormData({ ...formData, icon: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      displayOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter display order"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="mr-2"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700"
                >
                  Active (visible in campaign form)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormOpen(false);
                    setEditingCategory(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading
                    ? "Saving..."
                    : editingCategory
                      ? "Update"
                      : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialog.isOpen && deleteDialog.category && (
        <AlertDialog
          open={deleteDialog.isOpen}
          onOpenChange={(open) =>
            !open && setDeleteDialog({ isOpen: false, category: null })
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;
                {deleteDialog.category.name}&rdquo;? This action cannot be
                undone.
                {deleteDialog.category.isActive && (
                  <p className="text-orange-600 mt-2 font-medium">
                    Warning: This is an active category. Deleting it may affect
                    existing campaigns.
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
                {updating === deleteDialog.category._id
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
