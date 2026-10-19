import type { Organ } from "./signatures";

// Without an ABI, guess from the name whether a function only reads (constants, is/get/can… getters).
export function looksReadOnly(sig: string): boolean {
  const name = sig.split("(")[0];
  const noArgs = sig.endsWith("()");
  if (/^[A-Z0-9_]+$/.test(name)) return true; // CONSTANT_STYLE
  if (/^(is|_is|has|get|can|view|check|calc|compute|preview|quote|total|max|min)[A-Z_]/.test(name)) return true;
  if (noArgs && /(Enabled|Active|Open|Paused|Bps|Delay|Guard|Config|Policy|Fee|Fees|Tax|Rate|Limit|Count|Address|Wallet|Owner|Admin|Supply|Amount)$/.test(name)) return true;
  return false;
}

// Guess what an unknown-to-us but publicly named switch does from its name.
export function organFromName(sig: string): Organ | undefined {
  const n = sig.split("(")[0].toLowerCase();
  if (/^_?mint/.test(n)) return "mint";
  if (/(blacklist|setbot|addbot|block(address|wallet)|freeze|setsniper)/.test(n)) return "blacklist";
  if (/(tax|fee)/.test(n) && /^(set|update|change)/.test(n)) return "tax";
  if (/^(withdraw|rescue|recover|sweep|clearstuck|drain|emergency)/.test(n)) return "drain";
  if (/^(upgrade|setimplementation)/.test(n)) return "upgrade";
  if (/^((set|enable|disable|open|close|start|stop)(trading|swap)|pause$|unpause$|setpaused)/.test(n)) return "trading";
  if (/^(set|update|remove).*(maxtx|maxwallet|maxtransaction|limits?$|cooldown)/.test(n)) return "limits";
  if (/^(transferownership|setowner|grantrole|setadmin|changeadmin)/.test(n)) return "ownership";
  return undefined;
}
