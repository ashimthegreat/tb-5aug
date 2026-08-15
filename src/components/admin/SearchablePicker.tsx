"use client";

import { useEffect, useRef, useState } from "react";

export default function SearchablePicker({
  placeholder,
  items,
  onPick,
  disabled,
}: {
  placeholder: string;
  items: string[];
  onPick: (value: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = items.filter((i) =>
    i.toLowerCase().includes(query.trim().toLowerCase())
  );

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  function pick(value: string) {
    onPick(value);
    setQuery("");
    setIdx(-1);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        className="w-52 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        placeholder={placeholder}
        value={query}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIdx(-1);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setIdx((i) => (filtered.length ? (i + 1) % filtered.length : -1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIdx((i) =>
              filtered.length ? (i - 1 + filtered.length) % filtered.length : -1
            );
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[idx]) pick(filtered[idx]);
            else if (filtered.length === 1) pick(filtered[0]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-50 mt-1 max-h-64 w-full min-w-52 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
          ) : (
            filtered.map((item, i) => (
              <li key={item} role="option" aria-selected={i === idx}>
                <button
                  type="button"
                  className={`block w-full truncate px-3 py-1.5 text-left text-sm ${
                    i === idx
                      ? "bg-brand-50 font-medium text-brand-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(item)}
                >
                  {item}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}