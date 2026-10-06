// Reads a coin's settings straight from Solana (read-only).

import { config } from "./config.js";

const TOKEN_PROGRAMS = new Set([
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // SPL Token
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
]);

// Token-2022 features that let the creator take, block or tax your coins.
// Each returns a plain-words warning when the feature is really active, else null.
const EXTENSION_RISKS = {
  permanentDelegate: (s) => (s.delegate ? "someone can move anyone's coins" : null),
  transferFeeConfig: (s) => {
    const bps = Math.max(
      s.newerTransferFee?.transferFeeBasisPoints ?? 0,
      s.olderTransferFee?.transferFeeBasisPoints ?? 0,
    );
    if (bps > 0) return `a ${bps / 100}% fee is taken on every transfer`;
    return s.transferFeeConfigAuthority ? "the creator can add a transfer fee" : null;
  },
  transferHook: (s) => (s.programId ? "custom code runs on every transfer" : null),
  nonTransferable: () => "coins can't be moved",
  defaultAccountState: (s) => (s.accountState === "frozen" ? "new holders start frozen" : null),
  pausableConfig: (s) => {
    if (s.paused) return "transfers are paused right now";
    return s.authority ? "transfers can be paused" : null;
  },
};

export function extensionRisks(extensions = []) {
  return extensions
    .map((e) => EXTENSION_RISKS[e.extension]?.(e.state ?? {}))
    .filter(Boolean);
}

async function rpc(method, params) {
  const res = await fetch(config.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`Solana RPC ${method} failed: HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`Solana RPC ${method} failed: ${body.error.message}`);
  return body.result;
}

// Returns null when the address isn't a coin.
export async function getMintFacts(address) {
  const result = await rpc("getAccountInfo", [address, { encoding: "jsonParsed" }]);
  const account = result?.value;
  if (!account || !TOKEN_PROGRAMS.has(account.owner)) return null;
  const parsed = account.data?.parsed;
  if (parsed?.type !== "mint") return null;
  const info = parsed.info;
  return {
    mintAuthority: info.mintAuthority ?? null,
    freezeAuthority: info.freezeAuthority ?? null,
    risks: extensionRisks(info.extensions),
  };
}
