import type { Metadata } from "next";
import { isAuthed } from "@/lib/admin";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin — TechBucket",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const authed = await isAuthed();
  if (!authed) return <AdminLogin />;
  return <AdminShell />;
}
