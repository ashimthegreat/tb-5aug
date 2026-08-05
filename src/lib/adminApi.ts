export async function apiGet<T>(resource: string): Promise<T> {
  const res = await fetch(`/api/admin/${resource}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${resource}`);
  const body = await res.json();
  return body.data as T;
}

export async function apiPut(resource: string, data: unknown): Promise<void> {
  const res = await fetch(`/api/admin/${resource}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to save ${resource}`);
}
