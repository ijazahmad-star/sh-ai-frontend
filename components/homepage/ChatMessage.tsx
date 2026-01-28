import {
  FileText,
  User,
  Bot,
} from "lucide-react";

// Mock Chat Message Component
export default function ChatMessage({
  isUser,
  content,
  sources,
}: {
  isUser: boolean;
  content: string;
  sources?: string[];
}) {
  return (
    <div
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? "order-1" : ""}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? "bg-primary-500 text-white ml-auto"
              : "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white"
          }`}
        >
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
        {sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {sources.map((source, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs border border-red-200 dark:border-red-800"
              >
                <FileText className="w-3 h-3" />
                {source}
              </span>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  );
}
