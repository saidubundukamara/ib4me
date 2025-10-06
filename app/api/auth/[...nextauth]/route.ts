import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import bcrypt from "bcrypt";

export const authConfig: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;
        await connectDB();
        const identifier = String(credentials.identifier).toLowerCase();
        const user = await UserModel.findOne({
          $or: [{ email: identifier }, { phone: identifier }],
        });
        if (!user || !user.passwordHash) return null;
        // Enforce lockout
        if (user.lockUntil && user.lockUntil > new Date()) {
          return null;
        }
        const ok = await bcrypt.compare(
          String(credentials.password),
          user.passwordHash
        );
        if (!ok) {
          // increment attempts and set lock if threshold reached
          const attempts = (user.loginAttempts ?? 0) + 1;
          const MAX_ATTEMPTS = 5;
          user.loginAttempts = attempts;
          if (attempts >= MAX_ATTEMPTS) {
            const LOCK_MINUTES = 15;
            user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
            user.loginAttempts = 0;
          }
          await user.save();
          return null;
        }
        // Reset attempts on success
        user.loginAttempts = 0;
        user.lockUntil = null;
        user.lastLoginAt = new Date();
        // Note: IP and UA are not available here; can set via custom route
        await user.save();
        // Block inactive/blocked
        if (user.status !== "active") return null;
        return {
          id: String(user._id),
          name: user.name,
          email: user.email ?? undefined,
          image: user.photoUrl ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Ensure user exists in our Mongoose store with roles/status
      await connectDB();
      const email = user.email?.toLowerCase() ?? null;
      const existing = await UserModel.findOne({
        $or: [{ email }, { _id: user.id }],
      });
      if (!existing) {
        await UserModel.create({
          _id: user.id,
          name: user.name ?? "User",
          email,
          photoUrl: user.image ?? null,
          roles: "User",
          status: "active",
          emailVerified:
            account?.provider !== "credentials" ? new Date() : null,
        });
      } else {
        // Soft update profile info
        existing.name = user.name ?? existing.name;
        if (email && !existing.email) existing.email = email;
        if (user.image && !existing.photoUrl) existing.photoUrl = user.image;
        await existing.save();
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = String(user.id);
      }
      await connectDB();
      if (token.userId) {
        const dbUser = await UserModel.findById(token.userId);
        if (dbUser) {
          token.roles = dbUser.roles ?? "User";
          token.status = dbUser.status ?? "active";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? "");
        session.user.roles = token.roles ?? "User";
        session.user.status = token.status ?? "active";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
