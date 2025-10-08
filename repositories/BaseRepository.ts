import mongoose, {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from "mongoose";
import { ensureConnection } from "../lib/db";

export type RepositorySession = mongoose.ClientSession | null | undefined;

export class BaseRepository<T extends mongoose.Document> {
  protected readonly model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  get mongoModel() {
    return this.model;
  }

  protected async ensureConnection(): Promise<void> {
    await ensureConnection();
  }

  private castSession(
    session?: RepositorySession
  ): mongoose.ClientSession | undefined {
    return session ?? undefined;
  }

  async findById(
    id: string,
    options?: { projection?: ProjectionType<T>; query?: QueryOptions<T> }
  ): Promise<T | null> {
    await this.ensureConnection();
    return this.model
      .findById(id, options?.projection, options?.query ?? undefined)
      .exec();
  }

  async findOne(
    filter: FilterQuery<T>,
    options?: { projection?: ProjectionType<T>; query?: QueryOptions<T> }
  ): Promise<T | null> {
    await this.ensureConnection();
    return this.model
      .findOne(filter, options?.projection, options?.query ?? undefined)
      .exec();
  }

  async findMany(
    filter: FilterQuery<T>,
    options?: { projection?: ProjectionType<T>; query?: QueryOptions<T> }
  ): Promise<T[]> {
    await this.ensureConnection();
    return this.model
      .find(filter, options?.projection, options?.query ?? undefined)
      .exec();
  }

  async create(data: Partial<T>, session?: RepositorySession): Promise<T> {
    await this.ensureConnection();
    const [doc] = await this.model.create([data], {
      session: this.castSession(session),
    });
    return doc;
  }

  async updateById(
    id: string,
    update: UpdateQuery<T>,
    session?: RepositorySession
  ): Promise<T | null> {
    await this.ensureConnection();
    return this.model
      .findByIdAndUpdate(id, update, {
        new: true,
        session: this.castSession(session),
      })
      .exec();
  }

  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    session?: RepositorySession
  ): Promise<{
    matchedCount: number;
    modifiedCount: number;
    acknowledged: boolean;
  }> {
    await this.ensureConnection();
    const res = await this.model
      .updateOne(filter, update, { session: this.castSession(session) })
      .exec();
    return {
      matchedCount: res.matchedCount,
      modifiedCount: res.modifiedCount,
      acknowledged: res.acknowledged,
    };
  }

  async deleteById(id: string, session?: RepositorySession): Promise<boolean> {
    await this.ensureConnection();
    const res = await this.model
      .deleteOne({ _id: id } as FilterQuery<T>, {
        session: this.castSession(session),
      })
      .exec();
    return res.deletedCount === 1;
  }

  async count(filter: FilterQuery<T>): Promise<number> {
    await this.ensureConnection();
    return this.model.countDocuments(filter).exec();
  }
}
