import Navigation from "@/components/Navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import UsersClient from "@/components/admin/UsersClient";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  kb_access?: {
    hasAccessToDefaultKB: boolean;
  };
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "admin") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      kb_access: {
        select: {
          hasAccessToDefaultKB: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializableUsers: User[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt
      ? u.createdAt.toISOString()
      : new Date().toISOString(),
    kb_access: u.kb_access
      ? { hasAccessToDefaultKB: u.kb_access.hasAccessToDefaultKB }
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
          </div>
        </header>

        <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-4 sm:p-6 border border-gray-100 dark:border-zinc-800">
          <UsersClient initialUsers={serializableUsers} />
        </div>
      </div>
    </div>
  );
}
