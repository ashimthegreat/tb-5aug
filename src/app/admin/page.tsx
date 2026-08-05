import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/admin";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Admin — TechBucket",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) return <AdminLogin />;
  return (
    <AdminShell
      user={{ name: user.name, username: user.username, role: user.role }}
    />
  );
}
