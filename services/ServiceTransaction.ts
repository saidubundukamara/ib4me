import mongoose from "mongoose";
import {
  startTransaction,
  commitTransaction,
  abortTransaction,
} from "../lib/db_transaction";

export type ServiceSession = mongoose.ClientSession | undefined;

export async function runInTransaction<T>(
  task: (session: mongoose.ClientSession) => Promise<T>,
  existingSession?: ServiceSession
): Promise<T> {
  if (existingSession) {
    return task(existingSession);
  }
  const session = await startTransaction();
  try {
    const result = await task(session);
    await commitTransaction(session);
    return result;
  } catch (error) {
    await abortTransaction(session);
    throw error;
  }
}
