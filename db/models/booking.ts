import { pool } from "../connection";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { parseJsonField, normalizeRow } from "./utils";

export type AttendanceStatus = "unchecked" | "attending" | "not_coming";

export type BookingRow = {
  id: number;
  _id: number;
  userId: number;
  packageId: number;
  travelDate: Date;
  travelers: number;
  contactPhone: string;
  notes: string;
  travelerNames: string[];
  emergencyContact: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "advance_due" | "advance_paid" | "paid" | "refunded";
  paymentMethod: string;
  transactionId: string;
  adminNotes: string;
  attendanceStatus: AttendanceStatus;
  totalPriceBdt: number;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeBookingRow(row: any): BookingRow {
  const norm = normalizeRow(row) as BookingRow;
  norm.userId = Number(norm.userId);
  norm.packageId = Number(norm.packageId);
  norm.travelers = Number(norm.travelers);
  norm.totalPriceBdt = Number(norm.totalPriceBdt);
  norm.attendanceStatus = (norm.attendanceStatus as AttendanceStatus) || "unchecked";
  norm.travelerNames = parseJsonField<string[]>(norm.travelerNames, []);
  norm.travelDate = new Date(norm.travelDate);
  norm.createdAt = new Date(norm.createdAt);
  norm.updatedAt = new Date(norm.updatedAt);
  return norm;
}

export const Booking = {
  find: async (filter: { userId?: string | number } = {}): Promise<BookingRow[]> => {
    if (filter.userId !== undefined) {
      const numUserId = Number(filter.userId);
      if (Number.isNaN(numUserId)) return [];
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM bookings WHERE userId = ? ORDER BY createdAt DESC",
        [numUserId]
      );
      return rows.map(normalizeBookingRow);
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM bookings ORDER BY createdAt DESC"
    );
    return rows.map(normalizeBookingRow);
  },

  findById: async (id: string | number): Promise<BookingRow | null> => {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM bookings WHERE id = ? LIMIT 1",
      [numId]
    );
    if (!rows.length) return null;
    return normalizeBookingRow(rows[0]);
  },

  create: async (data: {
    userId: string | number;
    packageId: string | number;
    travelDate: Date | string;
    travelers: number;
    contactPhone: string;
    notes?: string;
    travelerNames?: string[];
    emergencyContact?: string;
    status?: "pending" | "confirmed" | "cancelled" | "completed";
    paymentStatus?: "unpaid" | "advance_due" | "advance_paid" | "paid" | "refunded";
    paymentMethod?: string;
    transactionId?: string;
    adminNotes?: string;
    totalPriceBdt: number;
  }): Promise<BookingRow> => {
    const travelDateStr = new Date(data.travelDate).toISOString().slice(0, 19).replace("T", " ");
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO bookings 
      (userId, packageId, travelDate, travelers, contactPhone, notes, travelerNames, emergencyContact, status, paymentStatus, paymentMethod, transactionId, adminNotes, totalPriceBdt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(data.userId),
        Number(data.packageId),
        travelDateStr,
        data.travelers,
        data.contactPhone,
        data.notes ?? "",
        JSON.stringify(data.travelerNames ?? []),
        data.emergencyContact ?? "",
        data.status ?? "pending",
        data.paymentStatus ?? "unpaid",
        data.paymentMethod ?? "",
        data.transactionId ?? "",
        data.adminNotes ?? "",
        data.totalPriceBdt,
      ]
    );

    const created = await Booking.findById(result.insertId);
    if (!created) throw new Error("Failed to create booking");
    return created;
  },

  findByIdAndUpdate: async (
    id: string | number,
    data: Partial<{
      status: "pending" | "confirmed" | "cancelled" | "completed";
      paymentStatus: "unpaid" | "advance_due" | "advance_paid" | "paid" | "refunded";
      paymentMethod: string;
      transactionId: string;
      adminNotes: string;
    }>
  ): Promise<BookingRow | null> => {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) { fields.push("status = ?"); values.push(data.status); }
    if (data.paymentStatus !== undefined) { fields.push("paymentStatus = ?"); values.push(data.paymentStatus); }
    if (data.paymentMethod !== undefined) { fields.push("paymentMethod = ?"); values.push(data.paymentMethod); }
    if (data.transactionId !== undefined) { fields.push("transactionId = ?"); values.push(data.transactionId); }
    if (data.adminNotes !== undefined) { fields.push("adminNotes = ?"); values.push(data.adminNotes); }

    if (fields.length === 0) return Booking.findById(numId);

    values.push(numId);
    await pool.query(`UPDATE bookings SET ${fields.join(", ")} WHERE id = ?`, values);
    return Booking.findById(numId);
  },

  findByPackageIds: async (packageIds: number[]): Promise<(BookingRow & { userName: string; userEmail: string })[]> => {
    if (!packageIds.length) return [];
    const placeholders = packageIds.map(() => "?").join(",");
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT b.*, u.name as userName, u.email as userEmail 
       FROM bookings b 
       LEFT JOIN users u ON b.userId = u.id 
       WHERE b.packageId IN (${placeholders}) 
       ORDER BY b.createdAt DESC`,
      packageIds
    );
    return rows.map((r) => {
      const norm = normalizeBookingRow(r) as any;
      norm.userName = String(r.userName ?? "");
      norm.userEmail = String(r.userEmail ?? "");
      return norm;
    });
  },

  updateAttendanceStatus: async (
    id: string | number,
    attendanceStatus: "unchecked" | "attending" | "not_coming"
  ): Promise<BookingRow | null> => {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;
    await pool.query("UPDATE bookings SET attendanceStatus = ? WHERE id = ?", [
      attendanceStatus,
      numId,
    ]);
    return Booking.findById(numId);
  },
};
