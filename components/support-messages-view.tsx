"use client";

import { useEffect, useState } from "react";
import { Send, MessageSquare, Phone, Mail, User, Clock, CheckCircle } from "lucide-react";
import { useAuthUser } from "@/hooks/use-auth-user";

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
  isReadByUser: boolean;
  createdAt: string;
};

export default function SupportMessagesView() {
  const { user } = useAuthUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  async function loadUserMessages() {
    try {
      setLoadingMessages(true);
      const res = await fetch("/api/messages", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      // no-op
    } finally {
      setLoadingMessages(false);
    }
  }

  useEffect(() => {
    void loadUserMessages();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!message.trim()) {
      setError("Please write a message before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          subject: subject.trim() || "General Inquiry",
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not send message");

      setSuccess(true);
      setMessage("");
      setSubject("");
      await loadUserMessages();
    } catch (err: any) {
      setError(err.message || "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim() || messages.length === 0) return;

    setSendingReply(true);
    const activeThreadId = messages[0].threadId;
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          threadId: activeThreadId,
          subject: "Re: Support Inquiry",
          message: replyText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not send reply");

      setReplyText("");
      await loadUserMessages();
    } catch (err: any) {
      alert(err.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-[box-shadow,border-color,background-color] focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";
  const labelClass =
    "mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500";

  return (
    <div className="space-y-8">
      {/* Send Contact Message Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-white bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8"
      >
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <MessageSquare className="h-5 w-5 text-teal-700" />
          Send Us a Direct Message
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Have questions or need support? Send us a message and track admin responses here.
        </p>

        {success && (
          <div className="mt-4 mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            Your message has been sent successfully! Our admin team will respond shortly.
          </div>
        )}

        {error && (
          <div className="mt-4 mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              <User className="h-3.5 w-3.5" /> Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <Mail className="h-3.5 w-3.5" /> Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <Phone className="h-3.5 w-3.5" /> Phone / WhatsApp *
            </label>
            <input
              type="tel"
              required
              placeholder="+880 17XX XXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Subject / Topic
            </label>
            <input
              type="text"
              placeholder="e.g. Booking Inquiry, Refund, Custom Route"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={labelClass}>
              Your Message *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe what you need assistance with..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-700 py-4 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(15,118,110,0.15)] transition hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
        >
          <Send size={16} />
          {submitting ? "Sending message..." : "Send Message"}
        </button>
      </form>

      {/* Messages & Admin Replies Thread Box */}
      <div className="rounded-[2rem] border border-white bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
          <MessageSquare className="h-5 w-5 text-teal-700" />
          Message History & Admin Replies
        </h3>

        {loadingMessages ? (
          <div className="py-8 text-center text-slate-400">Loading conversation history...</div>
        ) : messages.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No message history yet. Submit a message above to start a conversation with our team!
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-slate-50/60 rounded-2xl border border-emerald-100/60">
              {messages.map((msg) => {
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
                    className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 px-1">
                      <span className="font-bold text-slate-700">
                        {isAdmin ? "ExploreBD Support Admin" : "You"}
                      </span>
                      <span>·</span>
                      <span>{dateStr}</span>
                    </div>

                    <div
                      className={`max-w-lg rounded-2xl p-4 text-sm leading-relaxed shadow-2xs whitespace-pre-line ${
                        isAdmin
                          ? "bg-teal-800 text-white rounded-tl-none font-medium"
                          : "bg-white border border-emerald-100 text-slate-800 rounded-tr-none"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* User Reply Input Box */}
            <form onSubmit={handleSendReply} className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply to admin..."
                className="flex-1 rounded-2xl border border-emerald-100 bg-[#f4fbf8] px-4 py-3 text-sm outline-none focus:border-teal-700 focus:bg-white"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 transition cursor-pointer shrink-0"
              >
                {sendingReply ? "Sending..." : "Reply"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
