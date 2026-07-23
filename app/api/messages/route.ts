import { NextResponse } from "next/server";
import { DbConnect } from "@/db/connection";
import { SupportMessage, User } from "@/db/models";
import { getAuthFromCookies } from "@/lib/auth-api";

export async function GET(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const threadId = url.searchParams.get("threadId");

    await DbConnect();

    if (auth.role === "admin") {
      if (threadId) {
        const messages = await SupportMessage.find({ threadId });
        await SupportMessage.markAsRead(threadId, "admin");
        return NextResponse.json({ messages });
      }
      const allMessages = await SupportMessage.find();
      return NextResponse.json({ messages: allMessages });
    } else {
      const messages = await SupportMessage.find({ userId: auth.userId });
      if (threadId) {
        await SupportMessage.markAsRead(threadId, "user");
      } else if (messages.length > 0) {
        const userThreadId = messages[0].threadId;
        await SupportMessage.markAsRead(userThreadId, "user");
      }
      return NextResponse.json({ messages });
    }
  } catch (error) {
    console.error("GET messages:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthFromCookies();
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, phone, subject, message, threadId, recipientUserId } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ message: "Message content is required" }, { status: 400 });
    }

    await DbConnect();

    if (auth.role === "admin") {
      const targetUserId = recipientUserId || body.userId;
      if (!targetUserId) {
        return NextResponse.json({ message: "Recipient user is required" }, { status: 400 });
      }

      const adminUser = await User.findById(auth.userId);
      const created = await SupportMessage.create({
        threadId: threadId || `thread_${targetUserId}`,
        userId: targetUserId,
        senderRole: "admin",
        name: adminUser?.name || "ExploreBD Support",
        email: adminUser?.email || "support@explorebdtours.com",
        phone: "",
        subject: subject || "Re: Support Request",
        message: message.trim(),
      });

      return NextResponse.json({ message: created }, { status: 201 });
    } else {
      const user = await User.findById(auth.userId);
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      const created = await SupportMessage.create({
        threadId: threadId || `thread_${auth.userId}`,
        userId: auth.userId,
        senderRole: "user",
        name: (name && String(name).trim()) || user.name,
        email: (email && String(email).trim()) || user.email,
        phone: (phone && String(phone).trim()) || "",
        subject: (subject && String(subject).trim()) || "General Inquiry",
        message: message.trim(),
      });

      return NextResponse.json({ message: created }, { status: 201 });
    }
  } catch (error) {
    console.error("POST messages:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
