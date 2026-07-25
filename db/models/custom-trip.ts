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
  userId?: number | null;
  tourGuideId?: number | null;
  tourGuide?: {
    id: string;
    name: string;
    email: string;
    profileImage: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeCustomTripRow(row: any): CustomTripRequestRow {
  const norm = normalizeRow(row) as CustomTripRequestRow;
  norm.travelers = Number(norm.travelers);
  norm.children = Number(norm.children);
  norm.userId = row.userId ? Number(row.userId) : null;
  norm.tourGuideId = row.tourGuideId ? Number(row.tourGuideId) : null;
  norm.departureDate = new Date(norm.departureDate);
  norm.returnDate = new Date(norm.returnDate);
  norm.createdAt = new Date(norm.createdAt);
  norm.updatedAt = new Date(norm.updatedAt);

  if (row.g_id) {
    norm.tourGuide = {
      id: String(row.g_id),
      name: String(row.g_name ?? ""),
      email: String(row.g_email ?? ""),
      profileImage: String(row.g_profileImage ?? ""),
    };
  } else {
    norm.tourGuide = null;
  }

  return norm;
}

const SELECT_QUERY = `
  SELECT ctr.*, 
         u.id as g_id, u.name as g_name, u.email as g_email, u.profileImage as g_profileImage
  FROM custom_trip_requests ctr
  LEFT JOIN users u ON ctr.tourGuideId = u.id
`;

export const CustomTripRequest = {
  find: async (filter: { email?: string; userId?: string | number; tourGuideId?: string | number } = {}): Promise<CustomTripRequestRow[]> => {
    if (filter.tourGuideId) {
      const numGuideId = Number(filter.tourGuideId);
      if (Number.isNaN(numGuideId)) return [];
      const [rows] = await pool.query<RowDataPacket[]>(
        `${SELECT_QUERY} WHERE ctr.tourGuideId = ? ORDER BY ctr.createdAt DESC`,
        [numGuideId]
      );
      return rows.map(normalizeCustomTripRow);
    }
    if (filter.userId) {
      const numUserId = Number(filter.userId);
      if (Number.isNaN(numUserId)) return [];
      const [rows] = await pool.query<RowDataPacket[]>(
        `${SELECT_QUERY} WHERE ctr.userId = ? OR ctr.email = ? ORDER BY ctr.createdAt DESC`,
        [numUserId, filter.email ?? ""]
      );
      return rows.map(normalizeCustomTripRow);
    }
    if (filter.email) {
      const [rows] = await pool.query<RowDataPacket[]>(
        `${SELECT_QUERY} WHERE ctr.email = ? ORDER BY ctr.createdAt DESC`,
        [filter.email]
      );
      return rows.map(normalizeCustomTripRow);
    }
    const [rows] = await pool.query<RowDataPacket[]>(
      `${SELECT_QUERY} ORDER BY ctr.createdAt DESC`
    );
    return rows.map(normalizeCustomTripRow);
  },

  findById: async (id: string | number): Promise<CustomTripRequestRow | null> => {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;
    const [rows] = await pool.query<RowDataPacket[]>(
      `${SELECT_QUERY} WHERE ctr.id = ? LIMIT 1`,
      [numId]
    );
    if (!rows.length) return null;
    return normalizeCustomTripRow(rows[0]);
  },

  create: async (data: {
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
    userId?: string | number | null;
    tourGuideId?: string | number | null;
  }): Promise<CustomTripRequestRow> => {
    const depDateStr = new Date(data.departureDate).toISOString().slice(0, 19).replace("T", " ");
    const retDateStr = new Date(data.returnDate).toISOString().slice(0, 19).replace("T", " ");

    const numUserId = data.userId ? Number(data.userId) : null;
    const numGuideId = data.tourGuideId ? Number(data.tourGuideId) : null;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO custom_trip_requests
      (destination, additionalDestinations, tripType, departureDate, returnDate, travelers, children, budget, accommodation, name, email, phone, notes, status, adminNotes, userId, tourGuideId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        numUserId,
        numGuideId,
      ]
    );

    const created = await CustomTripRequest.findById(result.insertId);
    if (!created) throw new Error("Failed to create custom trip request");
    return created;
  },

  findByIdAndUpdate: async (
    id: string | number,
    data: Partial<{
      status: "new" | "contacted" | "quoted" | "closed";
      adminNotes: string;
      userId: string | number | null;
      tourGuideId: string | number | null;
    }>
  ): Promise<CustomTripRequestRow | null> => {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) { fields.push("status = ?"); values.push(data.status); }
    if (data.adminNotes !== undefined) { fields.push("adminNotes = ?"); values.push(data.adminNotes); }
    if (data.userId !== undefined) {
      fields.push("userId = ?");
      values.push(data.userId ? Number(data.userId) : null);
    }
    if (data.tourGuideId !== undefined) {
      fields.push("tourGuideId = ?");
      values.push(data.tourGuideId ? Number(data.tourGuideId) : null);
    }

    if (fields.length === 0) return CustomTripRequest.findById(numId);

    values.push(numId);
    await pool.query(`UPDATE custom_trip_requests SET ${fields.join(", ")} WHERE id = ?`, values);
    return CustomTripRequest.findById(numId);
  },
};
