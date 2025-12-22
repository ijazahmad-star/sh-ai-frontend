"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    loadUsers();

    // Check for mobile viewport
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <header className="py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
                User Management
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Create users and manage their KB access
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary w-full sm:w-auto py-2.5 px-4 text-sm sm:text-base"
            >
              + Create User
            </button>
          </div>
        </header>

        {/* Status Messages */}
        {(error || success) && (
          <div className="mb-4 sm:mb-6">
            {error && (
              <div className="p-3 sm:p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md text-sm sm:text-base">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 sm:p-4 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-md text-sm sm:text-base">
                {success}
              </div>
            )}
          </div>
        )}

        {/* Users Table/Cards */}
        <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              All Users ({users.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 dark:border-red-500"></div>
                <p className="mt-2 text-gray-500">Loading users...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-3 btn-primary py-2 px-4"
              >
                Create Your First User
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
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
                        KB Access
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
                              user.kb_access?.hasAccessToDefaultKB
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {user.kb_access?.hasAccessToDefaultKB
                              ? "Yes"
                              : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm space-x-2">
                          {user.role !== "admin" && (
                            <>
                              <button
                                onClick={() =>
                                  handleToggleDefaultKB(
                                    user.id,
                                    user.kb_access?.hasAccessToDefaultKB ||
                                      false
                                  )
                                }
                                className={`px-3 py-1 rounded text-xs font-semibold ${
                                  user.kb_access?.hasAccessToDefaultKB
                                    ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-200"
                                    : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-200"
                                }`}
                              >
                                {user.kb_access?.hasAccessToDefaultKB
                                  ? "Revoke"
                                  : "Grant"}
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

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 border border-gray-200 dark:border-zinc-700"
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Email
                        </p>
                        <p className="text-gray-900 dark:text-white truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Name
                          </p>
                          <p className="text-gray-900 dark:text-white">
                            {user.name || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Role
                          </p>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            KB Access
                          </p>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.kb_access?.hasAccessToDefaultKB
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {user.kb_access?.hasAccessToDefaultKB
                              ? "Yes"
                              : "No"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Created
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {user.role !== "admin" && (
                        <div className="pt-3 border-t border-gray-200 dark:border-zinc-700">
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Actions
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() =>
                                handleToggleDefaultKB(
                                  user.id,
                                  user.kb_access?.hasAccessToDefaultKB || false
                                )
                              }
                              className={`px-3 py-1.5 rounded text-xs font-semibold flex-1 ${
                                user.kb_access?.hasAccessToDefaultKB
                                  ? "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-200"
                                  : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-200"
                              }`}
                            >
                              {user.kb_access?.hasAccessToDefaultKB
                                ? "Revoke KB"
                                : "Grant KB"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-3 py-1.5 rounded text-xs font-semibold bg-red-600 text-white hover:bg-red-700 flex-1"
                            >
                              Delete User
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  Create New User
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 text-sm sm:text-base"
                    placeholder="User name"
                    required
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
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 text-sm sm:text-base"
                    placeholder="user@example.com"
                    required
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
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 text-sm sm:text-base"
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 8 characters
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary py-2.5 px-4 text-sm sm:text-base flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary py-2.5 px-4 text-sm sm:text-base flex-1"
                  >
                    Create User
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
