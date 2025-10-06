import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: string;
      status: "active" | "inactive" | "blocked";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    roles?: string;
    status?: "active" | "inactive" | "blocked";
  }
}
