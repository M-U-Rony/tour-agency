import type { Metadata } from "next";
import { getAuthFromCookies } from "@/lib/auth-api";
import ContactPageContent from "@/components/contact-page-content";

export const metadata: Metadata = {
  title: "Contact & Custom Trip Request – ExploreBD",
  description:
    "Can't find your dream destination in our packages? Submit a custom trip request and our team will plan a personalised tour just for you.",
};

export default async function ContactPage() {
  const auth = await getAuthFromCookies();
  return <ContactPageContent isAuthed={!!auth} />;
}
