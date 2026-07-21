import Landing from "@/components/landing";
import { DbConnect } from "@/db/connection";
import { TourPackage, User } from "@/db/models";
import { serializeTourPackage, type TourPackageDTO } from "@/lib/tour-package";
import { getAuthFromCookies } from "@/lib/auth-api";
import { toAuthUser, type AuthUser, type UserDoc } from "@/lib/auth-user";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  let topPackages: TourPackageDTO[] = [];
  let currentUser: AuthUser | null = null;

  try {
    await DbConnect();
    const docs = await TourPackage.find({
      sort: { rating: -1, createdAt: -1 },
      limit: 3,
    });
    topPackages = docs.map((doc) => serializeTourPackage(doc));
  } catch {
    topPackages = [];
  }

  try {
    const auth = await getAuthFromCookies();
    if (auth) {
      const userDoc = await User.findById(auth.userId);
      if (userDoc) currentUser = toAuthUser(userDoc as unknown as UserDoc);
    }
  } catch {
    currentUser = null;
  }

  if (currentUser) {
    redirect(currentUser.role === "admin" ? "/admin/dashboard" : "/dashboard");
  }

  return <Landing topPackages={topPackages} currentUser={currentUser} />;
}
