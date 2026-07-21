import AdminSignIn from "@/components/admin-signin";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AdminSignIn next={next ?? null} />;
}
