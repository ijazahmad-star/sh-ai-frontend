import Navigation from "@/components/Navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/database/db";
import { users, feedbacks } from "@/database/schema";
import { eq } from "drizzle-orm";
import FeedbackAnalyticsClient from "@/components/admin/FeedbackAnalyticsClient";

export default async function FeedbackAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "admin") {
    redirect("/dashboard");
  }

  // Get users who shared feedback
  const allFeedbacks = await db.select().from(feedbacks);
  const uniqueUserIds = [...new Set(allFeedbacks.map((f) => f.userId))];

  const usersFormatted = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      const userFeedbacks = allFeedbacks.filter((f) => f.userId === userId);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        feedbacks: userFeedbacks.map((f) => ({ id: f.id })),
      };
    }),
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-zinc-50 dark:from-black dark:to-zinc-900">
      <Navigation />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <header className="py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
                Feedback Analytics
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                View and analyze user feedback on AI responses
              </p>
            </div>
          </div>
        </header>

        <div className="bg-white dark:bg-zinc-900 shadow-lg rounded-xl p-4 sm:p-6 border border-gray-100 dark:border-zinc-800">
          <FeedbackAnalyticsClient initialUsers={usersFormatted} />
        </div>
      </div>
    </div>
  );
}
