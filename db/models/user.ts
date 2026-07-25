import { pool } from "../connection";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { normalizeRow } from "./utils";

export type UserRow = {
  id: number;
  _id: number;
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "tour_guide";
  profileImage: string;
  profilePage: string;
  createdAt: Date;
  updatedAt: Date;
};

export const User = {
  async findOne(filter: { email?: string }): Promise<UserRow | null> {
    if (filter.email) {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM users WHERE email = ? LIMIT 1",
        [filter.email]
      );
      if (!rows.length) return null;
      return normalizeRow(rows[0] as UserRow);
    }
    return null;
  },

  async findById(id: string | number): Promise<UserRow | null> {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [numId]
    );
    if (!rows.length) return null;
    return normalizeRow(rows[0] as UserRow);
  },

  async find(filter: { _id?: { $in: (string | number)[] } } = {}): Promise<UserRow[]> {
    if (filter._id?.$in && filter._id.$in.length > 0) {
      const ids = filter._id.$in.map((i) => Number(i)).filter((i) => !Number.isNaN(i));
      if (ids.length === 0) return [];
      const placeholders = ids.map(() => "?").join(",");
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM users WHERE id IN (${placeholders})`,
        ids
      );
      return rows.map((r) => normalizeRow(r as UserRow));
    }
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM users ORDER BY createdAt DESC");
    return rows.map((r) => normalizeRow(r as UserRow));
  },

  async create(data: {
    name: string;
    email: string;
    password: string;
    role?: "user" | "admin" | "tour_guide";
    profileImage?: string;
    profilePage?: string;
  }): Promise<UserRow> {
    const role = data.role ?? "user";
    const profileImage = data.profileImage ?? "";
    const profilePage = data.profilePage ?? "";
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO users (name, email, password, role, profileImage, profilePage) VALUES (?, ?, ?, ?, ?, ?)",
      [data.name, data.email, data.password, role, profileImage, profilePage]
    );
    const created = await User.findById(result.insertId);
    if (!created) throw new Error("Failed to create user");
    return created;
  },

  async update(
    id: string | number,
    data: Partial<{
      name: string;
      email: string;
      password: string;
      role: "user" | "admin" | "tour_guide";
      profileImage: string;
      profilePage: string;
    }>
  ): Promise<UserRow | null> {
    const numId = Number(id);
    if (Number.isNaN(numId)) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
    if (data.email !== undefined) { fields.push("email = ?"); values.push(data.email); }
    if (data.password !== undefined) { fields.push("password = ?"); values.push(data.password); }
    if (data.role !== undefined) { fields.push("role = ?"); values.push(data.role); }
    if (data.profileImage !== undefined) { fields.push("profileImage = ?"); values.push(data.profileImage); }
    if (data.profilePage !== undefined) { fields.push("profilePage = ?"); values.push(data.profilePage); }

    if (fields.length === 0) return User.findById(numId);

    values.push(numId);
    await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    return User.findById(numId);
  },
  async findByRole(role: "user" | "admin" | "tour_guide"): Promise<UserRow[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM users WHERE role = ? ORDER BY createdAt DESC",
      [role]
    );
    return rows.map((r) => normalizeRow(r as UserRow));
  },
};
