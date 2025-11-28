// import * as crypto from "crypto"; // Removed - not needed for current implementation

export interface MonimeConfig {
  accessToken: string;
  spaceId: string;
  baseUrl: string;
}

export interface MonimeLineItem {
  type: "custom";
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

export interface MonimeCheckoutSessionResult {
  id: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  name?: string;
  orderNumber?: string;
  reference?: string;
  description?: string;
  redirectUrl: string;
  cancelUrl?: string;
  successUrl?: string;
  financialAccountId?: string;
  expireTime?: string;
  createTime?: string;
  metadata?: Record<string, string>;
  lineItems?: {
    data: MonimeLineItem[];
  };
}

export interface MonimeCheckoutSessionResponse {
  result: MonimeCheckoutSessionResult;
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

export interface MonimePayoutRequest {
  destination: {
    type: "momo" | "bank";
    providerId?: string; // e.g., "m17"/"m18" for mobile money, "slb001" for banks
    accountNumber?: string; // For bank transfers
    phoneNumber?: string; // For mobile money
    accountName?: string;
  };
  amount: {
    value: number; // Amount in minor units
    currency: string;
  };
  source: {
    financialAccountId: string;
  };
  metadata?: Record<string, unknown>;
}

export interface MonimePayoutResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  amount: {
    currency: string;
    value: number;
  };
  source: {
    financialAccountId: string;
  };
  destination: {
    type: "momo" | "bank";
    providerId?: string;
    accountNumber?: string;
    phoneNumber?: string;
    accountName?: string;
  };
  reference?: string;
  fees?: {
    total: number;
    breakdown: Record<string, number>;
  };
  failureReason?: string;
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface MonimeInternalTransferRequest {
  amount: {
    currency: string;
    value: number; // Amount in minor units
  };
  sourceFinancialAccount: {
    id: string;
  };
  destinationFinancialAccount: {
    id: string;
  };
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface MonimeInternalTransferResponse {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  amount: {
    currency: string;
    value: number;
  };
  sourceFinancialAccount: {
    id: string;
  };
  destinationFinancialAccount: {
    id: string;
  };
  description?: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

export interface MonimeWebhookEvent {
  id: string;
  name:
    | "checkout_session.completed"
    | "checkout_session.failed"
    | "payment.completed"
    | "payment.failed"
    | "payout.completed"
    | "payout.failed";
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
  data?:
    | MonimeWebhookCheckoutSessionData
    | MonimePayment
    | MonimePayoutResponse
    | Record<string, unknown>;
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
        // Log the full error response for debugging (with full depth)
        console.error(
          "Monime API error response:",
          JSON.stringify(
            {
              status: response.status,
              statusText: response.statusText,
              body: responseData,
            },
            null,
            2
          )
        );

        // Try to extract error message from various possible response formats
        const errorMessage =
          error.message ||
          (responseData as { error?: string }).error ||
          (responseData as { detail?: string }).detail ||
          JSON.stringify(responseData);

        throw new MonimeApiError(
          error.code || "API_ERROR",
          errorMessage,
          response.status,
          responseData // Pass full response as details for debugging
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
    const response = await this.makeRequest<
      MonimeApiResponse<MonimeCheckoutSessionResponse>
    >(
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
    const response = await this.makeRequest<
      MonimeApiResponse<MonimeFinancialAccountResponse>
    >(
      "/financial-accounts",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      idempotencyKey
    );
    return response.result;
  }

  async createPayout(
    request: MonimePayoutRequest,
    idempotencyKey?: string
  ): Promise<MonimePayoutResponse> {
    const response = await this.makeRequest<
      MonimeApiResponse<MonimePayoutResponse>
    >(
      "/payouts",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      idempotencyKey
    );

    return response.result;
  }

  async getPayout(payoutId: string): Promise<MonimePayoutResponse> {
    return this.makeRequest<MonimePayoutResponse>(`/payouts/${payoutId}`);
  }

  async createInternalTransfer(
    request: MonimeInternalTransferRequest,
    idempotencyKey?: string
  ): Promise<MonimeInternalTransferResponse> {
    const response = await this.makeRequest<
      MonimeApiResponse<MonimeInternalTransferResponse>
    >(
      "/internal-transfers",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
      idempotencyKey
    );
    return response.result;
  }

  async getInternalTransfer(
    transferId: string
  ): Promise<MonimeInternalTransferResponse> {
    return this.makeRequest<MonimeInternalTransferResponse>(
      `/internal-transfers/${transferId}`
    );
  }

  // Note: Webhook signature verification removed - check Monime docs for actual webhook authentication
  verifyWebhookSignature(): boolean {
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
    } catch {
      throw new Error(`Invalid MONIME_BASE_URL format: ${config.baseUrl}`);
    }

    return new MonimeService(config);
  }
}

// Lazy singleton instance for convenience
let _monimeService: MonimeService | null = null;

export const monimeService = {
  getInstance(): MonimeService {
    if (!_monimeService) {
      _monimeService = MonimeService.createService();
    }
    return _monimeService;
  },

  // Delegate methods to the singleton instance
  async createCheckoutSession(
    ...args: Parameters<MonimeService["createCheckoutSession"]>
  ) {
    return this.getInstance().createCheckoutSession(...args);
  },

  async getCheckoutSession(
    ...args: Parameters<MonimeService["getCheckoutSession"]>
  ) {
    return this.getInstance().getCheckoutSession(...args);
  },

  async getPayment(...args: Parameters<MonimeService["getPayment"]>) {
    return this.getInstance().getPayment(...args);
  },

  async createFinancialAccount(
    ...args: Parameters<MonimeService["createFinancialAccount"]>
  ) {
    return this.getInstance().createFinancialAccount(...args);
  },

  async createPayout(...args: Parameters<MonimeService["createPayout"]>) {
    return this.getInstance().createPayout(...args);
  },

  async getPayout(...args: Parameters<MonimeService["getPayout"]>) {
    return this.getInstance().getPayout(...args);
  },

  async createInternalTransfer(
    ...args: Parameters<MonimeService["createInternalTransfer"]>
  ) {
    return this.getInstance().createInternalTransfer(...args);
  },

  async getInternalTransfer(
    ...args: Parameters<MonimeService["getInternalTransfer"]>
  ) {
    return this.getInstance().getInternalTransfer(...args);
  },

  verifyWebhookSignature(
    ...args: Parameters<MonimeService["verifyWebhookSignature"]>
  ) {
    return this.getInstance().verifyWebhookSignature(...args);
  },

  parseWebhookPayload(
    ...args: Parameters<MonimeService["parseWebhookPayload"]>
  ) {
    return this.getInstance().parseWebhookPayload(...args);
  },
};

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
