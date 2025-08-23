import mongoose from "mongoose";

export async function startTransaction(): Promise<mongoose.ClientSession> {
  const session = await mongoose.startSession();
  session.startTransaction();
  return session;
}

// Function to commit a transaction
export async function commitTransaction(
  session: mongoose.ClientSession
): Promise<void> {
  await session.commitTransaction();
  session.endSession();
}

// Function to abort a transaction
export async function abortTransaction(
  session: mongoose.ClientSession
): Promise<void> {
  await session.abortTransaction();
  session.endSession();
}
