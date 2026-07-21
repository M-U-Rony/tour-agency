import { pool } from "../connection";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { normalizeRow } from "./utils";

export type CustomTripRequestRow = {
  id: number;
  _id: number;
  destination: string;
  additionalDestinations: string;
  tripType: string;
  departureDate: Date;
  returnDate: Date;
  travelers: number;
  children: number;
  budget: string;
  accommodation: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  status: "new" | "contacted" | "quoted" | "closed";
  adminNotes: string;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeCustomTripRow(row: any): CustomTripRequestRow {
  const norm = normalizeRow(row) as CustomTripRequestRow;
  norm.travelers = Number(norm.travelers);
  norm.children = Number(norm.children);
  norm.departureDate = new Date(norm.departureDate);
  norm.returnDate = new Date(norm.returnDate);
  norm.createdAt = new Date(norm.createdAt);
  norm.updatedAt = new Date(norm.updatedAt);
  return norm;
}

export const CustomTripRequest = {
  async find(filter: { email?: string } = {}): Promise<CustomTripRequestRow[]> {
    if (filter.email) {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM custom_trip_requests WHERE email = ? ORDER BY createdAt DESC",
        [filter.email]
      );
      return rows.map(normalizeCustomTripRow);
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM custom_trip_requests ORDER BY createdAt DESC"
    );
    return rows.map(normalizeCustomTripRow);
  },

  async findById(id: string | number): Promise<CustomTripRequestRow | null> {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM custom_trip_requests WHERE id = ? LIMIT 1",
      [numId]
    );
    if (!rows.length) return null;
    return normalizeCustomTripRow(rows[0]);
  },

  async create(data: {
    destination: string;
    additionalDestinations?: string;
    tripType: string;
    departureDate: Date | string;
    returnDate: Date | string;
    travelers: number;
    children?: number;
    budget: string;
    accommodation?: string;
    name: string;
    email: string;
    phone: string;
    notes?: string;
    status?: "new" | "contacted" | "quoted" | "closed";
    adminNotes?: string;
  }): Promise<CustomTripRequestRow> {
    const depDateStr = new Date(data.departureDate).toISOString().slice(0, 19).replace("T", " ");
    const retDateStr = new Date(data.returnDate).toISOString().slice(0, 19).replace("T", " ");

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO custom_trip_requests
      (destination, additionalDestinations, tripType, departureDate, returnDate, travelers, children, budget, accommodation, name, email, phone, notes, status, adminNotes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.destination,
        data.additionalDestinations ?? "",
        data.tripType,
        depDateStr,
        retDateStr,
        data.travelers,
        data.children ?? 0,
        data.budget,
        data.accommodation ?? "",
        data.name,
        data.email,
        data.phone,
        data.notes ?? "",
        data.status ?? "new",
        data.adminNotes ?? "",
      ]
    );

    const created = await CustomTripRequest.findById(result.insertId);
    if (!created) throw new Error("Failed to create custom trip request");
    return created;
  },

  async findByIdAndUpdate(
    id: string | number,
    data: Partial<{
      status: "new" | "contacted" | "quoted" | "closed";
      adminNotes: string;
    }>
  ): Promise<CustomTripRequestRow | null> {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) { fields.push("status = ?"); values.push(data.status); }
    if (data.adminNotes !== undefined) { fields.push("adminNotes = ?"); values.push(data.adminNotes); }

    if (fields.length === 0) return CustomTripRequest.findById(numId);

    values.push(numId);
    await pool.query(`UPDATE custom_trip_requests SET ${fields.join(", ")} WHERE id = ?`, values);
    return CustomTripRequest.findById(numId);
  },
};
