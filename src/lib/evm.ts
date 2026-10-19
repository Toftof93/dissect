// A small EVM bytecode disassembler and pattern finder. No network, no dependencies.

const NAMES: Record<number, string> = {
  0x00: "STOP", 0x01: "ADD", 0x02: "MUL", 0x03: "SUB", 0x04: "DIV", 0x05: "SDIV", 0x06: "MOD", 0x07: "SMOD", 0x08: "ADDMOD",
  0x09: "MULMOD", 0x0a: "EXP", 0x0b: "SIGNEXTEND", 0x10: "LT", 0x11: "GT", 0x12: "SLT", 0x13: "SGT", 0x14: "EQ", 0x15: "ISZERO",
  0x16: "AND", 0x17: "OR", 0x18: "XOR", 0x19: "NOT", 0x1a: "BYTE", 0x1b: "SHL", 0x1c: "SHR", 0x1d: "SAR", 0x20: "KECCAK256",
  0x30: "ADDRESS", 0x31: "BALANCE", 0x32: "ORIGIN", 0x33: "CALLER", 0x34: "CALLVALUE", 0x35: "CALLDATALOAD", 0x36: "CALLDATASIZE",
  0x37: "CALLDATACOPY", 0x38: "CODESIZE", 0x39: "CODECOPY", 0x3a: "GASPRICE", 0x3b: "EXTCODESIZE", 0x3c: "EXTCODECOPY",
  0x3d: "RETURNDATASIZE", 0x3e: "RETURNDATACOPY", 0x3f: "EXTCODEHASH", 0x40: "BLOCKHASH", 0x41: "COINBASE", 0x42: "TIMESTAMP",
  0x43: "NUMBER", 0x44: "PREVRANDAO", 0x45: "GASLIMIT", 0x46: "CHAINID", 0x47: "SELFBALANCE", 0x48: "BASEFEE", 0x49: "BLOBHASH",
  0x4a: "BLOBBASEFEE", 0x50: "POP", 0x51: "MLOAD", 0x52: "MSTORE", 0x53: "MSTORE8", 0x54: "SLOAD", 0x55: "SSTORE", 0x56: "JUMP",
  0x57: "JUMPI", 0x58: "PC", 0x59: "MSIZE", 0x5a: "GAS", 0x5b: "JUMPDEST", 0x5c: "TLOAD", 0x5d: "TSTORE", 0x5e: "MCOPY", 0x5f: "PUSH0",
  0xa0: "LOG0", 0xa1: "LOG1", 0xa2: "LOG2", 0xa3: "LOG3", 0xa4: "LOG4", 0xf0: "CREATE", 0xf1: "CALL", 0xf2: "CALLCODE", 0xf3: "RETURN",
  0xf4: "DELEGATECALL", 0xf5: "CREATE2", 0xfa: "STATICCALL", 0xfd: "REVERT", 0xfe: "INVALID", 0xff: "SELFDESTRUCT",
};
for (let i = 1; i <= 32; i++) NAMES[0x5f + i] = `PUSH${i}`;
for (let i = 1; i <= 16; i++) NAMES[0x7f + i] = `DUP${i}`;
for (let i = 1; i <= 16; i++) NAMES[0x8f + i] = `SWAP${i}`;

export type Op = { pc: number; op: number; name: string; push?: string };

export function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(h.length >> 1);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}
const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

/** Strip the trailing Solidity/Vyper CBOR metadata so it isn't disassembled as code. */
export function splitMetadata(code: Uint8Array): { code: Uint8Array; meta?: { solc?: string } } {
  if (code.length < 2) return { code };
  const len = (code[code.length - 2] << 8) | code[code.length - 1];
  if (len === 0 || len + 2 > code.length) return { code };
  const meta = code.slice(code.length - 2 - len, code.length - 2);
  // a CBOR map with "solc" as a 3-byte version, e.g. ... 64 73 6f 6c 63 43 00 08 1c
  const s = hex(meta);
  const at = s.indexOf("736f6c6343");
  if (meta[0] < 0xa1 || meta[0] > 0xa5) return { code };
  const solc = at >= 0 ? `${parseInt(s.slice(at + 10, at + 12), 16)}.${parseInt(s.slice(at + 12, at + 14), 16)}.${parseInt(s.slice(at + 14, at + 16), 16)}` : undefined;
  return { code: code.slice(0, code.length - 2 - len), meta: { solc } };
}

export function disassemble(code: Uint8Array): Op[] {
  const ops: Op[] = [];
  for (let pc = 0; pc < code.length; pc++) {
    const op = code[pc];
    const name = NAMES[op] ?? `0x${op.toString(16).padStart(2, "0")}`;
    if (op >= 0x60 && op <= 0x7f) {
      const n = op - 0x5f;
      ops.push({ pc, op, name, push: "0x" + hex(code.slice(pc + 1, pc + 1 + n)) });
      pc += n;
    } else ops.push({ pc, op, name });
  }
  return ops;
}

const IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920c3ca505d382bbc"; // EIP-1967 implementation
const BEACON_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"; // EIP-1967 beacon
const MIN_PROXY = /^363d3d373d3d3d363d73([0-9a-f]{40})5af43d82803e903d91602b57fd5bf3$/; // EIP-1167

export type Anatomy = {
  size: number;
  solc?: string;
  selectors: string[];
  opcodes: Record<string, number>;
  addresses: string[]; // hardcoded 20-byte addresses
  minimalProxyTo?: string;
  eip1967: boolean;
  beacon: boolean;
  ops: Op[];
};

export function dissectBytecode(bytecode: string): Anatomy {
  const raw = hexToBytes(bytecode);
  const lower = hex(raw);
  const minimal = lower.match(MIN_PROXY);
  const { code, meta } = splitMetadata(raw);
  const ops = disassemble(code);

  const opcodes: Record<string, number> = {};
  for (const o of ops) opcodes[o.name] = (opcodes[o.name] ?? 0) + 1;

  // Function dispatcher: PUSH4 <selector> (DUP*/SWAP*)? EQ ... PUSH <dest> JUMPI
  const selectors = new Set<string>();
  for (let i = 0; i < ops.length - 3; i++) {
    const o = ops[i];
    if (o.name !== "PUSH4" || !o.push) continue;
    const window = ops.slice(i + 1, i + 5).map((x) => x.name);
    const eq = window.findIndex((n) => n === "EQ" || n === "GT" || n === "LT");
    if (eq >= 0 && window.slice(eq + 1).some((n) => n === "JUMPI") && o.push !== "0xffffffff") selectors.add(o.push);
  }

  const addresses = new Set<string>();
  for (const o of ops) {
    if (o.name === "PUSH20" && o.push && !/^0x(00|ff)+$/i.test(o.push)) addresses.add(o.push);
  }

  const pushes32 = new Set(ops.filter((o) => o.name === "PUSH32").map((o) => o.push));
  return {
    size: raw.length,
    solc: meta?.solc,
    selectors: [...selectors],
    opcodes,
    addresses: [...addresses],
    minimalProxyTo: minimal ? "0x" + minimal[1] : undefined,
    eip1967: pushes32.has(IMPL_SLOT),
    beacon: pushes32.has(BEACON_SLOT),
    ops,
  };
}

export { IMPL_SLOT, BEACON_SLOT };
