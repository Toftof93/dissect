import { DissectForm } from "@/components/DissectForm";

const HEX = "6080604052600436106101f45760003560e01c806370a0823114610398578063715018a6146103ce5780638da5cb5b146103e357806395d89b4114610401578063a9059cbb1461041657806340c10f1914610436578063dd62ed3e1461045657";
const ORGANS = [
  { sig: "mint(address,uint256)", bad: true },
  { sig: "setBots(address[],bool)", bad: true },
  { sig: "setSellFee(uint256)", bad: true },
  { sig: "transfer(address,uint256)", bad: false },
  { sig: "0x8f2a6d1c  ???", bad: true },
];

const STEPS = [
  { t: "Extract", d: "We pull the raw bytecode straight from Robinhood Chain. Verified or not, every contract has it." },
  { t: "Cut", d: "We disassemble it and find every function hidden inside, even the ones the dev never named." },
  { t: "Diagnose", d: "Each organ gets a plain-English label: mint switch, blacklist, tax dial, withdraw, swappable code." },
];

export default function Home() {
  return (
    <main className="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="label">Contract dissector · Robinhood Chain</p>
          <h1>
            Cut it open.
            <br />
            <em>See what’s inside.</em>
          </h1>
          <p className="lead">
            Paste any contract, even one the dev never verified. Dissect cuts the bytecode open and tells you what the dev can do to you: print tokens, block your sells, crank the tax, swap the code.
          </p>
          <DissectForm />
          <p className="fine">Free · No wallet · Works on sealed contracts</p>
        </div>

        <figure className="slab-hero" aria-hidden>
          <div className="slab-inner">
            <div className="organs-reveal">
              {ORGANS.map((o, i) => (
                <code key={o.sig} className={o.bad ? "bad" : ""} style={{ animationDelay: `${1.6 + i * 0.25}s` }}>
                  <i className="mark" />
                  {o.sig}
                </code>
              ))}
            </div>
            <div className="lid l"><span>{HEX.repeat(4)}</span></div>
            <div className="lid r"><span>{HEX.repeat(4)}</span></div>
            <div className="blade-line" />
          </div>
          <figcaption>
            <span>SEALED SOURCE</span>
            <span className="red">3 LETHAL · 1 MYSTERY</span>
          </figcaption>
        </figure>
      </section>

      <section className="how">
        <p className="label">The procedure</p>
        <h2>Every contract has a secret.<br /><em>We cut it open.</em></h2>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.t}>
              <span className="num">0{i + 1}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="lethal-list">
        <p className="label">What we look for</p>
        <div className="grid">
          {[
            ["Mint switch", "Prints new tokens and dumps them on you."],
            ["Blacklist", "Blocks your wallet from selling. The classic honeypot."],
            ["Tax dial", "Cranks the sell tax after you buy, sometimes to 100%."],
            ["Withdraw", "Pulls the contract’s tokens or ETH out."],
            ["Swappable code", "Proxies and upgrades: today’s code isn’t tomorrow’s."],
            ["Self-destruct", "Code that can delete the contract."],
            ["tx.origin tricks", "Treats sellers or bots differently."],
            ["Mystery functions", "Functions with no public name. Why hide them?"],
          ].map(([t, d]) => (
            <div key={t} className="cell">
              <b>{t}</b>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="faq">
        <p className="label">Questions</p>
        <details>
          <summary>How can you read a contract that isn’t verified?</summary>
          <p>Every contract’s compiled bytecode is public on-chain. Dissect disassembles it, finds the function table, and matches each function against public signature databases and our own list of known rug patterns.</p>
        </details>
        <details>
          <summary>Does “clean” mean safe?</summary>
          <p>No. Clean means we found no dangerous switches in the code. A dev can still dump their bag or abandon the project. Dissect reads code, not intentions.</p>
        </details>
        <details>
          <summary>What if the owner renounced?</summary>
          <p>We read the owner live from the chain. If it’s renounced, owner-only switches are marked dormant: still in the code, but most likely nobody can use them.</p>
        </details>
        <details>
          <summary>Do I need to connect a wallet?</summary>
          <p>Never. Dissect only reads public data. If anything claiming to be us asks for your wallet, keys or seed phrase, it’s a scam.</p>
        </details>
      </section>
    </main>
  );
}
