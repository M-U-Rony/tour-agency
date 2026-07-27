import { pool } from "../connection";
import { RowDataPacket } from "mysql2/promise";
import { normalizeRow } from "./utils";

export type SupportThreadRow = {
  id: string;
  userId: number;
  subject: string;
  status: "open" | "closed";
  isReadByAdmin: boolean;
  isReadByUser: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeThreadRow(row: any): SupportThreadRow {
  const norm = normalizeRow(row) as SupportThreadRow;
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
      CREATE TABLE IF NOT EXISTS support_threads (
        id VARCHAR(100) PRIMARY KEY,
        userId INT NOT NULL,
        subject VARCHAR(255) NOT NULL DEFAULT 'General Inquiry',
        status ENUM('open', 'closed') DEFAULT 'open',
        isReadByAdmin BOOLEAN DEFAULT FALSE,
        isReadByUser BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_userId (userId),
        INDEX idx_status (status),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    tableEnsured = true;
  } catch (err) {
    console.error("Error creating support_threads table:", err);
  }
}

export const SupportThread = {
  async find(filter: { userId?: string | number; status?: "open" | "closed" } = {}): Promise<SupportThreadRow[]> {
    await ensureTable();
    const where: string[] = [];
    const params: any[] = [];

    if (filter.userId !== undefined) {
      where.push("userId = ?");
      params.push(Number(filter.userId));
    }
    if (filter.status !== undefined) {
      where.push("status = ?");
      params.push(filter.status);
    }

    let query = "SELECT * FROM support_threads";
    if (where.length > 0) {
      query += " WHERE " + where.join(" AND ");
    }
    query += " ORDER BY updatedAt DESC";

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows.map(normalizeThreadRow);
  },

  async findById(id: string): Promise<SupportThreadRow | null> {
    await ensureTable();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM support_threads WHERE id = ? LIMIT 1",
      [id]
    );
    if (!rows.length) return null;
    return normalizeThreadRow(rows[0]);
  },

  async upsert(data: {
    id: string;
    userId: string | number;
    subject?: string;
    status?: "open" | "closed";
    isReadByAdmin?: boolean;
    isReadByUser?: boolean;
  }): Promise<SupportThreadRow> {
    await ensureTable();
    const numUserId = Number(data.userId);
    const subject = data.subject || "General Inquiry";
    const status = data.status || "open";
    const isReadByAdmin = data.isReadByAdmin ?? false;
    const isReadByUser = data.isReadByUser ?? false;

    await pool.query(
      `INSERT INTO support_threads (id, userId, subject, status, isReadByAdmin, isReadByUser)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         subject = VALUES(subject),
         status = VALUES(status),
         isReadByAdmin = VALUES(isReadByAdmin),
         isReadByUser = VALUES(isReadByUser),
         updatedAt = CURRENT_TIMESTAMP`,
      [data.id, numUserId, subject, status, isReadByAdmin, isReadByUser]
    );

    const updated = await SupportThread.findById(data.id);
    if (!updated) throw new Error("Failed to upsert support thread");
    return updated;
  },

  async markAsRead(id: string, role: "user" | "admin"): Promise<void> {
    await ensureTable();
    if (role === "admin") {
      await pool.query(
        "UPDATE support_threads SET isReadByAdmin = TRUE WHERE id = ?",
        [id]
      );
    } else {
      await pool.query(
        "UPDATE support_threads SET isReadByUser = TRUE WHERE id = ?",
        [id]
      );
    }
  },

  async markAllAsRead(role: "user" | "admin", userId?: string | number): Promise<void> {
    await ensureTable();
    if (role === "admin") {
      await pool.query(
        "UPDATE support_threads SET isReadByAdmin = TRUE WHERE isReadByAdmin = FALSE"
      );
    } else if (userId !== undefined) {
      const numUserId = Number(userId);
      if (!Number.isNaN(numUserId)) {
        await pool.query(
          "UPDATE support_threads SET isReadByUser = TRUE WHERE userId = ? AND isReadByUser = FALSE",
          [numUserId]
        );
      }
    }
  },
};
