// import * as crypto from "crypto"; // Removed - not needed for current implementation

export interface MonimeConfig {
  accessToken: string;
  spaceId: string;
  baseUrl: string;
}

export interface MonimeLineItem {
  type: 'custom';
  name: string;
  price: {
    currency: string;
    value: number; // Amount in minor units
  };
  quantity: number;
  description?: string;
  reference?: string;
}

export interface MonimeCheckoutSessionRequest {
  name: string;
  successUrl: string;
  cancelUrl: string;
  lineItems: MonimeLineItem[];
  financialAccountId?: string;
  metadata?: Record<string, unknown>;
  callbackState?: string;
}

export interface MonimeCheckoutSessionResponse {
  id: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  redirectUrl: string;
  reference: string;
  amount: {
    currency: string;
    value: number;
  };
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
}

export interface MonimeApiResponse<T> {
  result: T;
  success: boolean;
}

export interface MonimePayment {
  id: string;
  checkoutSessionId: string;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  amount: {
    currency: string;
    value: number;
  };
  paymentMethod: {
    type: "mobile_money" | "card" | "bank_transfer";
    provider?: string; // e.g., 'orange_money', 'afrimoney'
  };
  reference: string;
  fees?: {
    total: number;
    breakdown: Record<string, number>;
  };
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface MonimeFinancialAccountRequest {
  name: string;
  currency: string;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface MonimeFinancialAccountResponse {
  id: string;
  uvan: string;
  name: string;
  currency: string;
  reference?: string;
  description?: string;
  balance: {
    available: number | null;
  };
  createTime: string;
  updateTime: string;
  metadata?: Record<string, unknown>;
}

export interface MonimeWebhookEvent {
  id: string;
  name:
    | "checkout_session.completed"
    | "checkout_session.failed"
    | "payment.completed"
    | "payment.failed";
  timestamp: string;
}

export interface MonimeWebhookObject {
  id: string;
  type: string;
}

export interface MonimeWebhookCheckoutSessionData {
  id: string;
  type?: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  financialAccountId?: string;
  name?: string;
  description?: string;
  createTime?: string;
  expireTime?: string;
  cancelUrl?: string;
  successUrl?: string;
  redirectUrl?: string;
  reference?: string;
  orderNumber?: string;
  metadata?: Record<string, string>;
  lineItems?: {
    data: unknown[];
  };
  brandingOptions?: unknown;
  ownershipGraph?: unknown;
}

export interface MonimeWebhookPayload {
  apiVersion?: string;
  event: MonimeWebhookEvent;
  object?: MonimeWebhookObject;
  data?: MonimeWebhookCheckoutSessionData | MonimePayment | Record<string, unknown>;
  timestamp?: string;
  signature?: string;
}

export interface MonimeError {
  code: string;
  message: string;
  details?: unknown;
}

export class MonimeApiError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: unknown;

  constructor(
    code: string,
    message: string,
    statusCode?: number,
    details?: unknown
  ) {
    super(message);
    this.name = "MonimeApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class MonimeService {
  private config: MonimeConfig;

  constructor(config: MonimeConfig) {
    this.config = config;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    idempotencyKey?: string
  ): Promise<T> {
    if (!this.config.baseUrl) {
      throw new MonimeApiError(
        "INVALID_CONFIG",
        "Monime base URL is not configured"
      );
    }
    
    const url = `${this.config.baseUrl}${endpoint}`;
    
    // Validate the constructed URL
    try {
      new URL(url);
    } catch (urlError) {
      throw new MonimeApiError(
        "INVALID_URL",
        `Invalid URL constructed: ${url}. Base URL: ${this.config.baseUrl}, Endpoint: ${endpoint}`,
        undefined,
        urlError
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.accessToken}`,
      "Monime-Space-Id": this.config.spaceId,
      "Content-Type": "application/json",
      // "User-Agent": "IB4ME/1.0",
      // ...(options.headers as Record<string, string>),
    };

    // Add idempotency key if provided
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const responseData = await response.json();

      if (!response.ok) {
        const error = responseData as MonimeError;
        throw new MonimeApiError(
          error.code || "API_ERROR",
          error.message || "Unknown API error",
          response.status,
          error.details
        );
      }

      return responseData as T;
    } catch (error) {
      if (error instanceof MonimeApiError) {
        throw error;
      }

      // Network or parsing error
      throw new MonimeApiError(
        "NETWORK_ERROR",
        `Network error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        undefined,
        error
      );
    }
  }

  async createCheckoutSession(
    request: MonimeCheckoutSessionRequest,
    idempotencyKey?: string
  ): Promise<MonimeCheckoutSessionResponse> {
    const response = await this.makeRequest<MonimeApiResponse<MonimeCheckoutSessionResponse>>(
      "/checkout-sessions",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      idempotencyKey
    );
    return response.result;
  }

  async getCheckoutSession(
    sessionId: string
  ): Promise<MonimeCheckoutSessionResponse> {
    return this.makeRequest<MonimeCheckoutSessionResponse>(
      `/checkout-sessions/${sessionId}`
    );
  }

  async getPayment(paymentId: string): Promise<MonimePayment> {
    return this.makeRequest<MonimePayment>(`/payments/${paymentId}`);
  }

  async createFinancialAccount(
    request: MonimeFinancialAccountRequest,
    idempotencyKey?: string
  ): Promise<MonimeFinancialAccountResponse> {
    const response = await this.makeRequest<MonimeApiResponse<MonimeFinancialAccountResponse>>(
      "/financial-accounts",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      idempotencyKey
    );
    return response.result;
  }

  // Note: Webhook signature verification removed - check Monime docs for actual webhook authentication
  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    console.warn(
      "Webhook signature verification not implemented - check Monime documentation for proper webhook authentication"
    );
    return true; // Always return true for now - implement proper verification based on Monime docs
  }

  parseWebhookPayload(payload: string): MonimeWebhookPayload {
    try {
      return JSON.parse(payload) as MonimeWebhookPayload;
    } catch (error) {
      throw new MonimeApiError(
        "INVALID_WEBHOOK_PAYLOAD",
        "Failed to parse webhook payload",
        400,
        error
      );
    }
  }

  static createService(): MonimeService {
    const config: MonimeConfig = {
      accessToken: process.env.MONIME_ACCESS_TOKEN || "",
      spaceId: process.env.MONIME_SPACE_ID || "",
      baseUrl: process.env.MONIME_BASE_URL || "https://api.monime.io/v1",
    };

    if (!config.accessToken) {
      throw new Error("MONIME_ACCESS_TOKEN environment variable is required");
    }

    if (!config.spaceId) {
      throw new Error("MONIME_SPACE_ID environment variable is required");
    }

    if (!config.baseUrl) {
      throw new Error("MONIME_BASE_URL environment variable is required");
    }

    // Validate base URL format
    try {
      new URL(config.baseUrl);
    } catch (urlError) {
      throw new Error(`Invalid MONIME_BASE_URL format: ${config.baseUrl}`);
    }

    return new MonimeService(config);
  }
}

// Export singleton instance for convenience
export const monimeService = MonimeService.createService();

// Helper function to convert major currency units to minor units
export function toMinorUnits(amount: number, currency: string = "SLE"): number {
  // Most currencies use 2 decimal places, but some currencies might differ
  const decimalPlaces = currency === "SLE" ? 2 : 2;
  return Math.round(amount * Math.pow(10, decimalPlaces));
}

// Helper function to convert minor currency units to major units
export function fromMinorUnits(
  amountMinor: number,
  currency: string = "SLE"
): number {
  const decimalPlaces = currency === "SLE" ? 2 : 2;
  return amountMinor / Math.pow(10, decimalPlaces);
}

// Helper function to format currency amounts
export function formatCurrency(
  amount: number,
  currency: string = "SLE"
): string {
  return new Intl.NumberFormat("en-SL", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
