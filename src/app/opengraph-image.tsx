import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Dissect: cut it open, see what's inside";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#070707", color: "#e8e6e1", padding: 72, fontFamily: "monospace", position: "relative" }}>
        <div style={{ position: "absolute", left: 760, top: -60, width: 3, height: 800, background: "#ff3d2e", transform: "rotate(14deg)", boxShadow: "0 0 40px #ff3d2e", display: "flex" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 28, letterSpacing: 8, color: "#b9b6ae" }}>DISSECT</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 104, fontWeight: 800, lineHeight: 1, letterSpacing: -4 }}>
            <div style={{ display: "flex" }}>CUT IT OPEN.</div>
            <div style={{ display: "flex", color: "#ff3d2e" }}>SEE INSIDE.</div>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#7c7a74" }}>Contract dissector for Robinhood Chain · works on unverified code</div>
        </div>
      </div>
    ),
    size,
  );
}
