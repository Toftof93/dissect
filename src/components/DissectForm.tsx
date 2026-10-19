"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const EXAMPLES = [{ label: "Pons launchpad", ca: "0x7ed598bcef8bd9edd8c97a195c6d13f40801ec7e" }];

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
      {!compact && (
        <div className="examples">
          <span>Try:</span>
          {EXAMPLES.map((e) => (
            <button key={e.ca} type="button" onClick={() => go(e.ca)}>
              {e.label}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
