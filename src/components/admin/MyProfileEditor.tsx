"use client";

import { useState } from "react";
import { GhostButton, Label, PrimaryButton, fieldInput } from "./ui";
import ImageUpload from "./ImageUpload";

export default function MyProfileEditor({
  user,
}: {
  user: {
    name: string;
    username: string;
    email?: string;
    smtpHost?: string;
    smtpPort?: number | null;
    signatory?: string;
    designation?: string;
    signature?: string;
  };
}) {
  const [email, setEmail] = useState(user.email ?? "");
  const [smtpHost, setSmtpHost] = useState(user.smtpHost ?? "");
  const [smtpPort, setSmtpPort] = useState(
    user.smtpPort ? String(user.smtpPort) : ""
  );
  const [signatory, setSignatory] = useState(user.signatory ?? "");
  const [designation, setDesignation] = useState(user.designation ?? "");
  const [signature, setSignature] = useState(user.signature ?? "");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [testStatus, setTestStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function save() {
    setStatus("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          smtpHost,
          smtpPort: smtpPort === "" ? null : Number(smtpPort),
          smtpPassword: smtpPassword || undefined,
          password: password || undefined,
          signatory: signatory.trim() || undefined,
          designation: designation.trim() || undefined,
          signature: signature.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (res.ok) {
        setStatus("Saved");
        setSmtpPassword("");
        setPassword("");
      } else {
        setStatus(`Error: ${body.error || "could not save"}`);
      }
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTestStatus("");
    setTesting(true);
    try {
      await save();
      const res = await fetch("/api/admin/me/test", { method: "POST" });
      const body = await res.json();
      if (res.ok) {
        setTestStatus(`Test email sent to ${body.to} — check your inbox.`);
      } else {
        setTestStatus(`Test failed: ${body.error || "could not send"}`);
      }
    } catch (e) {
      setTestStatus(`Test failed: ${(e as Error).message}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <h3 className="text-base font-semibold text-slate-900">My profile</h3>
      <p className="text-xs text-slate-500">
        Signed in as <span className="font-medium text-slate-700">{user.name}</span>{" "}
        (@{user.username}). Set the email and SMTP details used to send quotes to
        customers. Quotes are sent from your own email address. SMTP host/port
        default to your provider (Gmail, Outlook, Zoho, Yahoo…) when left blank.
        Gmail/Outlook need an App Password, not your normal login password.
        Leave &quot;Signatory name&quot; blank to sign letters with your login name.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Email (used to send quotes)</Label>
          <input
            className={fieldInput}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sales@example.com"
          />
        </div>
        <div>
          <Label>SMTP host</Label>
          <input
            className={fieldInput}
            value={smtpHost}
            onChange={(e) => setSmtpHost(e.target.value)}
            placeholder="(auto)"
          />
        </div>
        <div>
          <Label>SMTP port</Label>
          <input
            className={fieldInput}
            type="number"
            value={smtpPort}
            onChange={(e) => setSmtpPort(e.target.value)}
            placeholder="(auto)"
          />
        </div>
<div>
          <Label>Login password</Label>
          <input
            className={fieldInput}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Blank = keep (min 8 chars)"
            autoComplete="new-password"
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Signatory name (used on quotations and suchidarta)</Label>
          <input
            className={fieldInput}
            type="text"
            value={signatory}
            onChange={(e) => setSignatory(e.target.value)}
            placeholder={user.name}
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Designation / पद (used on quotations and suchidarta)</Label>
          <input
            className={fieldInput}
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="Managing Director"
          />
        </div>
        <div className="sm:col-span-2">
          <ImageUpload
            label="Signature image · दस्तखत (PNG)"
            value={signature}
            onChange={(url) => setSignature(url)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <PrimaryButton type="button" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </PrimaryButton>
        <GhostButton type="button" onClick={sendTest} disabled={testing}>
          {testing ? "Sending test…" : "Send test email to me"}
        </GhostButton>
        {status && <span className="text-sm text-slate-500">{status}</span>}
      </div>
      {testStatus && (
        <p className="text-sm text-slate-600">{testStatus}</p>
      )}
    </div>
  );
}
