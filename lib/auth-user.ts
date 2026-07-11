export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  profileImage?: string;
  profilePage?: string;
};

export type UserDoc = {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  profilePage?: string;
};

export function toAuthUser(user: UserDoc): AuthUser {
  return {
    id: String(user._id),
    username: user.name,
    email: user.email,
    role: user.role === "admin" ? "admin" : "user",
    profileImage: user.profileImage ?? "",
    profilePage: user.profilePage ?? "",
  };
}
