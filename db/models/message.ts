import { pool } from "../connection";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { normalizeRow } from "./utils";

export type SupportMessageRow = {
  id: number;
  _id: number;
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
  createdAt: Date;
  updatedAt: Date;
};

function normalizeMessageRow(row: any): SupportMessageRow {
  const norm = normalizeRow(row) as SupportMessageRow;
  norm.userId = Number(norm.userId);
  norm.isReadByAdmin = Boolean(norm.isReadByAdmin);
  norm.isReadByUser = Boolean(norm.isReadByUser);
  norm.createdAt = new Date(norm.createdAt);
  norm.updatedAt = new Date(norm.updatedAt);
  return norm;
}

let tableEnsured = false;
async function ensureTable() {
  if (tableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        threadId VARCHAR(100) NOT NULL,
        userId INT NOT NULL,
        senderRole ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        subject VARCHAR(255) DEFAULT 'General Inquiry',
        message TEXT NOT NULL,
        isReadByAdmin BOOLEAN DEFAULT FALSE,
        isReadByUser BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_threadId (threadId),
        INDEX idx_userId (userId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    tableEnsured = true;
  } catch (err) {
    console.error("Error creating support_messages table:", err);
  }
}

export const SupportMessage = {
  async find(filter: { userId?: string | number; threadId?: string } = {}): Promise<SupportMessageRow[]> {
    await ensureTable();
    if (filter.threadId) {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM support_messages WHERE threadId = ? ORDER BY createdAt ASC",
        [filter.threadId]
      );
      return rows.map(normalizeMessageRow);
    }
    if (filter.userId !== undefined) {
      const numUserId = Number(filter.userId);
      if (Number.isNaN(numUserId)) return [];
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM support_messages WHERE userId = ? ORDER BY createdAt ASC",
        [numUserId]
      );
      return rows.map(normalizeMessageRow);
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM support_messages ORDER BY createdAt DESC"
    );
    return rows.map(normalizeMessageRow);
  },

  async create(data: {
    threadId?: string;
    userId: string | number;
    senderRole?: "user" | "admin";
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
  }): Promise<SupportMessageRow> {
    await ensureTable();
    const numUserId = Number(data.userId);
    const threadId = data.threadId || `thread_${numUserId}`;
    const senderRole = data.senderRole || "user";
    const phone = data.phone || "";
    const subject = data.subject || "General Inquiry";
    const isReadByAdmin = senderRole === "admin";
    const isReadByUser = senderRole === "user";

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO support_messages (threadId, userId, senderRole, name, email, phone, subject, message, isReadByAdmin, isReadByUser)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        threadId,
        numUserId,
        senderRole,
        data.name,
        data.email,
        phone,
        subject,
        data.message,
        isReadByAdmin,
        isReadByUser,
      ]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM support_messages WHERE id = ? LIMIT 1",
      [result.insertId]
    );
    if (!rows.length) throw new Error("Failed to create support message");
    return normalizeMessageRow(rows[0]);
  },

  async markAsRead(threadId: string, role: "user" | "admin"): Promise<void> {
    await ensureTable();
    if (role === "admin") {
      await pool.query(
        "UPDATE support_messages SET isReadByAdmin = TRUE WHERE threadId = ?",
        [threadId]
      );
    } else {
      await pool.query(
        "UPDATE support_messages SET isReadByUser = TRUE WHERE threadId = ?",
        [threadId]
      );
    }
  },

  async getUnreadCountForUser(userId: string | number): Promise<number> {
    await ensureTable();
    const numUserId = Number(userId);
    if (Number.isNaN(numUserId)) return 0;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM support_messages WHERE userId = ? AND senderRole = 'admin' AND isReadByUser = FALSE",
      [numUserId]
    );
    return rows.length ? Number(rows[0].count) : 0;
  },

  async getUnreadCountForAdmin(): Promise<number> {
    await ensureTable();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM support_messages WHERE senderRole = 'user' AND isReadByAdmin = FALSE"
    );
    return rows.length ? Number(rows[0].count) : 0;
  },
};
