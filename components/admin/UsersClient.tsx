"use client";

import { useState, useTransition } from "react";
import ConfirmModal from "../ui/ConfirmModal";
import { useRouter } from "next/navigation";

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

export default function UsersClient({
  initialUsers,
}: {
  initialUsers: User[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers || []);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(
    null
  );
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newUserEmail || !newUserPassword || !newUserName) {
      setError("All fields are required");
      return;
    }

    try {
      setCreating(true);
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
      const createdUser = data.user || data;
      startTransition(() => setUsers((prev) => [createdUser, ...prev]));
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setShowCreateModal(false);
      // revalidate server data
      router.refresh();
    } catch (e) {
      setError("Something went wrong");
    } finally {
      setCreating(false);
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
        body: JSON.stringify({ hasAccessToDefaultKB: !currentValue }),
      });

      if (res.ok) {
        router.refresh();
        setSuccess("KB access updated");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update KB access");
      }
    } catch (e) {
      setError("Something went wrong");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // open confirmation modal
    setPendingDeleteUserId(userId);
  };

  const confirmDeleteUser = async () => {
    const userId = pendingDeleteUserId;
    if (!userId) return;
    setIsDeletingUser(true);
    setError("");
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
      startTransition(() =>
        setUsers((prev) => prev.filter((u) => u.id !== userId))
      );
      router.refresh();
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      setError("Something went wrong");
    } finally {
      setIsDeletingUser(false);
      setPendingDeleteUserId(null);
    }
  };

  return (
    <div>
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

      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          All Users ({users.length})
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary w-full sm:w-auto py-2.5 px-4 text-sm sm:text-base"
        >
          + Create User
        </button>
      </div>

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
                    {user.kb_access?.hasAccessToDefaultKB ? "Yes" : "No"}
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
                            user.kb_access?.hasAccessToDefaultKB || false
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
                        className="px-3 py-1 rounded text-xs font-semibold bg-primary-500 text-white hover:bg-primary-700"
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
                    {user.kb_access?.hasAccessToDefaultKB ? "Yes" : "No"}
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
      {/* Delete user confirmation modal */}
      <ConfirmModal
        open={!!pendingDeleteUserId}
        title="Delete user"
        description={
          "Are you sure you want to delete this user? This action cannot be undone."
        }
        onCancel={() => setPendingDeleteUserId(null)}
        onConfirm={confirmDeleteUser}
        loading={isDeletingUser}
      />
    </div>
  );
}
