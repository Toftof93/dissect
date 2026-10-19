// The hero visual: a looping, CSS-only dissection of a contract, line by line.
const HEX = "6080604052600436106101f45760003560e01c806370a0823114610398578063715018a6146103ce5780638da5cb5b146103e357806395d89b4114610401578063a9059cbb1461041657806340c10f1914610436578063dd62ed3e146104565780638f2a6d1c1461047657";

const LINES: { t: string; k?: "dim" | "bad" | "warn" | "ok" | "tag"; tag?: string }[] = [
  { t: "› pulling bytecode … 23.6 KB", k: "dim" },
  { t: "› disassembling … 11,482 opcodes", k: "dim" },
  { t: "› function table found: 19 organs", k: "dim" },
  { t: "transfer(address,uint256)", k: "ok", tag: "token" },
  { t: "mint(address,uint256)", k: "bad", tag: "mint" },
  { t: "setBots(address[],bool)", k: "bad", tag: "blacklist" },
  { t: "setSellFee(uint256)", k: "bad", tag: "tax" },
  { t: "0x8f2a6d1c  ???", k: "warn", tag: "mystery" },
  { t: "› live: sellFee() = 25", k: "dim" },
];

export function OperatingTable() {
  return (
    <figure className="table" aria-hidden>
      <div className="table-bar">
        <span className="dots"><i /><i /><i /></span>
        <span>specimen · 0x5fbd…0aa3</span>
        <span className="rec">● REC</span>
      </div>
      <div className="table-body">
        <div className="stream">{HEX.repeat(6)}</div>
        <div className="beam" />
        <ol className="log">
          {LINES.map((l, i) => (
            <li key={i} className={l.k} style={{ animationDelay: `${0.5 + i * 0.55}s` }}>
              <span>{l.t}</span>
              {l.tag && <em>{l.tag}</em>}
            </li>
          ))}
        </ol>
        <div className="stamp">MALIGNANT</div>
      </div>
      <figcaption>
        <span>SEALED SOURCE</span>
        <span className="red">3 LETHAL · 1 MYSTERY</span>
      </figcaption>
    </figure>
  );
}
