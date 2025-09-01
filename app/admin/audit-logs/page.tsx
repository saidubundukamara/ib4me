"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Eye, 
  Download,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Activity,
  AlertTriangle,
  FileText,
  Copy,
  X
} from "lucide-react";

interface FormattedAuditLog {
  id: string;
  timestamp: string;
  admin: {
    id: string;
    name?: string;
    email?: string;
  } | null;
  action: {
    type: string;
    description: string;
    category: string;
  };
  target: {
    type: string;
    id?: string;
    description: string;
  };
  changes?: Record<string, unknown>;
  metadata: {
    ip?: string;
    userAgent?: string;
  };
}

interface AuditLogStats {
  totalLogs: number;
  uniqueAdmins: number;
  mostActiveAdmin: {
    userId: string;
    name?: string;
    email?: string;
    actionCount: number;
  } | null;
  mostCommonAction: {
    action: string;
    count: number;
  } | null;
  recentActivityCount: number;
}

interface FilterOptions {
  actionTypes: string[];
  targetTypes: string[];
  adminUsers: Array<{ _id: string; name?: string; email: string; }>;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<FormattedAuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit] = useState(50);
  
  // Filters
  const [filters, setFilters] = useState({
    action: "",
    targetType: "",
    adminId: "",
    dateFrom: "",
    dateTo: "",
    ip: "",
    search: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Selected log for details modal
  const [selectedLog, setSelectedLog] = useState<FormattedAuditLog | null>(null);

  const fetchAuditLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: "at",
        sortOrder: "desc"
      });

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.logs);
        setCurrentPage(data.data.pagination.currentPage);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCount(data.data.pagination.totalCount);
      } else {
        throw new Error(data.error || "Failed to fetch audit logs");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch audit logs");
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  }, [filters, limit]);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        statsOnly: "true"
      });

      // Add filters to stats request
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [filters]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/audit-logs?filterOptions=true`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFilterOptions(data.data.filterOptions);
        }
      }
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs(1);
    fetchStats();
  }, [fetchAuditLogs, fetchStats]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      action: "",
      targetType: "",
      adminId: "",
      dateFrom: "",
      dateTo: "",
      ip: "",
      search: ""
    });
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchAuditLogs(1);
    fetchStats();
    setShowFilters(false);
  };

  const exportLogs = async (format: "csv" | "json") => {
    try {
      const params = new URLSearchParams({
        export: format,
        exportLimit: "10000"
      });

      // Add filters to export request
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success(`Audit logs exported as ${format.toUpperCase()}`);
      } else {
        throw new Error("Failed to export logs");
      }
    } catch {
      toast.error("Failed to export logs");
    }
  };

  const getBadgeVariant = (category: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (category) {
      case "campaign": return "default";
      case "payout": return "secondary";
      case "donation": return "outline";
      default: return "destructive";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const truncateUserAgent = (userAgent: string, maxLength = 50) => {
    if (!userAgent) return "Unknown";
    return userAgent.length > maxLength 
      ? `${userAgent.substring(0, maxLength)}...` 
      : userAgent;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track admin and system actions for compliance and monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            onClick={() => fetchAuditLogs(currentPage)}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            onClick={() => exportLogs("csv")}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
              <p className="text-xs text-muted-foreground">
                All audit entries
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueAdmins}</div>
              <p className="text-xs text-muted-foreground">
                Unique administrators
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Active</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.mostActiveAdmin?.actionCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.mostActiveAdmin?.name || stats.mostActiveAdmin?.email || "No admin"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentActivityCount}</div>
              <p className="text-xs text-muted-foreground">
                Last 24 hours
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Action Filter */}
              <div>
                <label className="text-sm font-medium mb-1 block">Action</label>
                <Select 
                  value={filters.action} 
                  onValueChange={(value) => handleFilterChange("action", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    <SelectItem value="campaign.*">Campaign actions</SelectItem>
                    <SelectItem value="payout.*">Payout actions</SelectItem>
                    <SelectItem value="donation.*">Donation actions</SelectItem>
                    <SelectItem value="user.*">User actions</SelectItem>
                    {filterOptions?.actionTypes.map(action => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Type Filter */}
              <div>
                <label className="text-sm font-medium mb-1 block">Target Type</label>
                <Select 
                  value={filters.targetType} 
                  onValueChange={(value) => handleFilterChange("targetType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {filterOptions?.targetTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Filter */}
              <div>
                <label className="text-sm font-medium mb-1 block">Admin User</label>
                <Select 
                  value={filters.adminId} 
                  onValueChange={(value) => handleFilterChange("adminId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All admins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All admins</SelectItem>
                    {filterOptions?.adminUsers.map(admin => (
                      <SelectItem key={admin._id} value={admin._id}>
                        {admin.name || admin.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div>
                <label className="text-sm font-medium mb-1 block">From Date</label>
                <Input
                  type="datetime-local"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="text-sm font-medium mb-1 block">To Date</label>
                <Input
                  type="datetime-local"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                />
              </div>

              {/* IP Address */}
              <div>
                <label className="text-sm font-medium mb-1 block">IP Address</label>
                <Input
                  placeholder="Search IP address"
                  value={filters.ip}
                  onChange={(e) => handleFilterChange("ip", e.target.value)}
                />
              </div>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-1 block">Search</label>
              <Input
                placeholder="Search actions, types, IP addresses, or reasons..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={applyFilters}>
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Audit Logs ({totalCount} total)</span>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading audit logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>User Agent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {log.admin?.name || "Unknown"}
                          </div>
                          <div className="text-muted-foreground">
                            {log.admin?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={getBadgeVariant(log.action.category)}>
                            {log.action.category}
                          </Badge>
                          <div className="text-sm">{log.action.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.action.type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{log.target.description}</div>
                          <div className="text-muted-foreground">
                            {log.target.type}
                            {log.target.id && ` (${log.target.id.slice(-8)})`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.metadata.ip || "Unknown"}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs">
                        <div title={log.metadata.userAgent}>
                          {truncateUserAgent(log.metadata.userAgent || "")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Audit Log Details</DialogTitle>
                              <DialogDescription>
                                Full details for audit log entry
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Timestamp</label>
                                    <div className="text-sm p-2 bg-muted rounded">
                                      {formatDate(selectedLog.timestamp)}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Admin User</label>
                                    <div className="text-sm p-2 bg-muted rounded">
                                      {selectedLog.admin?.name || "Unknown"} ({selectedLog.admin?.email})
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Action</label>
                                  <div className="text-sm p-2 bg-muted rounded flex items-center gap-2">
                                    <Badge variant={getBadgeVariant(selectedLog.action.category)}>
                                      {selectedLog.action.category}
                                    </Badge>
                                    <span>{selectedLog.action.description}</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(selectedLog.action.type)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">Target</label>
                                  <div className="text-sm p-2 bg-muted rounded">
                                    {selectedLog.target.description}
                                    {selectedLog.target.id && (
                                      <div className="text-muted-foreground">
                                        ID: {selectedLog.target.id}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">IP Address</label>
                                    <div className="text-sm p-2 bg-muted rounded flex items-center gap-2">
                                      {selectedLog.metadata.ip || "Unknown"}
                                      {selectedLog.metadata.ip && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => copyToClipboard(selectedLog.metadata.ip!)}
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">User Agent</label>
                                    <div className="text-sm p-2 bg-muted rounded">
                                      <div title={selectedLog.metadata.userAgent}>
                                        {truncateUserAgent(selectedLog.metadata.userAgent || "", 100)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {selectedLog.changes && (
                                  <div>
                                    <label className="text-sm font-medium">Changes</label>
                                    <div className="text-sm p-3 bg-muted rounded">
                                      <pre className="whitespace-pre-wrap">
                                        {JSON.stringify(selectedLog.changes, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {logs.length} of {totalCount} entries
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      fetchAuditLogs(newPage);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      fetchAuditLogs(newPage);
                    }}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}