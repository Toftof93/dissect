import "server-only";
import { createPublicClient, getAddress, http, isAddress, parseAbiItem, decodeFunctionResult, type Address, type Hex } from "viem";
import { apiUrl, CHAIN_ID, RPC_URL } from "./chain";
import { dissectBytecode, IMPL_SLOT, BEACON_SLOT, type Anatomy } from "./evm";
import { BY_SELECTOR, type Organ } from "./signatures";
import { diagnose, type Diagnosis, type Fn } from "./diagnose";

export type Specimen = {
  address: Address;
  name?: string;
  symbol?: string;
  verified?: boolean;
  contractName?: string;
  implementation?: Address;
  anatomy: Omit<Anatomy, "ops">;
  functions: Fn[];
  readings: { sig: string; value: string }[];
  diagnosis: Diagnosis;
  disassembly: string; // first part of the disassembly, for the "open it up" view
};
export type DissectResult = { ok: true; specimen: Specimen; at: number } | { ok: false; error: string };

const client = createPublicClient({
  chain: { id: CHAIN_ID, name: "Robinhood Chain", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } },
  transport: http(RPC_URL, { timeout: 10_000, retryCount: 1 }),
});

/* eslint-disable @typescript-eslint/no-explicit-any */
async function getJson<T = any>(url: string): Promise<T | undefined> {
  try {
    const r = await fetch(url, { headers: { accept: "application/json" }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(8_000) });
    return r.ok ? ((await r.json()) as T) : undefined;
  } catch {
    return undefined;
  }
}

const slotAddress = (v?: Hex) => (v && BigInt(v) !== 0n ? getAddress("0x" + v.slice(-40)) : undefined);

/** Names for selectors we don't know, from public signature databases. */
async function lookupSelectors(selectors: string[]): Promise<Record<string, string>> {
  if (!selectors.length) return {};
  const out: Record<string, string> = {};
  const oc = await getJson(`https://api.openchain.xyz/signature-database/v1/lookup?function=${selectors.join(",")}&filter=true`);
  for (const s of selectors) {
    const hit = oc?.result?.function?.[s]?.[0]?.name;
    if (hit) out[s] = hit;
  }
  const missing = selectors.filter((s) => !out[s]).slice(0, 12);
  await Promise.all(
    missing.map(async (s) => {
      const r = await getJson(`https://www.4byte.directory/api/v1/signatures/?hex_signature=${s}&ordering=created_at`);
      const name = r?.results?.[0]?.text_signature;
      if (name) out[s] = name;
    }),
  );
  return out;
}

// Guess what an unknown-to-us but publicly named function does from its name.
function organFromName(sig: string): Organ | undefined {
  const n = sig.split("(")[0].toLowerCase();
  if (/mint/.test(n)) return "mint";
  if (/(blacklist|bot|block|freeze|sniper)/.test(n)) return "blacklist";
  if (/(tax|fee)/.test(n) && /^(set|update|change)/.test(n)) return "tax";
  if (/(withdraw|rescue|recover|sweep|stuck|drain|emergency)/.test(n)) return "drain";
  if (/(upgrade|implementation)/.test(n)) return "upgrade";
  if (/(trading|pause|launch)/.test(n)) return "trading";
  if (/max(tx|wallet|transaction)|limit|cooldown/.test(n)) return "limits";
  if (/owner|role|admin/.test(n)) return "ownership";
  return undefined;
}

export async function dissect(input: string): Promise<DissectResult> {
  const raw = input.trim();
  if (!isAddress(raw)) return { ok: false, error: "That doesn't look like a contract address (0x… 42 characters)." };
  const address = getAddress(raw);

  const code = await client.getCode({ address }).catch(() => null);
  if (code === null) return { ok: false, error: "Couldn't reach Robinhood Chain. Try again in a moment." };
  if (!code || code === "0x") return { ok: false, error: "There's no contract at this address. It's a normal wallet (or nothing at all)." };

  const [token, sc] = await Promise.all([getJson(apiUrl(`/tokens/${address}`)), getJson(apiUrl(`/smart-contracts/${address}`))]);

  // Follow proxies to the code that actually runs.
  let anatomy = dissectBytecode(code);
  let implementation: Address | undefined;
  if (anatomy.minimalProxyTo) implementation = getAddress(anatomy.minimalProxyTo);
  else {
    const [impl, beacon] = await Promise.all([
      client.getStorageAt({ address, slot: IMPL_SLOT }).catch(() => undefined),
      client.getStorageAt({ address, slot: BEACON_SLOT }).catch(() => undefined),
    ]);
    implementation = slotAddress(impl);
    const b = slotAddress(beacon);
    if (!implementation && b) {
      const r = await client
        .readContract({ address: b, abi: [parseAbiItem("function implementation() view returns (address)")], functionName: "implementation" })
        .catch(() => undefined);
      implementation = r ? getAddress(r) : undefined;
    }
  }
  if (implementation) {
    const implCode = await client.getCode({ address: implementation }).catch(() => undefined);
    if (implCode && implCode !== "0x") anatomy = dissectBytecode(implCode);
  }

  // Name every function we found.
  const unknown = anatomy.selectors.filter((s) => !BY_SELECTOR.has(s));
  const looked = await lookupSelectors(unknown);
  const functions: Fn[] = anatomy.selectors.map((selector) => {
    const k = BY_SELECTOR.get(selector);
    if (k) return { selector, sig: k.sig, organ: k.organ, says: k.says, known: true, view: Boolean(k.returns) };
    const sig = looked[selector];
    const view = sig ? /^(is|_is|has|get|view|check)/i.test(sig) : undefined;
    return { selector, sig, organ: sig && !view ? organFromName(sig) : undefined, known: false, view };
  });

  // Live readings: call the zero-argument getters we recognise.
  const getters = anatomy.selectors
    .map((selector) => ({ selector, k: BY_SELECTOR.get(selector)! }))
    .filter(({ k }) => k?.returns && k.sig.endsWith("()"));
  const readings = (
    await Promise.all(
      getters.map(async ({ selector, k }) => {
        const abi = [parseAbiItem(`function ${k.sig} view returns (${k.returns === "uint" ? "uint256" : k.returns})`)];
        try {
          const { data } = await client.call({ to: address, data: selector as Hex });
          if (!data) return undefined;
          const v = decodeFunctionResult({ abi, functionName: k.sig.split("(")[0], data }) as unknown;
          return { sig: k.sig, value: typeof v === "bigint" ? v.toString() : String(v) };
        } catch {
          return undefined;
        }
      }),
    )
  ).filter((x): x is { sig: string; value: string } => !!x);

  const verified = sc ? Boolean(sc.is_verified || sc.is_fully_verified || sc.is_partially_verified) : undefined;
  const diagnosis = diagnose({ anatomy, proxy: !!implementation, functions, readings, verified});

  const { ops, ...rest } = anatomy;
  return {
    ok: true,
    at: Math.floor(Date.now() / 1000),
    specimen: {
      address,
      name: token?.name ?? undefined,
      symbol: token?.symbol ?? undefined,
      verified,
      contractName: sc?.name ?? undefined,
      implementation,
      anatomy: rest,
      functions,
      readings,
      diagnosis,
      disassembly: ops
        .slice(0, 400)
        .map((o) => `${o.pc.toString(16).padStart(4, "0")}  ${o.name}${o.push ? " " + o.push : ""}`)
        .join("\n"),
    },
  };
}
