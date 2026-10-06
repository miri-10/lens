import assert from "node:assert/strict";
import { test } from "node:test";
import { extensionRisks } from "../src/solana.js";

test("a real transfer fee is reported with its size", () => {
  const risks = extensionRisks([
    {
      extension: "transferFeeConfig",
      state: {
        newerTransferFee: { transferFeeBasisPoints: 100 },
        olderTransferFee: { transferFeeBasisPoints: 100 },
        transferFeeConfigAuthority: "abc",
      },
    },
  ]);
  assert.deepEqual(risks, ["a 1% fee is taken on every transfer"]);
});

test("a 0% fee nobody can change is not a risk", () => {
  const risks = extensionRisks([
    {
      extension: "transferFeeConfig",
      state: {
        newerTransferFee: { transferFeeBasisPoints: 0 },
        olderTransferFee: { transferFeeBasisPoints: 0 },
        transferFeeConfigAuthority: null,
      },
    },
  ]);
  assert.deepEqual(risks, []);
});

test("empty delegate, hook and harmless extensions are ignored", () => {
  const risks = extensionRisks([
    { extension: "permanentDelegate", state: { delegate: null } },
    { extension: "transferHook", state: { programId: null } },
    { extension: "metadataPointer", state: {} },
  ]);
  assert.deepEqual(risks, []);
});

test("active permanent delegate is a risk", () => {
  const risks = extensionRisks([{ extension: "permanentDelegate", state: { delegate: "abc" } }]);
  assert.deepEqual(risks, ["someone can move anyone's coins"]);
});
