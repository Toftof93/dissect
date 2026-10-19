import { DissectForm } from "@/components/DissectForm";
import { OperatingTable } from "@/components/OperatingTable";

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

        <OperatingTable />
      </section>

      <section className="strip">
        <div><b>Sealed</b><span>Works on contracts the dev never verified</span></div>
        <div><b>180+</b><span>Known rug &amp; honeypot functions</span></div>
        <div><b>Live</b><span>Owner, taxes &amp; limits read from chain</span></div>
        <div><b>0</b><span>Wallets connected. Ever.</span></div>
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

      <section className="sample">
        <div className="sample-copy">
          <p className="label">The autopsy</p>
          <h2>One page. <em>Every secret.</em></h2>
          <p className="lead">A verdict anyone can read in five seconds, every finding in plain English, and a card to share on X before your friends ape in.</p>
        </div>
        <div className="sample-card">
          <div className="sc-head">
            <span className="label">Verdict</span>
            <span className="sc-sym">$HONEY</span>
          </div>
          <div className="sc-verdict">MALIGNANT.</div>
          <div className="meter"><span style={{ width: "86%" }} /></div>
          <p className="meter-label">Threat <b>86</b>/100</p>
          <ul className="sc-rows">
            <li className="lethal"><em>LETHAL</em>Blacklist · <code>setBots(address[],bool)</code></li>
            <li className="lethal"><em>LETHAL</em>Adjustable tax · <code>setSellTax(uint256)</code></li>
            <li className="warn"><em>WARNING</em>Checks tx.origin</li>
            <li className="warn"><em>WARNING</em>2 mystery functions</li>
          </ul>
        </div>
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
