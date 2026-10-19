import { ImageResponse } from "next/og";
import { cachedDissect } from "@/lib/cached";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Dissect report";

const COLOR = { clean: "#7fd6c2", suspicious: "#f2b544", malignant: "#ff3d2e" };

export default async function Image({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const r = await cachedDissect(address);
  const s = r.ok ? r.specimen : undefined;
  const c = s ? COLOR[s.diagnosis.verdict] : "#7c7a74";
  const lines = s
    ? (s.diagnosis.findings.filter((f) => f.level === "lethal").length
        ? s.diagnosis.findings.filter((f) => f.level === "lethal").map((f) => f.title)
        : s.diagnosis.findings.filter((f) => f.level === "clean").map((f) => f.title)
      ).slice(0, 3)
    : [];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#070707", color: "#e8e6e1", padding: 64, fontFamily: "monospace", position: "relative" }}>
        <div style={{ position: "absolute", left: 980, top: -80, width: 3, height: 820, background: c, transform: "rotate(14deg)", boxShadow: `0 0 40px ${c}`, display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 8, color: "#b9b6ae" }}>DISSECT · AUTOPSY</div>
          {s ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 40, color: "#b9b6ae" }}>{s.symbol ? `$${s.symbol.slice(0, 14)}` : `${s.address.slice(0, 10)}…`}</div>
              <div style={{ display: "flex", fontSize: 128, fontWeight: 800, letterSpacing: -5, color: c, lineHeight: 1.05 }}>{s.diagnosis.verdict.toUpperCase()}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 18 }}>
                {lines.map((l) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32, color: "#e8e6e1" }}>
                    <div style={{ width: 14, height: 14, background: c, display: "flex" }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", fontSize: 80, fontWeight: 800 }}>CUT IT OPEN.</div>
          )}
          <div style={{ display: "flex", fontSize: 24, color: "#7c7a74" }}>{s ? `Threat ${s.diagnosis.threat}/100 · ${s.functions.length} functions found` : "Contract dissector for Robinhood Chain"}</div>
        </div>
      </div>
    ),
    size,
  );
}
