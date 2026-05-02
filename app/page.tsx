import Landing from "@/components/landing";
import { DbConnect } from "@/db/connection";
import { TourPackage } from "@/db/models";
import { serializeTourPackage, type TourPackageDTO } from "@/lib/tour-package";
import { getAuthFromCookies } from "@/lib/auth-api";
import { User } from "@/db/models";
import { toAuthUser, type AuthUser } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

type LeanPackage = {
  _id: unknown;
  title: string;
  location: string;
  duration: string;
  priceBdt: number;
  rating: number;
  shortDescription: string;
  imageUrl: string;
};

type LeanUser = {
  _id: unknown;
  name: string;
  email: string;
  role: string;
};

export default async function Home() {
  let topPackages: TourPackageDTO[] = [];
  let currentUser: AuthUser | null = null;

  try {
    await DbConnect();
    const docs = await TourPackage.find()
      .sort({ rating: -1, createdAt: -1 })
      .limit(3)
      .lean<LeanPackage[]>();
    topPackages = docs.map((doc) => serializeTourPackage(doc));
  } catch {
    topPackages = [];
  }

  try {
    const auth = await getAuthFromCookies();
    if (auth) {
      const userDoc = await User.findById(auth.userId)
        .select("name email role")
        .lean<LeanUser | null>();
      if (userDoc) currentUser = toAuthUser(userDoc);
    }
  } catch {
    currentUser = null;
  }

  return <Landing topPackages={topPackages} currentUser={currentUser} />;
}
