import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { SupportMessage } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";

export async function GET() {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ unreadCount: 0, notifications: [] });
    }

    await DbConnect();

    if (auth.role === "admin") {
      const unreadCount = await SupportMessage.getUnreadCountForAdmin();
      const allMessages = await SupportMessage.find();
      const unreadMessages = allMessages.filter(
        (m) => m.senderRole === "user" && !m.isReadByAdmin
      );

      const notifications = unreadMessages.map((m) => ({
        id: String(m.id),
        title: `Message from ${m.name}`,
        subtitle: m.subject || "Customer Inquiry",
        message: m.message,
        createdAt: m.createdAt.toISOString(),
        link: `/admin/messages?threadId=${m.threadId}`,
      }));

      return NextResponse.json({ unreadCount, notifications });
    } else {
      const unreadCount = await SupportMessage.getUnreadCountForUser(auth.userId);
      const userMessages = await SupportMessage.find({ userId: auth.userId });
      const unreadReplies = userMessages.filter(
        (m) => m.senderRole === "admin" && !m.isReadByUser
      );

      const notifications = unreadReplies.map((m) => ({
        id: String(m.id),
        title: "New reply from Support",
        subtitle: m.subject || "Re: Inquiry",
        message: m.message,
        createdAt: m.createdAt.toISOString(),
        link: "/contact",
      }));

      return NextResponse.json({ unreadCount, notifications });
    }
  } catch (error) {
    console.error("GET notifications:", error);
    return NextResponse.json({ unreadCount: 0, notifications: [] });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { threadId } = body;

    await DbConnect();

    if (threadId) {
      await SupportMessage.markAsRead(threadId, auth.role === "admin" ? "admin" : "user");
    } else if (auth.role !== "admin") {
      const userMessages = await SupportMessage.find({ userId: auth.userId });
      if (userMessages.length > 0) {
        await SupportMessage.markAsRead(userMessages[0].threadId, "user");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST notifications mark as read:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
