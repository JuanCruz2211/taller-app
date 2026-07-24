import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import { sendVerificationEmail, sendResetPasswordEmail } from "@/lib/email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      if (process.env.RESEND_API_KEY) {
        void sendResetPasswordEmail({
          email: user.email,
          name: user.name,
          url,
        });
      }
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (process.env.RESEND_API_KEY) {
        void sendVerificationEmail({
          email: user.email,
          name: user.name,
          url,
        });
      }
    },
    sendOnSignIn: true,
  },
});
