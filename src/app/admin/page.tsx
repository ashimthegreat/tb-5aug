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
      user={{
        name: user.name,
        username: user.username,
        email: user.email,
        smtpHost: user.smtpHost,
        smtpPort: user.smtpPort,
        signatory: user.signatory,
        designation: user.designation,
        signature: user.signature,
        role: user.role,
      }}
    />
  );
}
