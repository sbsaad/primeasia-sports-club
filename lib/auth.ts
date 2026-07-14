// lib/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return false;

      try {
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.googleId, account.providerAccountId))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(users).values({
            googleId: account.providerAccountId,
            name: user.name ?? "Unknown",
            email: user.email ?? "",
            avatar: user.image ?? null,
          });
        }
      } catch (err) {
        console.error("Error upserting user on sign-in:", err);
        return false;
      }

      return true;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        // Attach google_id to session for easy lookup
        session.user.id = token.sub;
      }
      return session;
    },

    async jwt({ token, account }) {
      if (account) {
        token.googleId = account.providerAccountId;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
});
