// Turns a dissected contract into plain-English findings and a verdict. Pure, so it's unit tested.
import type { Anatomy } from "./evm";
import type { Organ } from "./signatures";

export type Fn = { selector: string; sig?: string; organ?: Organ; says?: string; known: boolean; view?: boolean };
export type Level = "lethal" | "warn" | "note" | "clean";
export type Finding = { id: string; level: Level; title: string; detail: string; fns?: string[] };
export type Diagnosis = { threat: number; verdict: "clean" | "suspicious" | "malignant"; headline: string; findings: Finding[]; owner?: string; renounced: boolean };

const DEAD = new Set(["0x0000000000000000000000000000000000000000", "0x000000000000000000000000000000000000dead"]);
const WEIGHT: Record<Level, number> = { lethal: 30, warn: 12, note: 2, clean: 0 };

const POWERS: { organ: Organ; title: string; detail: string; level: Level }[] = [
  { organ: "mint", level: "lethal", title: "Mint switch", detail: "Someone can print new tokens out of thin air and dump them on holders." },
  { organ: "blacklist", level: "lethal", title: "Blacklist", detail: "Wallets can be blocked from selling. Classic honeypot organ." },
  { organ: "tax", level: "lethal", title: "Adjustable tax", detail: "The buy/sell tax can be changed after you buy, sometimes up to 100%." },
  { organ: "upgrade", level: "lethal", title: "Swappable code", detail: "The contract can be upgraded, so what you see today isn't guaranteed tomorrow." },
  { organ: "drain", level: "warn", title: "Withdraw switch", detail: "Tokens or ETH held by the contract can be pulled out by an admin." },
  { organ: "trading", level: "warn", title: "Trading on/off switch", detail: "An admin can open, pause or close trading." },
  { organ: "limits", level: "note", title: "Wallet & tx limits", detail: "An admin can cap how much a wallet can buy, hold or sell." },
];

export function diagnose(x: {
  anatomy: Pick<Anatomy, "selectors" | "opcodes" | "addresses" | "size">;
  proxy: boolean;
  functions: Fn[];
  readings: { sig: string; value: string }[];
  verified?: boolean;
}): Diagnosis {
  const f: Finding[] = [];
  const read = (sig: string) => x.readings.find((r) => r.sig === sig)?.value;
  const owner = read("owner()") ?? read("getOwner()");
  const renounced = owner !== undefined && DEAD.has(owner.toLowerCase());
  const hasRoles = x.functions.some((fn) => fn.sig?.startsWith("grantRole("));
  // Switches only: getters like isBot() or buyTax() just read state.
  const sigsOf = (o: Organ) => x.functions.filter((fn) => fn.organ === o && fn.sig && !fn.view).map((fn) => fn.sig!);

  // Admin powers. If the owner is renounced, owner-only switches are dead weight.
  for (const p of POWERS) {
    const fns = sigsOf(p.organ);
    if (!fns.length) continue;
    const dormant = renounced && !hasRoles && p.organ !== "upgrade";
    f.push({
      id: p.organ,
      level: dormant ? "note" : p.level,
      title: dormant ? `${p.title} (owner renounced)` : p.title,
      detail: dormant ? `The function is still in the code, but the owner gave up control, so most likely nobody can use it.` : p.detail,
      fns,
    });
  }
  if (x.proxy && !f.some((y) => y.id === "upgrade"))
    f.push({ id: "upgrade", level: "lethal", title: "It's a proxy", detail: "The address you trade points to other code that can be replaced." });

  // Dangerous opcodes
  const op = (n: string) => x.anatomy.opcodes[n] ?? 0;
  if (op("SELFDESTRUCT")) f.push({ id: "selfdestruct", level: "lethal", title: "Self-destruct", detail: "The contract contains code that can delete itself." });
  if (op("DELEGATECALL") && !x.proxy)
    f.push({ id: "delegatecall", level: "warn", title: "Runs outside code", detail: "It can execute code from another contract with its own storage (delegatecall)." });
  if (op("CALLCODE")) f.push({ id: "callcode", level: "warn", title: "Legacy callcode", detail: "Uses an old, dangerous way of running outside code." });
  if (op("ORIGIN")) f.push({ id: "origin", level: "warn", title: "Checks tx.origin", detail: "Looks at who started the transaction. Common trick in honeypots to treat bots or sellers differently." });

  // Things we couldn't name
  const mystery = x.functions.filter((fn) => !fn.sig);
  if (mystery.length >= 3 || (mystery.length && x.verified === false))
    f.push({ id: "mystery", level: "warn", title: `${mystery.length} mystery functions`, detail: "These functions aren't in any public database. Hidden names are a red flag.", fns: mystery.map((m) => m.selector) });
  else if (mystery.length)
    f.push({ id: "mystery", level: "note", title: `${mystery.length} unnamed function${mystery.length > 1 ? "s" : ""}`, detail: "Not in any public database. Could be custom, could be hiding something.", fns: mystery.map((m) => m.selector) });

  if (x.verified === false) f.push({ id: "sealed", level: "warn", title: "Sealed source", detail: "The developer never published the code. We cut it open from the raw bytecode instead." });
  if (x.anatomy.addresses.length)
    f.push({ id: "addresses", level: "note", title: `${x.anatomy.addresses.length} hardcoded address${x.anatomy.addresses.length > 1 ? "es" : ""}`, detail: "Wallets or contracts baked into the code. Check who they are.", fns: x.anatomy.addresses });
  if (hasRoles) f.push({ id: "roles", level: "note", title: "Role-based admins", detail: "Instead of one owner, chosen wallets hold special roles." });
  if (!x.anatomy.selectors.length)
    f.push({ id: "nodispatch", level: "note", title: "No function table found", detail: "This may be a non-Solidity contract or a forwarding proxy. Read the raw anatomy below." });

  // Good news
  const organs = new Set(x.functions.map((fn) => fn.organ));
  if (renounced) f.push({ id: "renounced", level: "clean", title: "Owner renounced", detail: "Nobody controls the admin switches anymore." });
  // Unnamed functions could be hiding exactly these, so don't promise what we can't see.
  const hidden = mystery.length ? ` Unless one of the ${mystery.length} unnamed function${mystery.length > 1 ? "s" : ""} hides it.` : "";
  if (!organs.has("mint")) f.push({ id: "nomint", level: hidden ? "note" : "clean", title: hidden ? "No named mint switch" : "No mint switch", detail: "Supply can't be increased." + hidden });
  if (!organs.has("blacklist")) f.push({ id: "noblack", level: hidden ? "note" : "clean", title: hidden ? "No named blacklist" : "No blacklist", detail: "Nobody can block your wallet from selling." + hidden });
  if (!x.proxy && !organs.has("upgrade")) f.push({ id: "noupgrade", level: "clean", title: "Code is final", detail: "The contract can't be swapped for different code." });
  if (x.verified) f.push({ id: "verified", level: "clean", title: "Source is public", detail: "The code is verified on the explorer." });

  const order: Record<Level, number> = { lethal: 0, warn: 1, note: 2, clean: 3 };
  f.sort((a, b) => order[a.level] - order[b.level]);
  const threat = Math.min(100, f.reduce((t, y) => t + WEIGHT[y.level], 0));
  const verdict = threat >= 50 ? "malignant" : threat >= 20 ? "suspicious" : "clean";
  const lethal = f.filter((y) => y.level === "lethal").length;
  const headline =
    verdict === "clean" ? "Clean cut. Nothing nasty inside." : verdict === "suspicious" ? "Some odd tissue. Handle with care." : `${lethal || "Several"} lethal organ${lethal === 1 ? "" : "s"} found inside.`;

  return { threat, verdict, headline, findings: f, owner, renounced };
}
