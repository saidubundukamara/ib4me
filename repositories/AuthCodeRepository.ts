import mongoose from "mongoose";
import { BaseRepository, RepositorySession } from "./BaseRepository";
import AuthCode, { IAuthCode } from "../models/AuthCode";

export class AuthCodeRepository extends BaseRepository<IAuthCode> {
  constructor() {
    super(AuthCode);
  }

  async findValid(
    userId: mongoose.Types.ObjectId,
    purpose: IAuthCode["purpose"],
    channel: IAuthCode["channel"],
    now: Date = new Date()
  ): Promise<IAuthCode | null> {
    return this.findOne({
      userId,
      purpose,
      channel,
      expiresAt: { $gt: now },
      consumedAt: null,
    } as never);
  }

  async consume(codeId: string, session?: RepositorySession): Promise<boolean> {
    const res = await this.updateById(
      codeId,
      { $set: { consumedAt: new Date() } } as never,
      session
    );
    return Boolean(res);
  }
}

export const authCodeRepository = new AuthCodeRepository();
