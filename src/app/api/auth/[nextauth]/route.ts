import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// In-memory user store (resets on cold start, but works for demo)
// For production, replace with a real database (Neon, Turso, Supabase)
interface User {
  id: string;
  email: string;
  name: string;
  password: string;
}

// Use a global to persist across hot reloads in dev
declare global {
  var __users: Map<string, User> | undefined;
}

function getUsers(): Map<string, User> {
  if (!global.__users) {
    global.__users = new Map();
    // Seed with admin user from env vars if set
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPass) {
      const hashed = bcrypt.hashSync(adminPass, 12);
      global.__users.set(adminEmail.toLowerCase(), {
        id: "admin",
        email: adminEmail.toLowerCase(),
        name: "Admin",
        password: hashed,
      });
    }
  }
  return global.__users;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        const email = credentials.email.toLowerCase();
        const users = getUsers();
        const user = users.get(email);

        if (!user) {
          throw new Error("No account found with this email");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "mobiman-dev-secret-2024",
  pages: { signIn: "/" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Export helper functions for signup/reset routes
export async function createUser(email: string, password: string, name?: string) {
  const users = getUsers();
  const emailLower = email.toLowerCase();
  
  if (users.has(emailLower)) {
    throw new Error("An account with this email already exists");
  }

  const hashed = await bcrypt.hash(password, 12);
  const user: User = {
    id: crypto.randomUUID(),
    email: emailLower,
    name: name || email.split("@")[0],
    password: hashed,
  };
  users.set(emailLower, user);
  
  return { id: user.id, email: user.email, name: user.name };
}

export async function findUser(email: string) {
  return getUsers().get(email.toLowerCase());
}

export async function updateUserPassword(email: string, newPassword: string) {
  const users = getUsers();
  const user = users.get(email.toLowerCase());
  if (!user) throw new Error("User not found");
  user.password = await bcrypt.hash(newPassword, 12);
  users.set(email.toLowerCase(), user);
}
