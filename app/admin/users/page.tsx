"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

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

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    loadUsers();
  }, [session]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (e) {
      console.error("Failed to load users:", e);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newUserEmail || !newUserPassword || !newUserName) {
      setError("All fields are required");
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create user");
        return;
      }

      setSuccess("User created successfully");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setShowCreateModal(false);
      await loadUsers();
    } catch (e) {
      setError("Something went wrong");
    }
  };

  const handleToggleDefaultKB = async (
    userId: string,
    currentValue: boolean
  ) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/kb-access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hasAccessToDefaultKB: !currentValue,
        }),
      });

      if (res.ok) {
        await loadUsers();
        setSuccess("KB access updated");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update KB access");
      }
    } catch (e) {
      setError("Something went wrong");
    }
  };

  if (session?.user?.role !== "admin") {
    return null;
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}/delete-user`, {
        method: "DELETE",
      });
  
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete user");
        return;
      }
  
      setSuccess("User deleted successfully");
      await loadUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Something went wrong");
    }
  };  

  return (
    <div className="min-h-screen py-4 bg-white dark:bg-black">
      <Navigation />

      <div className="container max-w-6xl mx-auto px-4">
        <header className="py-8">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            User Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create users and manage their KB access
          </p>
        </header>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md">
            {success}
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              All Users
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold"
            >
              + Create User
            </button>
          </div>

          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-500">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Default KB Access
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {user.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.kbAccess?.hasAccessToDefaultKB
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                        >
                          {user.kbAccess?.hasAccessToDefaultKB ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.role !== "admin" && (
                          <>
                          <button
                            onClick={() =>
                              handleToggleDefaultKB(
                                user.id,
                                user.kbAccess?.hasAccessToDefaultKB || false
                              )
                            }
                            className={`px-3 py-1 rounded text-xs font-semibold ${
                              user.kbAccess?.hasAccessToDefaultKB
                                ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-200"
                                : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-200"
                            }`}
                          >
                            {user.kbAccess?.hasAccessToDefaultKB
                              ? "Revoke"
                              : "Grant"}{" "}
                            KB
                          </button>
                            <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 rounded text-xs font-semibold bg-red-600 text-white hover:bg-red-700"
                          >
                            Delete
                          </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-black dark:text-white mb-4">
                Create New User
              </h2>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600"
                    placeholder="User name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600"
                    placeholder="Min 8 characters"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
