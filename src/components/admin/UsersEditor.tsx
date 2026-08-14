"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/adminApi";
import {
  DangerButton,
  GhostButton,
  Label,
  PrimaryButton,
  Select,
  fieldInput,
} from "./ui";

type Role = "superadmin" | "sales" | "saleshead" | "support" | "content" | "logistics";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "superadmin", label: "Superadmin" },
  { value: "saleshead", label: "Sales Head" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "content", label: "Content" },
  { value: "logistics", label: "Logistics" },
];

interface DraftUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  active: boolean;
  createdAt: string;
  email: string;
  smtpHost: string;
  smtpPort: string;
  password: string;
  smtpPassword: string;
}

function blankUser(): DraftUser {
  return {
    id: crypto.randomUUID(),
    name: "",
    username: "",
    role: "content",
    active: true,
    createdAt: new Date().toISOString(),
    email: "",
    smtpHost: "",
    smtpPort: "",
    password: "",
    smtpPassword: "",
  };
}

export default function UsersEditor({
  currentUsername,
}: {
  currentUsername: string;
}) {
  const [users, setUsers] = useState<DraftUser[] | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiGet<DraftUser[]>("users")
      .then((data) =>
        setUsers(
          data.map((u) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            role: u.role as Role,
            active: u.active,
            createdAt: u.createdAt,
            email: u.email ?? "",
            smtpHost: u.smtpHost ?? "",
            smtpPort: u.smtpPort ? String(u.smtpPort) : "",
            password: "",
            smtpPassword: "",
          }))
        )
      )
      .catch((e) => setStatus(`Error: ${e.message}`));
  }, []);

  function update(id: string, patch: Partial<DraftUser>) {
    setUsers((prev) =>
      prev ? prev.map((u) => (u.id === id ? { ...u, ...patch } : u)) : prev
    );
  }

  function addUser() {
    setUsers((prev) => (prev ? [blankUser(), ...prev] : [blankUser()]));
    setStatus("");
  }

  function remove(id: string) {
    setUsers((prev) => (prev ? prev.filter((u) => u.id !== id) : prev));
    setStatus("");
  }

  async function save() {
    if (!users) return;
    setStatus("");
    const payload = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt,
      password: u.password || undefined,
      email: u.email,
      smtpHost: u.smtpHost,
      smtpPort: u.smtpPort === "" ? null : Number(u.smtpPort),
      smtpPassword: u.smtpPassword || undefined,
    }));
    try {
      await apiPut("users", payload);
      setStatus("Saved");
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  }

  if (!users) {
    return <p className="text-sm text-slate-500">{status || "Loading…"}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">
          Admin users ({users.length})
        </h3>
        <div className="flex items-center gap-2">
          {status && <span className="text-sm text-slate-500">{status}</span>}
          <GhostButton type="button" onClick={addUser}>
            + Add user
          </GhostButton>
          <PrimaryButton type="button" onClick={save}>
            Save
          </PrimaryButton>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Passwords and SMTP passwords are stored encrypted. Leave a password
        blank to keep the current one. SMTP host/port default to the email
        provider (Gmail, Outlook, Zoho, Yahoo…) when left blank. Quotes are
        sent from the salesperson&apos;s own email. Gmail/Outlook need an App
        Password, not your normal login password. You cannot delete, rename,
        demote, or deactivate your own account.
      </p>

      <ul className="space-y-3">
        {users.map((u) => {
          const self = u.username === currentUsername;
          return (
            <li
              key={u.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {u.name || "Untitled user"}
                  </p>
                  <span className="text-xs text-slate-400">@{u.username}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {u.role}
                  </span>
                  {!u.active && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Inactive
                    </span>
                  )}
                </div>
                <DangerButton
                  type="button"
                  onClick={() => remove(u.id)}
                  disabled={self}
                >
                  Delete
                </DangerButton>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label>Name</Label>
                  <input
                    className={fieldInput}
                    value={u.name}
                    onChange={(e) => update(u.id, { name: e.target.value })}
                    placeholder="Display name"
                  />
                </div>
                <div>
                  <Label>Username</Label>
                  <input
                    className={fieldInput}
                    value={u.username}
                    disabled={self}
                    onChange={(e) =>
                      update(u.id, {
                        username: e.target.value.trim().toLowerCase(),
                      })
                    }
                    placeholder="username"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select
                    label=""
                    options={ROLE_OPTIONS}
                    value={u.role}
                    disabled={self}
                    onChange={(e) =>
                      update(u.id, { role: e.target.value as Role })
                    }
                  />
                </div>
                <div>
                  <Label>Active</Label>
                  <label className="flex h-9 items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={u.active}
                      disabled={self}
                      onChange={(e) =>
                        update(u.id, { active: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {u.active ? "Active" : "Inactive"}
                  </label>
                </div>
                <div>
                  <Label>Email (used to send quotes)</Label>
                  <input
                    className={fieldInput}
                    type="email"
                    value={u.email}
                    onChange={(e) => update(u.id, { email: e.target.value })}
                    placeholder="sales@example.com"
                  />
                </div>
                <div>
                  <Label>SMTP host</Label>
                  <input
                    className={fieldInput}
                    value={u.smtpHost}
                    onChange={(e) => update(u.id, { smtpHost: e.target.value })}
                    placeholder="(auto)"
                  />
                </div>
                <div>
                  <Label>SMTP port</Label>
                  <input
                    className={fieldInput}
                    type="number"
                    value={u.smtpPort}
                    onChange={(e) => update(u.id, { smtpPort: e.target.value })}
                    placeholder="(auto)"
                  />
                </div>
                <div>
                  <Label>SMTP password</Label>
                  <input
                    className={fieldInput}
                    type="password"
                    value={u.smtpPassword}
                    onChange={(e) =>
                      update(u.id, { smtpPassword: e.target.value })
                    }
                    placeholder="Blank = keep"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <Label>Login password</Label>
                  <input
                    className={fieldInput}
                    type="password"
                    value={u.password}
                    onChange={(e) => update(u.id, { password: e.target.value })}
                    placeholder={u.username ? "Blank = keep" : "Required"}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
