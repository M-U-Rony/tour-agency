import { pool } from "../connection";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { normalizeRow } from "./utils";

export type ReviewRow = {
  id: number;
  _id: number;
  userId: number;
  packageId: number;
  bookingId: number;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeReviewRow(row: any): ReviewRow {
  const norm = normalizeRow(row) as ReviewRow;
  norm.userId = Number(norm.userId);
  norm.packageId = Number(norm.packageId);
  norm.bookingId = Number(norm.bookingId);
  norm.rating = Number(norm.rating);
  norm.createdAt = new Date(norm.createdAt);
  norm.updatedAt = new Date(norm.updatedAt);
  return norm;
}

export const Review = {
  async find(filter: { packageId?: string | number } = {}): Promise<ReviewRow[]> {
    if (filter.packageId !== undefined) {
      const numPkgId = Number(filter.packageId);
      if (Number.isNaN(numPkgId)) return [];
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM reviews WHERE packageId = ? ORDER BY createdAt DESC",
        [numPkgId]
      );
      return rows.map(normalizeReviewRow);
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM reviews ORDER BY createdAt DESC"
    );
    return rows.map(normalizeReviewRow);
  },

  async create(data: {
    userId: string | number;
    packageId: string | number;
    bookingId: string | number;
    rating: number;
    comment: string;
  }): Promise<ReviewRow> {
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO reviews (userId, packageId, bookingId, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [
        Number(data.userId),
        Number(data.packageId),
        Number(data.bookingId),
        data.rating,
        data.comment,
      ]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM reviews WHERE id = ? LIMIT 1",
      [result.insertId]
    );
    if (!rows.length) throw new Error("Failed to create review");
    return normalizeReviewRow(rows[0]);
  },

  async getAverageRating(packageId: string | number): Promise<number | null> {
    const numPkgId = Number(packageId);
    if (Number.isNaN(numPkgId)) return null;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT AVG(rating) as avgRating FROM reviews WHERE packageId = ?",
      [numPkgId]
    );
    if (!rows.length || rows[0].avgRating === null) return null;
    return Number(rows[0].avgRating);
  },
};
