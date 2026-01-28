import Navigation from "@/components/Navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/database/db";
import { users, kbAccess } from "@/database/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import UsersClient from "@/components/admin/UsersClient";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  kbAccess?: {
    hasAccessToDefaultKB: boolean;
  };
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "admin") {
    redirect("/dashboard");
  }

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      kbAccess: {
        hasAccessToDefaultKB: kbAccess.hasAccessToDefaultKB,
      },
    })
    .from(users)
    .leftJoin(kbAccess, eq(users.id, kbAccess.userId))
    .orderBy(desc(users.createdAt));

  const serializableUsers: User[] = allUsers.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt
      ? u.createdAt.toISOString()
      : new Date().toISOString(),
    kbAccess: u.kbAccess
      ? { hasAccessToDefaultKB: u.kbAccess.hasAccessToDefaultKB || false }
      : undefined,
  }));

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900">
      <Navigation />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <header className="py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
                User Management
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Create users and manage their KB access
              </p>
            </div>
            <div>
              <Link
                href="/admin/feedback-analytics"
                className="btn-primary bg-primary-500 py-4 hover:bg-primary-700"
              >
                Feedback Analytics
              </Link>
            </div>
          </div>
        </header>

        <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-4 sm:p-6 border border-gray-100 dark:border-zinc-800">
          <UsersClient initialUsers={serializableUsers} />
        </div>
      </div>
    </div>
  );
}
