import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { toFunctionSelector } from "viem";
import { dissectBytecode } from "../src/lib/evm.ts";
import { BY_SELECTOR } from "../src/lib/signatures.ts";
import { diagnose, type Fn } from "../src/lib/diagnose.ts";

const fx = JSON.parse(readFileSync(new URL("./fixtures/bytecode.json", import.meta.url), "utf8"));
const fns = (sels: string[]): Fn[] =>
  sels.map((selector) => {
    const k = BY_SELECTOR.get(selector);
    return k ? { selector, sig: k.sig, organ: k.organ, known: true, view: Boolean(k.returns) } : { selector, known: false };
  });

test("finds every function selector in a real ERC-20", () => {
  const a = dissectBytecode(fx.mockErc20);
  for (const sig of ["transfer(address,uint256)", "mint(address,uint256)", "balanceOf(address)", "approve(address,uint256)", "decimals()"])
    assert.ok(a.selectors.includes(toFunctionSelector(`function ${sig}`)), sig);
  assert.match(a.solc ?? "", /^0\.8\.28$/);
  assert.equal(a.opcodes.SELFDESTRUCT ?? 0, 0);
});

test("a public mint is flagged lethal", () => {
  const a = dissectBytecode(fx.mockErc20);
  const d = diagnose({ anatomy: a, proxy: false, functions: fns(a.selectors), readings: [], verified: true });
  assert.equal(d.findings[0].id, "mint");
  assert.equal(d.findings[0].level, "lethal");
  assert.notEqual(d.verdict, "clean");
});

test("renounced owner turns switches dormant", () => {
  const f = fns([toFunctionSelector("function mint(address,uint256)"), toFunctionSelector("function owner()")]);
  const d = diagnose({ anatomy: { selectors: [], opcodes: {}, addresses: [], size: 1 }, proxy: false, functions: f, readings: [{ sig: "owner()", value: "0x0000000000000000000000000000000000000000" }] });
  assert.equal(d.findings.find((x) => x.id === "mint")?.level, "note");
  assert.equal(d.verdict, "clean");
});

test("honeypot organs stack to malignant", () => {
  const sels = ["setBots(address[],bool)", "setSellFee(uint256)", "upgradeTo(address)", "isBot(address)"].map((s) => toFunctionSelector(`function ${s}`));
  const d = diagnose({ anatomy: { selectors: sels, opcodes: { ORIGIN: 1 }, addresses: [], size: 1 }, proxy: false, functions: fns(sels), readings: [], verified: false });
  assert.equal(d.verdict, "malignant");
  assert.deepEqual(d.findings.find((x) => x.id === "blacklist")?.fns, ["setBots(address[],bool)"]); // isBot() is a getter, not a switch
});

test("vault with no token powers reads cleanly", () => {
  const a = dissectBytecode(fx.vault);
  assert.ok(a.selectors.length >= 8, String(a.selectors.length));
});

test("unnamed functions stop us from promising 'no mint'", () => {
  const d = diagnose({ anatomy: { selectors: ["0x8187f516"], opcodes: {}, addresses: [], size: 1 }, proxy: false, functions: [{ selector: "0x8187f516", known: false }], readings: [], verified: false });
  assert.equal(d.findings.find((x) => x.id === "nomint")?.level, "note");
  assert.equal(d.findings.find((x) => x.id === "mystery")?.level, "warn");
});
