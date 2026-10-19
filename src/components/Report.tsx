import { explorerLink } from "@/lib/chain";
import type { Specimen } from "@/lib/dissect";
import type { Finding } from "@/lib/diagnose";
import type { Organ } from "@/lib/signatures";
import { SITE_URL } from "@/lib/social";
import { CopyButton } from "./CopyButton";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const LABEL = { clean: "Clean", suspicious: "Suspicious", malignant: "Malignant" };
const LEVEL: Record<Finding["level"], string> = { lethal: "LETHAL", warn: "WARNING", note: "NOTE", clean: "CLEAN" };
const ORGAN: Record<Organ, string> = {
  token: "token", ownership: "owner", mint: "mint", burn: "burn", blacklist: "blacklist", tax: "tax", trading: "trading",
  limits: "limits", drain: "withdraw", upgrade: "upgrade", swap: "dex", info: "info",
};
const DANGER = new Set<Organ>(["mint", "blacklist", "tax", "drain", "upgrade", "trading"]);

function fmtReading(sig: string, value: string, decimals: number) {
  if (/^0x[0-9a-fA-F]{40}$/.test(value)) return value === "0x0000000000000000000000000000000000000000" ? "nobody (0x000…000)" : short(value);
  if (/^\d+$/.test(value) && value.length > 12 && /(supply|max|amount|wallet)/i.test(sig)) {
    const n = Number(BigInt(value) / 10n ** BigInt(Math.max(0, decimals - 2))) / 100;
    return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return value;
}

export function Report({ s, at }: { s: Specimen; at: number }) {
  const d = s.diagnosis;
  const decimals = Number(s.readings.find((r) => r.sig === "decimals()")?.value ?? 18);
  const lethal = d.findings.filter((f) => f.level === "lethal");
  const shareText =
    `Dissected ${s.symbol ? "$" + s.symbol : short(s.address)} 🔪\n\n` +
    `Verdict: ${LABEL[d.verdict].toUpperCase()} (threat ${d.threat}/100)\n` +
    (lethal.length ? lethal.slice(0, 3).map((f) => `🔴 ${f.title}`).join("\n") : d.findings.filter((f) => f.level === "clean").slice(0, 3).map((f) => `✓ ${f.title}`).join("\n")) +
    `\n\nCut any contract open 👇`;
  const shareUrl = `https://x.com/intent/post?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(`${SITE_URL}/c/${s.address}`)}`;
  const named = s.functions.filter((f) => f.sig);
  const mystery = s.functions.filter((f) => !f.sig);

  return (
    <div className="report">
      <header className="specimen">
        <p className="label">Specimen</p>
        <h1>
          {s.name ?? s.contractName ?? "Unnamed contract"} {s.symbol && <span className="sym">${s.symbol}</span>}
        </h1>
        <div className="ca">
          <code>{s.address}</code>
          <CopyButton text={s.address} label="Copy" />
          <a className="chip" href={explorerLink("address", s.address)} target="_blank" rel="noreferrer">
            Explorer ↗
          </a>
        </div>
        <dl className="vitals">
          <div><dt>Source</dt><dd>{s.verified ? "Public" : s.verified === false ? "Sealed" : "Unknown"}</dd></div>
          <div><dt>Size</dt><dd>{(s.anatomy.size / 1024).toFixed(1)} KB</dd></div>
          <div><dt>Functions</dt><dd>{s.functions.length}</dd></div>
          {s.anatomy.solc && <div><dt>Compiler</dt><dd>solc {s.anatomy.solc}</dd></div>}
          {s.implementation && <div><dt>Real code at</dt><dd><a href={explorerLink("address", s.implementation)} target="_blank" rel="noreferrer">{short(s.implementation)}</a></dd></div>}
        </dl>
      </header>

      <section className={`verdict ${d.verdict}`}>
        <div className="incision" aria-hidden />
        <p className="label">Verdict</p>
        <h2>{LABEL[d.verdict]}.</h2>
        <p className="headline">{d.headline}</p>
        <div className="meter" aria-label={`Threat ${d.threat} out of 100`}>
          <span style={{ width: `${Math.max(2, d.threat)}%` }} />
        </div>
        <p className="meter-label">
          Threat <b>{d.threat}</b>/100
        </p>
        <a className="btn-x" href={shareUrl} target="_blank" rel="noreferrer">
          Share the autopsy on X
        </a>
      </section>

      <section className="block">
        <h3>Findings</h3>
        <ul className="findings">
          {d.findings.map((f) => (
            <li key={f.id} className={f.level}>
              <span className="lvl">{LEVEL[f.level]}</span>
              <div>
                <b>{f.title}</b>
                <p>{f.detail}</p>
                {f.fns && f.fns.length > 0 && (
                  <div className="fns">
                    {f.fns.slice(0, 8).map((x) => (
                      <code key={x}>{x.length === 42 ? short(x) : x}</code>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {s.readings.length > 0 && (
        <section className="block">
          <h3>Live readings</h3>
          <dl className="readings">
            {s.readings.map((r) => (
              <div key={r.sig}>
                <dt>{r.sig}</dt>
                <dd>{fmtReading(r.sig, r.value, decimals)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="block">
        <h3>Organs · every function inside</h3>
        <ul className="organs">
          {named.map((f) => (
            <li key={f.selector} className={f.organ && DANGER.has(f.organ) && !f.view ? "hot" : ""}>
              <code className="sel">{f.selector}</code>
              <code className="sig">{f.sig}</code>
              {f.organ && <span className="tag">{ORGAN[f.organ]}</span>}
            </li>
          ))}
          {mystery.map((f) => (
            <li key={f.selector} className="mystery">
              <code className="sel">{f.selector}</code>
              <code className="sig">??? unnamed</code>
              <span className="tag">mystery</span>
            </li>
          ))}
        </ul>
      </section>

      <details className="block raw">
        <summary>Open the raw tissue (disassembly)</summary>
        <pre>{s.disassembly}</pre>
      </details>

      <p className="fine center">
        Dissected {new Date(at * 1000).toUTCString().slice(5, 22)} UTC from Robinhood Chain bytecode. Findings are read from code, not promises. Not financial advice.
      </p>
    </div>
  );
}
