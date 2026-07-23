"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AccountShell from "@/components/account-shell";
import LoadingSpinner from "@/components/loading-spinner";
import { useAuthUser } from "@/hooks/use-auth-user";
import {
  MessageSquare,
  User,
  Mail,
  Phone,
  Send,
  Clock,
  CheckCheck,
  Search,
  Filter,
} from "lucide-react";

type MessageItem = {
  id: number;
  threadId: string;
  userId: number;
  senderRole: "user" | "admin";
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isReadByAdmin: boolean;
  isReadByUser: boolean;
  createdAt: string;
};

type ThreadGroup = {
  threadId: string;
  userId: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  lastMessage: string;
  lastMessageDate: string;
  hasUnread: boolean;
  messages: MessageItem[];
};

export default function AdminMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramThreadId = searchParams.get("threadId");
  const { user, isLoading } = useAuthUser();

  const [allMessages, setAllMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(paramThreadId);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  async function loadMessages() {
    try {
      setLoadingMessages(true);
      const res = await fetch("/api/messages", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setAllMessages(data.messages ?? []);
    } catch {
      setAllMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") {
      void loadMessages();
    }
  }, [user]);

  // Group messages into threads
  const threads = useMemo<ThreadGroup[]>(() => {
    const map = new Map<string, MessageItem[]>();
    for (const msg of allMessages) {
      const list = map.get(msg.threadId) || [];
      list.push(msg);
      map.set(msg.threadId, list);
    }

    const result: ThreadGroup[] = [];
    map.forEach((messages, threadId) => {
      // sort chronological
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const firstUserMsg = messages.find((m) => m.senderRole === "user") || messages[0];
      const lastMsg = messages[messages.length - 1];
      const hasUnread = messages.some((m) => m.senderRole === "user" && !m.isReadByAdmin);

      result.push({
        threadId,
        userId: firstUserMsg.userId,
        name: firstUserMsg.name,
        email: firstUserMsg.email,
        phone: firstUserMsg.phone || "Not provided",
        subject: firstUserMsg.subject || "General Inquiry",
        lastMessage: lastMsg.message,
        lastMessageDate: lastMsg.createdAt,
        hasUnread,
        messages,
      });
    });

    return result.sort(
      (a, b) => new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
    );
  }, [allMessages]);

  useEffect(() => {
    if (paramThreadId) {
      setSelectedThreadId(paramThreadId);
    } else if (!selectedThreadId && threads.length > 0) {
      setSelectedThreadId(threads[0].threadId);
    }
  }, [paramThreadId, threads, selectedThreadId]);

  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (filterState === "unread" && !t.hasUnread) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.phone.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.lastMessage.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [threads, filterState, searchQuery]);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.threadId === selectedThreadId) || null;
  }, [threads, selectedThreadId]);

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          threadId: activeThread.threadId,
          recipientUserId: activeThread.userId,
          subject: `Re: ${activeThread.subject}`,
          message: replyText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reply");

      setReplyText("");
      await loadMessages();
    } catch (err: any) {
      alert(err.message || "Failed to send reply.");
    } finally {
      setSubmittingReply(false);
    }
  }

  if (isLoading || !user || user.role !== "admin") {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <AccountShell user={user} title="Customer Inquiries & Messages" wide>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Customer Inquiries & Support Messages
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            View submitted inquiries, inspect user contact details (Name, Email, Phone), and respond in threads.
          </p>
        </div>

        {loadingMessages ? (
          <div className="flex justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] xl:grid-cols-[380px_1fr] gap-6 bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden min-h-[600px]">
            {/* Sidebar Threads List */}
            <div className="border-r border-emerald-100 flex flex-col bg-[#f4fbf8]/50">
              {/* Filter & Search Header */}
              <div className="p-4 border-b border-emerald-100 space-y-3 bg-white">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, phone..."
                    className="w-full rounded-xl border border-emerald-100 bg-[#f4fbf8] pl-9 pr-3 py-2 text-xs outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterState("all")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      filterState === "all"
                        ? "bg-teal-800 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All ({threads.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterState("unread")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      filterState === "unread"
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Unread ({threads.filter((t) => t.hasUnread).length})
                  </button>
                </div>
              </div>

              {/* Thread list */}
              <div className="flex-1 overflow-y-auto divide-y divide-emerald-100/60">
                {filteredThreads.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <MessageSquare size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">No message threads found</p>
                  </div>
                ) : (
                  filteredThreads.map((thread) => {
                    const isSelected = thread.threadId === selectedThreadId;
                    return (
                      <div
                        key={thread.threadId}
                        onClick={() => setSelectedThreadId(thread.threadId)}
                        className={`p-4 transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-teal-50 border-l-4 border-teal-700"
                            : "hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-xs text-slate-900 truncate">
                            {thread.name}
                          </p>
                          {thread.hasUnread && (
                            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-teal-800 truncate mt-0.5">
                          {thread.subject}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                          {thread.lastMessage}
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-2 text-[10px] text-slate-400">
                          <span className="truncate">{thread.email}</span>
                          <span className="shrink-0">
                            {new Date(thread.lastMessageDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Thread Main Conversation Box */}
            <div className="flex flex-col h-full bg-white">
              {activeThread ? (
                <>
                  {/* Thread Header: Customer Details Card */}
                  <div className="p-5 border-b border-emerald-100 bg-[#f4fbf8]/80 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 font-bold text-teal-800 text-xs">
                          {activeThread.name[0]}
                        </span>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">
                            {activeThread.name}
                          </h3>
                          <p className="text-xs text-teal-800 font-medium">
                            Subject: {activeThread.subject}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Contact Details Pill */}
                    <div className="flex flex-wrap items-center gap-3 text-xs bg-white border border-emerald-100 rounded-2xl px-4 py-2 shadow-2xs">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Mail size={14} className="text-teal-700" />
                        <a href={`mailto:${activeThread.email}`} className="hover:underline">
                          {activeThread.email}
                        </a>
                      </span>
                      <span className="h-3 w-px bg-slate-200" />
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Phone size={14} className="text-teal-700" />
                        <a href={`tel:${activeThread.phone}`} className="hover:underline">
                          {activeThread.phone}
                        </a>
                      </span>
                    </div>
                  </div>

                  {/* Conversation Messages Box */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/40">
                    {activeThread.messages.map((msg) => {
                      const isAdmin = msg.senderRole === "admin";
                      const dateStr = new Date(msg.createdAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isAdmin ? "items-end" : "items-start"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 px-1">
                            <span className="font-bold text-slate-700">
                              {isAdmin ? "You (Support Admin)" : msg.name}
                            </span>
                            <span>·</span>
                            <span>{dateStr}</span>
                          </div>

                          <div
                            className={`max-w-lg rounded-2xl p-4 text-sm leading-relaxed shadow-2xs whitespace-pre-line ${
                              isAdmin
                                ? "bg-teal-800 text-white rounded-tr-none"
                                : "bg-white border border-emerald-100 text-slate-800 rounded-tl-none"
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Admin Reply Form */}
                  <form
                    onSubmit={handleSendReply}
                    className="p-4 border-t border-emerald-100 bg-white flex flex-col gap-3"
                  >
                    <div className="relative">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={3}
                        placeholder={`Reply to ${activeThread.name}...`}
                        className="w-full rounded-2xl border border-slate-200 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 resize-y"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingReply || !replyText.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-900 disabled:opacity-60 transition-colors cursor-pointer"
                      >
                        <Send size={14} />
                        {submittingReply ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                  <MessageSquare size={40} className="text-slate-300 mb-3" />
                  <p className="text-base font-bold text-slate-700">Select a message thread</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Choose an inquiry from the left panel to inspect contact details and reply.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AccountShell>
  );
}
