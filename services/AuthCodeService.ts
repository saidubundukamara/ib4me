import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { authCodeRepository } from "../repositories";
import { IAuthCode } from "../models/AuthCode";

export interface CreateCodeInput {
  userId: string | mongoose.Types.ObjectId;
  purpose: IAuthCode["purpose"];
  channel: IAuthCode["channel"];
  ip?: string | null;
  userAgent?: string | null;
}

export interface ValidateCodeInput {
  userId: string | mongoose.Types.ObjectId;
  code: string;
  purpose: IAuthCode["purpose"];
  channel: IAuthCode["channel"];
}

export class AuthCodeService {
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MINUTES = 10;
  private readonly BCRYPT_ROUNDS = 10;

  /**
   * Generate a random numeric code
   */
  private generateNumericCode(length: number): string {
    const digits = "0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * 10)];
    }
    return code;
  }

  /**
   * Create a new verification code for a user
   * Returns the plain code (for sending via email/SMS) and the created auth code record
   */
  async createCode(
    input: CreateCodeInput
  ): Promise<{ code: string; authCode: IAuthCode }> {
    const userId =
      typeof input.userId === "string"
        ? new mongoose.Types.ObjectId(input.userId)
        : input.userId;

    // Generate a random 6-digit code
    const code = this.generateNumericCode(this.CODE_LENGTH);

    // Hash the code for storage
    const codeHash = await bcrypt.hash(code, this.BCRYPT_ROUNDS);

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(
      Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000
    );

    // Create the auth code record
    const authCode = await authCodeRepository.create({
      userId,
      channel: input.channel,
      purpose: input.purpose,
      codeHash,
      expiresAt,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    } as unknown as Partial<IAuthCode>);

    return { code, authCode };
  }

  /**
   * Validate a verification code
   * Returns the auth code record if valid, null otherwise
   */
  async validateCode(input: ValidateCodeInput): Promise<IAuthCode | null> {
    const userId =
      typeof input.userId === "string"
        ? new mongoose.Types.ObjectId(input.userId)
        : input.userId;

    // Find a valid (non-expired, non-consumed) auth code
    const authCode = await authCodeRepository.findValid(
      userId,
      input.purpose,
      input.channel
    );

    if (!authCode) {
      return null;
    }

    // Compare the provided code with the stored hash
    const isValid = await bcrypt.compare(String(input.code), authCode.codeHash);

    if (!isValid) {
      return null;
    }

    return authCode;
  }

  /**
   * Validate and consume a verification code in one operation
   * Returns true if the code was valid and consumed, false otherwise
   */
  async validateAndConsume(input: ValidateCodeInput): Promise<boolean> {
    const authCode = await this.validateCode(input);

    if (!authCode) {
      return false;
    }

    // Mark the code as consumed
    await this.consumeCode(String(authCode._id));

    return true;
  }

  /**
   * Mark an auth code as consumed (used)
   */
  async consumeCode(codeId: string): Promise<boolean> {
    return authCodeRepository.consume(codeId);
  }

  /**
   * Find a valid (non-expired, non-consumed) auth code
   */
  async findValidCode(
    userId: string | mongoose.Types.ObjectId,
    purpose: IAuthCode["purpose"],
    channel: IAuthCode["channel"]
  ): Promise<IAuthCode | null> {
    const userObjectId =
      typeof userId === "string"
        ? new mongoose.Types.ObjectId(userId)
        : userId;

    return authCodeRepository.findValid(userObjectId, purpose, channel);
  }
}

export const authCodeService = new AuthCodeService();
