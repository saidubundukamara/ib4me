import mongoose from "mongoose";
import { auditLogRepository, AuditLogFilters, AuditLogListOptions, AuditLogListResult, AuditLogStats } from "../repositories/AuditLogRepository";
import { IAuditLog } from "../models/AuditLog";

export interface ExportAuditLogsOptions {
  format: 'csv' | 'json';
  filters?: AuditLogFilters;
  limit?: number;
}

export interface FormattedAuditLog {
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

export class AuditLogService {
  async record(
    entry: Pick<IAuditLog, "actor" | "action" | "target"> &
      Partial<Pick<IAuditLog, "diff" | "ip" | "userAgent">>
  ): Promise<IAuditLog> {
    return auditLogRepository.create({
      actor: entry.actor,
      action: entry.action,
      target: entry.target,
      diff: entry.diff ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
      at: new Date(),
    } as unknown as Partial<IAuditLog>);
  }

  async listByTarget(
    type: string,
    id?: mongoose.Types.ObjectId | null
  ): Promise<IAuditLog[]> {
    return auditLogRepository.listByTarget(type, id);
  }

  async listForAdmin(
    filters: AuditLogFilters = {},
    options: AuditLogListOptions
  ): Promise<AuditLogListResult> {
    return auditLogRepository.listForAdmin(filters, options);
  }

  async getStats(filters: AuditLogFilters = {}): Promise<AuditLogStats> {
    return auditLogRepository.getStats(filters);
  }

  async getFilterOptions(): Promise<{
    actionTypes: string[];
    targetTypes: string[];
    adminUsers: Array<{ _id: mongoose.Types.ObjectId; name?: string; email: string; }>;
  }> {
    const [actionTypes, targetTypes, adminUsers] = await Promise.all([
      auditLogRepository.getActionTypes(),
      auditLogRepository.getTargetTypes(),
      auditLogRepository.getAdminUsers()
    ]);

    return {
      actionTypes,
      targetTypes,
      adminUsers
    };
  }

  async formatLogsForDisplay(logs: IAuditLog[]): Promise<FormattedAuditLog[]> {
    return logs.map(log => this.formatLogForDisplay(log));
  }

  formatLogForDisplay(log: IAuditLog): FormattedAuditLog {
    return {
      id: log._id?.toString() || '',
      timestamp: log.at.toISOString(),
      admin: log.actor.userId ? {
        id: log.actor.userId.toString(),
        name: (log.actor as any).userId?.name,
        email: (log.actor as any).userId?.email
      } : null,
      action: {
        type: log.action,
        description: this.getActionDescription(log.action),
        category: this.getActionCategory(log.action)
      },
      target: {
        type: log.target.type,
        id: log.target.id?.toString(),
        description: this.getTargetDescription(log.target.type, log.target.id?.toString())
      },
      changes: log.diff || undefined,
      metadata: {
        ip: log.ip || undefined,
        userAgent: log.userAgent || undefined
      }
    };
  }

  private getActionDescription(action: string): string {
    const actionMap: Record<string, string> = {
      'campaign.status_updated': 'Campaign status changed',
      'campaign.verification_updated': 'Campaign verification status updated',
      'campaign.created': 'New campaign created',
      'campaign.updated': 'Campaign details updated',
      'payout.approved': 'Payout request approved',
      'payout.rejected': 'Payout request rejected',
      'payout.created': 'Payout request created',
      'donation.flagged_for_review': 'Donation flagged for review',
      'donation.unflagged': 'Donation unflagged',
      'donation.refunded': 'Donation refunded',
      'user.created': 'User account created',
      'user.updated': 'User account updated',
      'user.status_changed': 'User account status changed',
      'hospital.verified': 'Hospital verified',
      'hospital.unverified': 'Hospital unverified',
      'settings.updated': 'System settings updated'
    };

    return actionMap[action] || action.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private getActionCategory(action: string): string {
    if (action.startsWith('campaign.')) return 'campaign';
    if (action.startsWith('payout.')) return 'payout';
    if (action.startsWith('donation.')) return 'donation';
    if (action.startsWith('user.')) return 'user';
    if (action.startsWith('hospital.')) return 'hospital';
    if (action.startsWith('settings.')) return 'settings';
    return 'other';
  }

  private getTargetDescription(type: string, id?: string): string {
    const typeDescriptions: Record<string, string> = {
      'campaign': 'Medical Campaign',
      'payout': 'Payout Request',
      'donation': 'Donation',
      'user': 'User Account',
      'hospital': 'Hospital',
      'settings': 'System Settings'
    };

    const baseDesc = typeDescriptions[type] || type;
    return id ? `${baseDesc} (${id.slice(-8)})` : baseDesc;
  }

  async exportLogs(options: ExportAuditLogsOptions): Promise<string> {
    const { format, filters = {}, limit = 10000 } = options;
    
    const listOptions: AuditLogListOptions = {
      page: 1,
      limit,
      sortBy: 'at',
      sortOrder: 'desc'
    };

    const result = await this.listForAdmin(filters, listOptions);
    const formattedLogs = await this.formatLogsForDisplay(result.logs);

    if (format === 'csv') {
      return this.formatLogsAsCSV(formattedLogs);
    } else {
      return JSON.stringify(formattedLogs, null, 2);
    }
  }

  private formatLogsAsCSV(logs: FormattedAuditLog[]): string {
    const headers = [
      'ID',
      'Timestamp',
      'Admin Name',
      'Admin Email',
      'Action',
      'Action Description',
      'Target Type',
      'Target ID',
      'IP Address',
      'Changes'
    ];

    const rows = logs.map(log => [
      log.id,
      new Date(log.timestamp).toLocaleString(),
      log.admin?.name || 'Unknown',
      log.admin?.email || 'Unknown',
      log.action.type,
      log.action.description,
      log.target.type,
      log.target.id || '',
      log.metadata.ip || '',
      log.changes ? JSON.stringify(log.changes).replace(/"/g, '""') : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

export const auditLogService = new AuditLogService();
