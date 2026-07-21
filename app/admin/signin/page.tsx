import AdminSignIn from "@/components/admin-signin";

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AdminSignIn next={next ?? null} />;
}
