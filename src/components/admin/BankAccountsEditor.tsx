"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPut } from "@/lib/adminApi";
import { genId } from "@/lib/id";
import ListEditor, { type FieldDef } from "./ListEditor";
import { PrimaryButton } from "./ui";

const fields: FieldDef[] = [
  { key: "bankName", label: "Bank name", type: "text" },
  { key: "accountName", label: "Account / company name", type: "text" },
  { key: "accountNumber", label: "Account number", type: "text" },
  { key: "branch", label: "Branch (optional)", type: "text" },
];

function normalize(items: Record<string, unknown>[]) {
  return items
    .map((item) => {
      const next = { ...item };
      next.bankName = String(next.bankName ?? "").trim();
      next.accountName = String(next.accountName ?? "").trim();
      next.accountNumber = String(next.accountNumber ?? "").trim();
      next.branch = String(next.branch ?? "").trim();
      return next;
    })
    .filter(
      (item) =>
        (item.bankName as string) ||
        (item.accountName as string) ||
        (item.accountNumber as string)
    );
}

export default function BankAccountsEditor() {
  const [items, setItems] = useState<Record<string, unknown>[] | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiGet<Record<string, unknown>[]>("bank-accounts")
      .then(setItems)
      .catch((e) => setStatus(`Error: ${e.message}`));
  }, []);

  if (!items) {
    return <p className="text-sm text-slate-500">{status || "Loading…"}</p>;
  }
  const list = items;

  async function save() {
    setStatus("");
    try {
      await apiPut("bank-accounts", normalize(list));
      setStatus("Saved");
    } catch (e) {
      setStatus(`Error: ${(e as Error).message}`);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-slate-900">Bank accounts</h3>
      <p className="text-xs text-slate-500">
        These accounts appear in a dropdown when creating a bill bhuktani
        letter. The selected account is printed on the letter and included in
        the email.
      </p>
      <ListEditor
        title="Bank accounts"
        fields={fields}
        items={list}
        onChange={setItems}
        labelKey="bankName"
        makeDefaults={() => ({
          id: genId("bank", list.map((i) => String(i.id))),
          bankName: "",
          accountName: "",
          accountNumber: "",
          branch: "",
          createdAt: new Date().toISOString(),
        })}
      />
      <div className="flex items-center gap-3">
        <PrimaryButton type="button" onClick={save}>
          Save
        </PrimaryButton>
        {status && <span className="text-sm text-slate-500">{status}</span>}
      </div>
    </div>
  );
}