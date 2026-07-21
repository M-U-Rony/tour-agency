import { pool } from "../connection";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { normalizeRow } from "./utils";

export type PaymentRow = {
  id: number;
  _id: number;
  bookingId: number;
  userId: number;
  amountBdt: number;
  paymentMethod: string;
  transactionId: string;
  status: "pending" | "completed" | "failed" | "refunded";
  notes: string;
  createdAt: Date;
  updatedAt: Date;
};

function normalizePaymentRow(row: any): PaymentRow {
  const norm = normalizeRow(row) as PaymentRow;
  norm.bookingId = Number(norm.bookingId);
  norm.userId = Number(norm.userId);
  norm.amountBdt = Number(norm.amountBdt);
  norm.createdAt = new Date(norm.createdAt);
  norm.updatedAt = new Date(norm.updatedAt);
  return norm;
}

export const Payment = {
  async find(filter: { bookingId?: string | number; userId?: string | number } = {}): Promise<PaymentRow[]> {
    const where: string[] = [];
    const params: any[] = [];

    if (filter.bookingId !== undefined) {
      where.push("bookingId = ?");
      params.push(Number(filter.bookingId));
    }
    if (filter.userId !== undefined) {
      where.push("userId = ?");
      params.push(Number(filter.userId));
    }

    let query = "SELECT * FROM payments";
    if (where.length > 0) {
      query += " WHERE " + where.join(" AND ");
    }
    query += " ORDER BY createdAt DESC";

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows.map(normalizePaymentRow);
  },

  async findById(id: string | number): Promise<PaymentRow | null> {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM payments WHERE id = ? LIMIT 1",
      [numId]
    );
    if (!rows.length) return null;
    return normalizePaymentRow(rows[0]);
  },

  async create(data: {
    bookingId: string | number;
    userId: string | number;
    amountBdt: number;
    paymentMethod: string;
    transactionId: string;
    status?: "pending" | "completed" | "failed" | "refunded";
    notes?: string;
  }): Promise<PaymentRow> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO payments (bookingId, userId, amountBdt, paymentMethod, transactionId, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(data.bookingId),
        Number(data.userId),
        data.amountBdt,
        data.paymentMethod,
        data.transactionId,
        data.status ?? "pending",
        data.notes ?? "",
      ]
    );

    const created = await Payment.findById(result.insertId);
    if (!created) throw new Error("Failed to create payment record");
    return created;
  },

  async findByIdAndUpdate(
    id: string | number,
    data: Partial<{
      status: "pending" | "completed" | "failed" | "refunded";
      notes: string;
    }>
  ): Promise<PaymentRow | null> {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) { fields.push("status = ?"); values.push(data.status); }
    if (data.notes !== undefined) { fields.push("notes = ?"); values.push(data.notes); }

    if (fields.length === 0) return Payment.findById(numId);

    values.push(numId);
    await pool.query(`UPDATE payments SET ${fields.join(", ")} WHERE id = ?`, values);
    return Payment.findById(numId);
  },
};
