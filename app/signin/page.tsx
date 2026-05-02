import SignIn from "@/components/signin";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <SignIn next={next ?? null} />;
}
