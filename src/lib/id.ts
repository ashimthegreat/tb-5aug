export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function genId(prefix: string, existing: string[]): string {
  const rand = Math.random().toString(36).slice(2, 6);
  let id = `${prefix}-${Date.now().toString(36)}-${rand}`;
  while (existing.includes(id)) {
    id = `${prefix}-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
  }
  return id;
}
