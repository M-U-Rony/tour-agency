import { pool } from "../connection";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { normalizeRow } from "./utils";

export type TripAnnouncementRow = {
  id: number;
  packageId: number;
  guideId: number;
  title: string;
  message: string;
  createdAt: Date;
  guideName?: string;
};

function normalizeAnnouncementRow(row: any): TripAnnouncementRow {
  const norm = normalizeRow(row) as TripAnnouncementRow;
  norm.packageId = Number(norm.packageId);
  norm.guideId = Number(norm.guideId);
  norm.createdAt = new Date(norm.createdAt);
  if (row.guideName) norm.guideName = String(row.guideName);
  return norm;
}

let tableEnsured = false;
async function ensureTable() {
  if (tableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trip_announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        packageId INT NOT NULL,
        guideId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_packageId (packageId),
        FOREIGN KEY (packageId) REFERENCES tour_packages(id) ON DELETE CASCADE,
        FOREIGN KEY (guideId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch {}
  tableEnsured = true;
}

export const TripAnnouncement = {
  async findByPackageId(packageId: string | number): Promise<TripAnnouncementRow[]> {
    await ensureTable();
    const numPkgId = Number(packageId);
    if (Number.isNaN(numPkgId)) return [];
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, u.name as guideName 
       FROM trip_announcements a 
       LEFT JOIN users u ON a.guideId = u.id 
       WHERE a.packageId = ? 
       ORDER BY a.createdAt DESC`,
      [numPkgId]
    );
    return rows.map(normalizeAnnouncementRow);
  },

  async findByPackageIds(packageIds: (string | number)[]): Promise<TripAnnouncementRow[]> {
    await ensureTable();
    const ids = packageIds.map(Number).filter((n) => !Number.isNaN(n));
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => "?").join(",");
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, u.name as guideName 
       FROM trip_announcements a 
       LEFT JOIN users u ON a.guideId = u.id 
       WHERE a.packageId IN (${placeholders}) 
       ORDER BY a.createdAt DESC`,
      ids
    );
    return rows.map(normalizeAnnouncementRow);
  },

  async create(data: {
    packageId: string | number;
    guideId: string | number;
    title: string;
    message: string;
  }): Promise<TripAnnouncementRow> {
    await ensureTable();
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO trip_announcements (packageId, guideId, title, message) VALUES (?, ?, ?, ?)`,
      [Number(data.packageId), Number(data.guideId), data.title.trim(), data.message.trim()]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, u.name as guideName 
       FROM trip_announcements a 
       LEFT JOIN users u ON a.guideId = u.id 
       WHERE a.id = ? LIMIT 1`,
      [result.insertId]
    );
    if (!rows.length) throw new Error("Failed to create trip announcement");
    return normalizeAnnouncementRow(rows[0]);
  },
};
