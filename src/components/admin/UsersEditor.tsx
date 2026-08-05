"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/adminApi";
import {
  DangerButton,
  GhostButton,
  PrimaryButton,
  Select,
  fieldInput,
} from "./ui";

type Role = "superadmin" | "sales" | "support" | "content";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "superadmin", label: "Superadmin" },
  { value: "sales", label: "Sales" },
  { value: "support", label: "Support" },
  { value: "content", label: "Content" },
];

interface DraftUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  active: boolean;
  password: string;
  createdAt: string;
}

function blankUser(): DraftUser {
  return {
    id: crypto.randomUUID(),
    name: "",
    username: "",
    role: "content",
    active: true,
    password: "",
    createdAt: new Date().toISOString(),
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
            ...u,
            password: "",
            role: u.role as Role,
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
    try {
      await apiPut("users", users);
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
        Passwords are stored hashed (scrypt). Leave the password blank on an
        existing user to keep it unchanged. You cannot delete, rename, demote,
        or deactivate your own account.
      </p>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Username</th>
              <th className="px-3 py-2 font-semibold">Role</th>
              <th className="px-3 py-2 font-semibold">Active</th>
              <th className="px-3 py-2 font-semibold">New password</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const self = u.username === currentUsername;
              return (
                <tr key={u.id} className="align-top">
                  <td className="px-3 py-2">
                    <input
                      className={fieldInput}
                      value={u.name}
                      onChange={(e) => update(u.id, { name: e.target.value })}
                      placeholder="Display name"
                    />
                  </td>
                  <td className="px-3 py-2">
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
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      label=""
                      options={ROLE_OPTIONS}
                      value={u.role}
                      disabled={self}
                      onChange={(e) =>
                        update(u.id, { role: e.target.value as Role })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
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
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="password"
                      className={fieldInput}
                      value={u.password}
                      onChange={(e) => update(u.id, { password: e.target.value })}
                      placeholder={
                        u.username ? "Leave blank to keep" : "Required"
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <DangerButton
                      type="button"
                      onClick={() => remove(u.id)}
                      disabled={self}
                    >
                      Delete
                    </DangerButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
