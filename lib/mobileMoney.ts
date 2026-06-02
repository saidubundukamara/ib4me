import { lookupMobileOperator, isLookupError } from "mobile-operator-lookup";
import { MonimeApiError, monimeService } from "@/lib/monime";

/**
 * Thrown when a phone number can't be resolved to a supported Sierra Leone
 * mobile-money operator. Callers translate this into a 400 with a friendly message.
 */
export class InvalidMobileNumberError extends Error {
  constructor(
    message = "Phone number is not a valid Sierra Leone mobile money number"
  ) {
    super(message);
    this.name = "InvalidMobileNumberError";
  }
}

export interface ResolvedMobileOperator {
  /** Monime provider id — "m17" (Orange Money), "m18" (AfriMoney). */
  providerId: string;
  /** Human-readable operator name, e.g. "Orange Money". */
  providerName: string;
  /** International number with country code, no plus — e.g. "23276123456".
   *  This is the form Monime expects for provider-KYC accountId and payout phoneNumber. */
  msisdn: string;
}

/**
 * Normalize a user-entered mobile number to its E.164-ish `+232…` form so the
 * lookup package can classify it. Accepts inputs with or without the country
 * code / leading zero.
 */
function normalizeToInternational(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  // Strip a leading 0 (local dialing) and any existing 232 country code.
  const local = digits.replace(/^232/, "").replace(/^0/, "");
  return `+232${local}`;
}

/**
 * Resolve a Sierra Leone mobile number to its mobile-money operator using
 * `mobile-operator-lookup`. Single source of truth for operator detection —
 * used by the withdrawal KYC lookup and the payout creation path so the Monime
 * `providerId` is always correct (Orange vs Africell).
 *
 * @throws {InvalidMobileNumberError} when the number isn't a supported SL momo number.
 */
export function resolveMobileOperator(raw: string): ResolvedMobileOperator {
  const international = normalizeToInternational(raw);
  const result = lookupMobileOperator(international);

  if (isLookupError(result) || !result.monime_code) {
    throw new InvalidMobileNumberError();
  }

  return {
    providerId: result.monime_code,
    providerName: result.mobile_money || result.company,
    // Country code retained (no plus) — Monime provider-KYC/payout expect "232…".
    msisdn: international.replace(/^\+/, ""),
  };
}

/**
 * Thrown when the number is valid but not registered on the resolved provider's
 * mobile-money wallet (Monime returns 404).
 */
export class UnregisteredMobileMoneyError extends Error {
  constructor(
    message = "This number is not registered on any supported mobile money wallet"
  ) {
    super(message);
    this.name = "UnregisteredMobileMoneyError";
  }
}

/** Thrown when the KYC lookup fails for a reason other than a bad/unregistered number. */
export class KycLookupError extends Error {
  constructor(
    message = "Unable to verify this number. Please check it and try again."
  ) {
    super(message);
    this.name = "KycLookupError";
  }
}

export interface MobileMoneyHolder {
  holderName: string;
  providerName: string;
  providerId: string;
  msisdn: string;
}

/**
 * Resolve the operator for a mobile number and look up the registered holder
 * name via Monime provider-KYC. Single entry point for the withdrawal KYC gate —
 * used by both the lookup endpoint and the authoritative payout-creation check.
 *
 * @throws {InvalidMobileNumberError} unsupported/malformed number
 * @throws {UnregisteredMobileMoneyError} number not registered on the wallet (404)
 * @throws {KycLookupError} any other lookup failure
 */
export async function lookupMobileMoneyHolder(
  raw: string
): Promise<MobileMoneyHolder> {
  const { providerId, providerName, msisdn } = resolveMobileOperator(raw);

  try {
    const kyc = await monimeService.getProviderKyc(providerId, msisdn);
    return {
      holderName: kyc.account.holderName,
      providerName: kyc.provider?.name || providerName,
      providerId,
      msisdn,
    };
  } catch (error) {
    if (error instanceof MonimeApiError && error.statusCode === 404) {
      throw new UnregisteredMobileMoneyError();
    }
    throw new KycLookupError();
  }
}
