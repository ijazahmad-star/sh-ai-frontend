"use client";

import { useState } from "react";

interface User {
  id: string;
  name: string | null;
  email: string;
  feedbacks: { id: string }[];
}

interface Feedback {
  id: string;
  ai_response: string;
  user_query: string;
  thumb: string;
  comment: string | null;
  createdAt: string;
  conversation_id: string;
}

interface Props {
  initialUsers: User[];
}

function feedbacksToCSV(feedbacks: Feedback[], userName: string) {
  if (!feedbacks.length) return "";
  const header = [
    "User Name",
    "Date",
    "Thumb",
    "User Query",
    "AI Response",
    "Comment",
  ];
  const rows = feedbacks.map((fb) => [
    userName,
    new Date(fb.createdAt).toISOString(),
    fb.thumb,
    '"' + (fb.user_query || "").replace(/"/g, '""') + '"',
    '"' + (fb.ai_response || "").replace(/"/g, '""') + '"',
    '"' + (fb.comment || "").replace(/"/g, '""') + '"',
  ]);
  return [header, ...rows].map((r) => r.join(",")).join("\n");
}

export default function FeedbackAnalyticsClient({ initialUsers }: Props) {
  const [users] = useState<User[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleViewFeedback = async (user: User) => {
    setSelectedUser(user);
    setLoading(true);
    setIsModalOpen(true);

    try {
      const response = await fetch(
        `/api/admin/feedback-analytics?userId=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data.feedbacks || []);
      }
    } catch (error) {
      console.error("Failed to load feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!selectedUser || !feedbacks.length) return;

    const csv = feedbacksToCSV(
      feedbacks,
      selectedUser.name || selectedUser.email
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-${selectedUser.email}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          Users with Feedback ({users.length})
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-700">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                Feedback Count
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
                  {user.name || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {user.email}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                    {user.feedbacks.length}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm space-x-2">
                  <button
                    onClick={() => handleViewFeedback(user)}
                    className="px-3 py-1 rounded btn-primary hover:bg-primary-700 text-xs"
                  >
                    View Feedback
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-700">
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white">
                  Feedback for {selectedUser?.name || selectedUser?.email}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {feedbacks.length} feedback entries
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {feedbacks.length > 0 && (
                  <button
                    onClick={handleDownloadCSV}
                    className="btn-primary"
                  >
                    Download CSV
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 overflow-auto max-h-[70vh]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : feedbacks.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                  No feedback found for this user.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-zinc-700">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Thumb
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                          User Query
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                          AI Response
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Comment
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbacks.map((fb) => (
                        <tr
                          key={fb.id}
                          className="border-b border-gray-100 dark:border-zinc-800"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {new Date(fb.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                fb.thumb === "up"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
                              }`}
                            >
                              {fb.thumb === "up" ? "👍 Up" : "👎 Down"}
                            </span>
                          </td>
                          <td
                            className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate"
                            title={fb.user_query}
                          >
                            {fb.user_query}
                          </td>
                          <td
                            className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate"
                            title={fb.ai_response}
                          >
                            {fb.ai_response}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {fb.comment || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
