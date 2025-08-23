import { BaseRepository } from "./BaseRepository";
import User, { IUser } from "../models/User";

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email } as never);
  }

  async findByPhone(phone: string): Promise<IUser | null> {
    return this.findOne({ phone } as never);
  }

  async softDeleteById(id: string): Promise<boolean> {
    const updated = await this.updateById(id, {
      $set: { deletedAt: new Date() },
    } as never);
    return Boolean(updated);
  }
}

export const userRepository = new UserRepository();
