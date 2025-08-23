import { userRepository } from "../repositories";
import { IUser } from "../models/User";

export class UserService {
  async createUser(
    params: Pick<IUser, "name"> &
      Partial<Pick<IUser, "email" | "phone" | "photoUrl">>
  ): Promise<IUser> {
    return userRepository.create({
      name: params.name,
      email: params.email ?? null,
      phone: params.phone ?? null,
      photoUrl: params.photoUrl ?? null,
    } as unknown as Partial<IUser>);
  }

  async getByEmail(email: string): Promise<IUser | null> {
    return userRepository.findByEmail(email);
  }

  async getByPhone(phone: string): Promise<IUser | null> {
    return userRepository.findByPhone(phone);
  }

  async softDelete(userId: string): Promise<boolean> {
    return userRepository.softDeleteById(userId);
  }
}

export const userService = new UserService();
