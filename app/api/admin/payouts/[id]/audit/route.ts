import { NextRequest, NextResponse } from "next/server";
import { auditLogService } from "@/services/AuditLogService";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid payout ID" },
        { status: 400 }
      );
    }

    // Get audit logs for this payout
    const auditLogs = await auditLogService.listByTarget(
      "payout",
      new mongoose.Types.ObjectId(id)
    );

    // Sort by date descending (most recent first)
    const sortedLogs = auditLogs.sort((a, b) => 
      new Date(b.at).getTime() - new Date(a.at).getTime()
    );

    return NextResponse.json({
      success: true,
      data: sortedLogs,
      message: "Audit logs retrieved successfully"
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