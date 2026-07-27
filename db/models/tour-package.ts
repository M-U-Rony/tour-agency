import { pool } from "../connection";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { parseJsonField, normalizeRow } from "./utils";

export type TourPackageRow = {
  id: number;
  _id: number;
  title: string;
  location: string;
  duration: string;
  priceBdt: number;
  rating: number;
  shortDescription: string;
  imageUrl: string;
  galleryUrls: string[];
  itinerary: string[];
  inclusions: string[];
  exclusions: string[];
  pickupInfo: string;
  cancellationPolicy: string;
  availableDates: Date[];
  startDate?: Date;
  endDate?: Date;
  totalSeats: number;
  availableSeats: number;
  tourGuideId?: number | null;
  tourGuide?: {
    id: number;
    name: string;
    email: string;
    profileImage: string;
  } | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TourPackageFilter = {
  isActive?: boolean | { $ne?: boolean };
  location?: string | { $regex?: string; $options?: string };
  duration?: string | { $regex?: string; $options?: string };
  priceBdt?: number | { $gte?: number; $lte?: number };
  _id?: { $in: (string | number)[] };
};

export type TourPackageSort = Record<string, 1 | -1>;

function normalizePackageRow(row: any): TourPackageRow {
  const norm = normalizeRow(row) as TourPackageRow;
  norm.priceBdt = Number(norm.priceBdt);
  norm.rating = Number(norm.rating);
  norm.totalSeats = Number(norm.totalSeats ?? 20);
  norm.availableSeats = Number(norm.availableSeats ?? norm.totalSeats ?? 20);
  norm.tourGuideId = norm.tourGuideId ? Number(norm.tourGuideId) : null;
  norm.isActive = Boolean(norm.isActive);
  norm.galleryUrls = parseJsonField<string[]>(norm.galleryUrls, []);
  norm.itinerary = parseJsonField<string[]>(norm.itinerary, []);
  norm.inclusions = parseJsonField<string[]>(norm.inclusions, []);
  norm.exclusions = parseJsonField<string[]>(norm.exclusions, []);
  const rawDates = parseJsonField<string[]>(norm.availableDates, []);
  norm.availableDates = rawDates.map((d) => new Date(d));
  if (norm.startDate) norm.startDate = new Date(norm.startDate);
  if (norm.endDate) norm.endDate = new Date(norm.endDate);

  if (row.g_id) {
    norm.tourGuide = {
      id: Number(row.g_id),
      name: String(row.g_name ?? ""),
      email: String(row.g_email ?? ""),
      profileImage: String(row.g_profileImage ?? ""),
    };
  } else {
    norm.tourGuide = null;
  }

  return norm;
}

let columnsEnsured = false;
async function ensureColumns() {
  if (columnsEnsured) return;
  try {
    await pool.query("ALTER TABLE tour_packages ADD COLUMN startDate DATETIME NULL;");
  } catch {}
  try {
    await pool.query("ALTER TABLE tour_packages ADD COLUMN endDate DATETIME NULL;");
  } catch {}
  try {
    await pool.query("ALTER TABLE tour_packages ADD COLUMN totalSeats INT DEFAULT 20;");
  } catch {}
  try {
    await pool.query("ALTER TABLE tour_packages ADD COLUMN availableSeats INT DEFAULT 20;");
  } catch {}
  try {
    await pool.query("ALTER TABLE tour_packages ADD COLUMN tourGuideId INT DEFAULT NULL;");
  } catch {}
  columnsEnsured = true;
}

export const TourPackage = {
  async find(options?: {
    filter?: TourPackageFilter;
    sort?: TourPackageSort;
    limit?: number;
  }): Promise<TourPackageRow[]> {
    await ensureColumns();
    const filter = options?.filter ?? {};
    const whereClauses: string[] = [];
    const values: any[] = [];

    if (filter.isActive !== undefined) {
      if (typeof filter.isActive === "boolean") {
        whereClauses.push("tp.isActive = ?");
        values.push(filter.isActive);
      } else if (filter.isActive.$ne !== undefined) {
        whereClauses.push("tp.isActive != ?");
        values.push(filter.isActive.$ne);
      }
    }

    if (filter.location) {
      if (typeof filter.location === "string") {
        whereClauses.push("tp.location LIKE ?");
        values.push(`%${filter.location}%`);
      }
    }

    if (filter.duration) {
      if (typeof filter.duration === "string") {
        whereClauses.push("tp.duration LIKE ?");
        values.push(`%${filter.duration}%`);
      }
    }

    if (filter.priceBdt && typeof filter.priceBdt === "object") {
      if (filter.priceBdt.$gte !== undefined) {
        whereClauses.push("tp.priceBdt >= ?");
        values.push(filter.priceBdt.$gte);
      }
      if (filter.priceBdt.$lte !== undefined) {
        whereClauses.push("tp.priceBdt <= ?");
        values.push(filter.priceBdt.$lte);
      }
    }

    if (filter._id && Array.isArray(filter._id.$in) && filter._id.$in.length > 0) {
      const placeholders = filter._id.$in.map(() => "?").join(",");
      whereClauses.push(`tp.id IN (${placeholders})`);
      values.push(...filter._id.$in.map(Number));
    }

    let sql = `SELECT tp.*, u.id as g_id, u.name as g_name, u.email as g_email, u.profileImage as g_profileImage 
               FROM tour_packages tp 
               LEFT JOIN users u ON tp.tourGuideId = u.id`;

    if (whereClauses.length > 0) {
      sql += " WHERE " + whereClauses.join(" AND ");
    }

    const sortObj = options?.sort;
    if (sortObj) {
      const orderParts: string[] = [];
      for (const [key, val] of Object.entries(sortObj)) {
        const dir = val === 1 ? "ASC" : "DESC";
        orderParts.push(`tp.${key} ${dir}`);
      }
      if (orderParts.length > 0) {
        sql += " ORDER BY " + orderParts.join(", ");
      }
    } else {
      sql += " ORDER BY tp.id DESC";
    }

    if (options?.limit) {
      sql += " LIMIT ?";
      values.push(options.limit);
    }

    const [rows] = await pool.query<RowDataPacket[]>(sql, values);
    return rows.map(normalizePackageRow);
  },

  async findById(id: string | number): Promise<TourPackageRow | null> {
    await ensureColumns();
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT tp.*, u.id as g_id, u.name as g_name, u.email as g_email, u.profileImage as g_profileImage 
       FROM tour_packages tp 
       LEFT JOIN users u ON tp.tourGuideId = u.id 
       WHERE tp.id = ? LIMIT 1`,
      [numId]
    );
    if (!rows.length) return null;
    return normalizePackageRow(rows[0]);
  },

  async create(data: {
    title: string;
    location: string;
    duration: string;
    priceBdt: number;
    shortDescription: string;
    imageUrl: string;
    galleryUrls?: string[];
    itinerary?: string[];
    inclusions?: string[];
    exclusions?: string[];
    pickupInfo?: string;
    cancellationPolicy?: string;
    availableDates?: Date[] | string[];
    startDate?: Date | string;
    endDate?: Date | string;
    totalSeats?: number;
    availableSeats?: number;
    tourGuideId?: number | null;
    isActive?: boolean;
    rating?: number;
  }): Promise<TourPackageRow> {
    await ensureColumns();
    const startDateVal = data.startDate ? new Date(data.startDate) : null;
    const endDateVal = data.endDate ? new Date(data.endDate) : null;
    const totalSeats = data.totalSeats ?? 20;
    const availableSeats = data.availableSeats ?? totalSeats;
    const tourGuideId = data.tourGuideId ? Number(data.tourGuideId) : null;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tour_packages 
      (title, location, duration, priceBdt, rating, shortDescription, imageUrl, galleryUrls, itinerary, inclusions, exclusions, pickupInfo, cancellationPolicy, availableDates, startDate, endDate, totalSeats, availableSeats, tourGuideId, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.location,
        data.duration,
        data.priceBdt,
        data.rating ?? 0,
        data.shortDescription,
        data.imageUrl,
        JSON.stringify(data.galleryUrls ?? []),
        JSON.stringify(data.itinerary ?? []),
        JSON.stringify(data.inclusions ?? []),
        JSON.stringify(data.exclusions ?? []),
        data.pickupInfo ?? "",
        data.cancellationPolicy ?? "",
        JSON.stringify((data.availableDates ?? []).map((d) => new Date(d).toISOString())),
        startDateVal,
        endDateVal,
        totalSeats,
        availableSeats,
        tourGuideId,
        data.isActive ?? true,
      ]
    );

    const created = await TourPackage.findById(result.insertId);
    if (!created) throw new Error("Failed to create tour package");
    return created;
  },

  async findByIdAndUpdate(
    id: string | number,
    data: Partial<{
      title: string;
      location: string;
      duration: string;
      priceBdt: number;
      rating: number;
      shortDescription: string;
      imageUrl: string;
      galleryUrls: string[];
      itinerary: string[];
      inclusions: string[];
      exclusions: string[];
      pickupInfo: string;
      cancellationPolicy: string;
      availableDates: Date[] | string[];
      startDate: Date | string;
      endDate: Date | string;
      totalSeats: number;
      availableSeats: number;
      tourGuideId: number | null;
      isActive: boolean;
    }>
  ): Promise<TourPackageRow | null> {
    await ensureColumns();
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) { fields.push("title = ?"); values.push(data.title); }
    if (data.location !== undefined) { fields.push("location = ?"); values.push(data.location); }
    if (data.duration !== undefined) { fields.push("duration = ?"); values.push(data.duration); }
    if (data.priceBdt !== undefined) { fields.push("priceBdt = ?"); values.push(data.priceBdt); }
    if (data.rating !== undefined) { fields.push("rating = ?"); values.push(data.rating); }
    if (data.shortDescription !== undefined) { fields.push("shortDescription = ?"); values.push(data.shortDescription); }
    if (data.imageUrl !== undefined) { fields.push("imageUrl = ?"); values.push(data.imageUrl); }
    if (data.galleryUrls !== undefined) { fields.push("galleryUrls = ?"); values.push(JSON.stringify(data.galleryUrls)); }
    if (data.itinerary !== undefined) { fields.push("itinerary = ?"); values.push(JSON.stringify(data.itinerary)); }
    if (data.inclusions !== undefined) { fields.push("inclusions = ?"); values.push(JSON.stringify(data.inclusions)); }
    if (data.exclusions !== undefined) { fields.push("exclusions = ?"); values.push(JSON.stringify(data.exclusions)); }
    if (data.pickupInfo !== undefined) { fields.push("pickupInfo = ?"); values.push(data.pickupInfo); }
    if (data.cancellationPolicy !== undefined) { fields.push("cancellationPolicy = ?"); values.push(data.cancellationPolicy); }
    if (data.availableDates !== undefined) {
      fields.push("availableDates = ?");
      values.push(JSON.stringify(data.availableDates.map((d) => new Date(d).toISOString())));
    }
    if (data.startDate !== undefined) {
      fields.push("startDate = ?");
      values.push(data.startDate ? new Date(data.startDate) : null);
    }
    if (data.endDate !== undefined) {
      fields.push("endDate = ?");
      values.push(data.endDate ? new Date(data.endDate) : null);
    }
    if (data.totalSeats !== undefined) { fields.push("totalSeats = ?"); values.push(data.totalSeats); }
    if (data.availableSeats !== undefined) { fields.push("availableSeats = ?"); values.push(data.availableSeats); }
    if (data.tourGuideId !== undefined) {
      fields.push("tourGuideId = ?");
      values.push(data.tourGuideId ? Number(data.tourGuideId) : null);
    }
    if (data.isActive !== undefined) { fields.push("isActive = ?"); values.push(data.isActive); }

    if (fields.length === 0) return TourPackage.findById(numId);

    values.push(numId);
    await pool.query(`UPDATE tour_packages SET ${fields.join(", ")} WHERE id = ?`, values);
    return TourPackage.findById(numId);
  },

  async decrementAvailableSeats(id: string | number, count: number): Promise<void> {
    const numId = Number(id);
    if (Number.isNaN(numId)) return;
    await pool.query(
      "UPDATE tour_packages SET availableSeats = GREATEST(0, availableSeats - ?) WHERE id = ?",
      [count, numId]
    );
  },

  async incrementAvailableSeats(id: string | number, count: number): Promise<void> {
    const numId = Number(id);
    if (Number.isNaN(numId)) return;
    await pool.query(
      "UPDATE tour_packages SET availableSeats = LEAST(totalSeats, availableSeats + ?) WHERE id = ?",
      [count, numId]
    );
  },

  async findByIdAndDelete(id: string | number): Promise<TourPackageRow | null> {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;
    const existing = await TourPackage.findById(numId);
    if (!existing) return null;

    await pool.query("DELETE FROM tour_packages WHERE id = ?", [numId]);
    return existing;
  },
};
