"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DissectForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const go = (raw: string) => {
    // People paste whole posts ("CA: 0x…"); pull the address out.
    const ca = raw.match(/0x[0-9a-fA-F]{40}/)?.[0];
    if (!ca) return setError("Paste a contract address. It starts with 0x and is 42 characters long.");
    setError("");
    setBusy(true);
    router.push(`/c/${ca}`);
  };

  return (
    <form
      className={`cut ${compact ? "compact" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
    >
      <div className="cut-row">
        <span className="prompt" aria-hidden>
          ›
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="paste contract address 0x…"
          spellCheck={false}
          autoComplete="off"
          aria-label="Contract address"
        />
        {!value && (
          <button
            type="button"
            className="ghost"
            onClick={async () => {
              try {
                const t = (await navigator.clipboard.readText()).trim();
                setValue(t);
                if (/0x[0-9a-fA-F]{40}/.test(t)) go(t);
              } catch {
                setError("Couldn't read your clipboard. Long-press the box and paste.");
              }
            }}
          >
            Paste
          </button>
        )}
        <button type="submit" className="blade" disabled={busy}>
          {busy ? "Cutting…" : "Dissect"}
        </button>
      </div>
      {error && <p className="cut-err">{error}</p>}
    </form>
  );
}
