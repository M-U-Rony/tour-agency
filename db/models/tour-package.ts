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
  maxTravelers: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TourPackageFilter = {
  isActive?: boolean | { $ne?: boolean };
  location?: string | { $regex?: string; $options?: string };
  duration?: string | { $regex?: string; $options?: string };
  maxTravelers?: number | { $gte?: number };
  priceBdt?: number | { $gte?: number; $lte?: number };
  _id?: { $in: (string | number)[] };
};

export type TourPackageSort = Record<string, 1 | -1>;

function normalizePackageRow(row: any): TourPackageRow {
  const norm = normalizeRow(row) as TourPackageRow;
  norm.priceBdt = Number(norm.priceBdt);
  norm.rating = Number(norm.rating);
  norm.maxTravelers = Number(norm.maxTravelers);
  norm.isActive = Boolean(norm.isActive);
  norm.galleryUrls = parseJsonField<string[]>(norm.galleryUrls, []);
  norm.itinerary = parseJsonField<string[]>(norm.itinerary, []);
  norm.inclusions = parseJsonField<string[]>(norm.inclusions, []);
  norm.exclusions = parseJsonField<string[]>(norm.exclusions, []);
  const rawDates = parseJsonField<string[]>(norm.availableDates, []);
  norm.availableDates = rawDates.map((d) => new Date(d));
  return norm;
}

export const TourPackage = {
  async find(options?: {
    filter?: TourPackageFilter;
    sort?: TourPackageSort;
    limit?: number;
  }): Promise<TourPackageRow[]> {
    const filter = options?.filter ?? {};
    const sort = options?.sort;
    const limit = options?.limit;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (filter._id?.$in && filter._id.$in.length > 0) {
      const ids = filter._id.$in.map((i) => Number(i)).filter((i) => !Number.isNaN(i));
      if (ids.length === 0) return [];
      whereClauses.push(`id IN (${ids.map(() => "?").join(",")})`);
      params.push(...ids);
    }

    if (filter.isActive !== undefined) {
      if (typeof filter.isActive === "boolean") {
        whereClauses.push("isActive = ?");
        params.push(filter.isActive);
      } else if (typeof filter.isActive === "object" && filter.isActive.$ne !== undefined) {
        whereClauses.push("isActive != ?");
        params.push(filter.isActive.$ne);
      }
    }

    if (filter.location) {
      const locStr = typeof filter.location === "string" ? filter.location : filter.location.$regex ?? "";
      if (locStr) {
        whereClauses.push("location LIKE ?");
        params.push(`%${locStr}%`);
      }
    }

    if (filter.duration) {
      const durStr = typeof filter.duration === "string" ? filter.duration : filter.duration.$regex ?? "";
      if (durStr) {
        whereClauses.push("duration LIKE ?");
        params.push(`%${durStr}%`);
      }
    }

    if (filter.maxTravelers) {
      const mt = typeof filter.maxTravelers === "number" ? filter.maxTravelers : filter.maxTravelers.$gte ?? 0;
      if (mt > 0) {
        whereClauses.push("maxTravelers >= ?");
        params.push(mt);
      }
    }

    if (filter.priceBdt && typeof filter.priceBdt === "object") {
      if (filter.priceBdt.$gte !== undefined) {
        whereClauses.push("priceBdt >= ?");
        params.push(filter.priceBdt.$gte);
      }
      if (filter.priceBdt.$lte !== undefined) {
        whereClauses.push("priceBdt <= ?");
        params.push(filter.priceBdt.$lte);
      }
    }

    let query = "SELECT * FROM tour_packages";
    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    if (sort) {
      const sortParts: string[] = [];
      for (const [key, dir] of Object.entries(sort)) {
        sortParts.push(`${key} ${dir === -1 ? "DESC" : "ASC"}`);
      }
      if (sortParts.length > 0) {
        query += " ORDER BY " + sortParts.join(", ");
      }
    } else {
      query += " ORDER BY createdAt DESC";
    }

    if (limit && limit > 0) {
      query += " LIMIT ?";
      params.push(limit);
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return rows.map(normalizePackageRow);
  },

  async findById(id: string | number): Promise<TourPackageRow | null> {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM tour_packages WHERE id = ? LIMIT 1",
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
    maxTravelers?: number;
    isActive?: boolean;
    rating?: number;
  }): Promise<TourPackageRow> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO tour_packages 
      (title, location, duration, priceBdt, rating, shortDescription, imageUrl, galleryUrls, itinerary, inclusions, exclusions, pickupInfo, cancellationPolicy, availableDates, maxTravelers, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        data.maxTravelers ?? 20,
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
      maxTravelers: number;
      isActive: boolean;
    }>
  ): Promise<TourPackageRow | null> {
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
    if (data.maxTravelers !== undefined) { fields.push("maxTravelers = ?"); values.push(data.maxTravelers); }
    if (data.isActive !== undefined) { fields.push("isActive = ?"); values.push(data.isActive); }

    if (fields.length === 0) return TourPackage.findById(numId);

    values.push(numId);
    await pool.query(`UPDATE tour_packages SET ${fields.join(", ")} WHERE id = ?`, values);
    return TourPackage.findById(numId);
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
