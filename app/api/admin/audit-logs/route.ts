import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import { getAdminFromToken } from "@/lib/admin-auth-token";
import { auditLogService } from "@/services/AuditLogService";
import { AuditLogFilters, AuditLogListOptions } from "@/repositories/AuditLogRepository";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get admin user from token
    const adminUser = await getAdminFromToken();
    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized - Admin authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "at";
    const sortOrder = (searchParams.get("sortOrder") === "asc" ? "asc" : "desc") as "asc" | "desc";

    // Parse filter parameters
    const filters: AuditLogFilters = {};
    
    if (searchParams.get("action")) {
      filters.action = searchParams.get("action")!;
    }
    
    if (searchParams.get("targetType")) {
      filters.targetType = searchParams.get("targetType")!;
    }
    
    if (searchParams.get("targetId") && mongoose.Types.ObjectId.isValid(searchParams.get("targetId")!)) {
      filters.targetId = new mongoose.Types.ObjectId(searchParams.get("targetId")!);
    }
    
    if (searchParams.get("adminId") && mongoose.Types.ObjectId.isValid(searchParams.get("adminId")!)) {
      filters.adminId = new mongoose.Types.ObjectId(searchParams.get("adminId")!);
    }
    
    if (searchParams.get("dateFrom")) {
      const dateFrom = new Date(searchParams.get("dateFrom")!);
      if (!isNaN(dateFrom.getTime())) {
        filters.dateFrom = dateFrom;
      }
    }
    
    if (searchParams.get("dateTo")) {
      const dateTo = new Date(searchParams.get("dateTo")!);
      if (!isNaN(dateTo.getTime())) {
        // Set to end of day
        dateTo.setHours(23, 59, 59, 999);
        filters.dateTo = dateTo;
      }
    }
    
    if (searchParams.get("ip")) {
      filters.ip = searchParams.get("ip")!;
    }
    
    if (searchParams.get("search")) {
      filters.search = searchParams.get("search")!;
    }

    const options: AuditLogListOptions = {
      page,
      limit,
      sortBy,
      sortOrder
    };

    // Handle stats request
    if (searchParams.get("statsOnly") === "true") {
      const stats = await auditLogService.getStats(filters);
      return NextResponse.json({
        success: true,
        data: { stats }
      });
    }

    // Handle filter options request
    if (searchParams.get("filterOptions") === "true") {
      const filterOptions = await auditLogService.getFilterOptions();
      return NextResponse.json({
        success: true,
        data: { filterOptions }
      });
    }

    // Handle export request
    if (searchParams.get("export")) {
      const format = searchParams.get("export") as "csv" | "json";
      if (format !== "csv" && format !== "json") {
        return NextResponse.json(
          { error: "Invalid export format. Use 'csv' or 'json'." },
          { status: 400 }
        );
      }

      const exportLimit = parseInt(searchParams.get("exportLimit") || "10000");
      
      const exportData = await auditLogService.exportLogs({
        format,
        filters,
        limit: exportLimit
      });

      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      const contentType = format === "csv" 
        ? "text/csv" 
        : "application/json";

      return new NextResponse(exportData, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    // Get audit logs with filters and pagination
    const result = await auditLogService.listForAdmin(filters, options);
    
    // Format logs for display
    const formattedLogs = await auditLogService.formatLogsForDisplay(result.logs);

    return NextResponse.json({
      success: true,
      data: {
        logs: formattedLogs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          limit
        }
      }
    });

  } catch (error) {
    console.error("Error fetching audit logs:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch audit logs",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}