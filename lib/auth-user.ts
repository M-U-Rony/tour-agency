export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin" | "tour_guide";
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
  const role =
    user.role === "admin"
      ? "admin"
      : user.role === "tour_guide"
      ? "tour_guide"
      : "user";
  return {
    id: String(user._id),
    username: user.name,
    email: user.email,
    role,
    profileImage: user.profileImage ?? "",
    profilePage: user.profilePage ?? "",
  };
}
