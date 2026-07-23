import { pool } from "../connection";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { normalizeRow } from "./utils";

export type WishlistRow = {
  id: number;
  _id: number;
  userId: number;
  packageId: number;
  createdAt: Date;
};

function normalizeWishlistRow(row: any): WishlistRow {
  const norm = normalizeRow(row) as WishlistRow;
  norm.userId = Number(norm.userId);
  norm.packageId = Number(norm.packageId);
  norm.createdAt = new Date(norm.createdAt);
  return norm;
}

let tableEnsured = false;
async function ensureWishlistTable() {
  if (tableEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        packageId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY idx_user_package (userId, packageId),
        INDEX idx_userId (userId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (packageId) REFERENCES tour_packages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch {}
  tableEnsured = true;
}

export const Wishlist = {
  async findByUserId(userId: string | number): Promise<WishlistRow[]> {
    await ensureWishlistTable();
    const numUserId = Number(userId);
    if (Number.isNaN(numUserId)) return [];
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM wishlists WHERE userId = ? ORDER BY createdAt DESC",
      [numUserId]
    );
    return rows.map(normalizeWishlistRow);
  },

  async isWishlisted(userId: string | number, packageId: string | number): Promise<boolean> {
    await ensureWishlistTable();
    const numUserId = Number(userId);
    const numPkgId = Number(packageId);
    if (Number.isNaN(numUserId) || Number.isNaN(numPkgId)) return false;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM wishlists WHERE userId = ? AND packageId = ? LIMIT 1",
      [numUserId, numPkgId]
    );
    return rows.length > 0;
  },

  async add(userId: string | number, packageId: string | number): Promise<boolean> {
    await ensureWishlistTable();
    const numUserId = Number(userId);
    const numPkgId = Number(packageId);
    if (Number.isNaN(numUserId) || Number.isNaN(numPkgId)) return false;
    await pool.query<ResultSetHeader>(
      "INSERT IGNORE INTO wishlists (userId, packageId) VALUES (?, ?)",
      [numUserId, numPkgId]
    );
    return true;
  },

  async remove(userId: string | number, packageId: string | number): Promise<boolean> {
    await ensureWishlistTable();
    const numUserId = Number(userId);
    const numPkgId = Number(packageId);
    if (Number.isNaN(numUserId) || Number.isNaN(numPkgId)) return false;
    await pool.query(
      "DELETE FROM wishlists WHERE userId = ? AND packageId = ?",
      [numUserId, numPkgId]
    );
    return true;
  },

  async toggle(userId: string | number, packageId: string | number): Promise<{ wishlisted: boolean }> {
    const exists = await Wishlist.isWishlisted(userId, packageId);
    if (exists) {
      await Wishlist.remove(userId, packageId);
      return { wishlisted: false };
    } else {
      await Wishlist.add(userId, packageId);
      return { wishlisted: true };
    }
  },
};
