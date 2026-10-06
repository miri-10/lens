import assert from "node:assert/strict";
import { test } from "node:test";
import { detect } from "../src/detect.js";

const JUP = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";

test("finds a bare contract address", () => {
  assert.deepEqual(detect(`@askLens is this legit? ${JUP}`).addresses, [JUP]);
});

test("finds an address inside a link and doesn't count it twice", () => {
  const { addresses } = detect(`look https://dexscreener.com/solana/${JUP} and ${JUP}`);
  assert.deepEqual(addresses, [JUP]);
});

test("finds tickers, uppercased, without duplicates", () => {
  assert.deepEqual(detect("$jup and $JUP and $BONK!").tickers, ["JUP", "BONK"]);
});

test("ignores dollar amounts and short words", () => {
  const { tickers, addresses } = detect("I made $500 today, so cool");
  assert.deepEqual(tickers, []);
  assert.deepEqual(addresses, []);
});
