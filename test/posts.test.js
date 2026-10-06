import assert from "node:assert/strict";
import { test } from "node:test";
import { makeTermPost, makeTipPost, summaryPostText, trendingPostText } from "../src/content/posts.js";
import { TERMS } from "../src/content/terms.js";
import { TIPS } from "../src/content/tips.js";
import { coinReplyText } from "../src/replies.js";
import { age, fitPost, postLength, usd } from "../src/text.js";

const coin = {
  address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
  symbol: "JUP",
  liquidityUsd: 1_234_567,
  volume24hUsd: 9_000_000,
  change24hPct: 12.4,
  createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
};
const safe = { mintAuthority: null, freezeAuthority: null, risks: [] };
const risky = { mintAuthority: "abc", freezeAuthority: "def", risks: ["someone can move anyone's coins"] };

test("every tip and term post fits in 280", () => {
  TIPS.forEach((_, i) => assert.ok(postLength(makeTipPost(i).text) <= 280, TIPS[i]));
  TERMS.forEach((_, i) => assert.ok(postLength(makeTermPost(i).text) <= 280, TERMS[i][0]));
});

test("trending post shows the facts and fits", () => {
  const text = trendingPostText(coin, safe);
  assert.match(text, /\$JUP/);
  assert.match(text, /Liquidity: \$1\.2M/);
  assert.match(text, /Mint: off/);
  assert.ok(postLength(text) <= 280);
});

test("trending post flags risky settings", () => {
  const text = trendingPostText(coin, risky);
  assert.match(text, /Mint: ON/);
  assert.match(text, /someone can move anyone's coins/);
});

test("summary names the top gainer and mint count", () => {
  const other = { ...coin, symbol: "BONK", change24hPct: 80, volume24hUsd: 1 };
  const text = summaryPostText([coin, other], 1, 2);
  assert.match(text, /Top gainer: \$BONK \+80%/);
  assert.match(text, /Most traded: \$JUP/);
  assert.match(text, /1 of 2 can still mint/);
});

test("reply lists risks in plain words", () => {
  const text = coinReplyText(coin.address, coin, risky);
  assert.match(text, /someone can move anyone's coins/);
  assert.ok(postLength(text) <= 280);
});

test("fitPost trims long posts to 280", () => {
  const long = ["Title", ...Array.from({ length: 30 }, (_, i) => `line ${i} with some words`), "Footer"].join("\n");
  const fitted = fitPost(long);
  assert.ok(postLength(fitted) <= 280);
  assert.ok(fitted.startsWith("Title") && fitted.endsWith("Footer"));
});

test("formatters", () => {
  assert.equal(usd(1_500), "$2K");
  assert.equal(usd(null), "unknown");
  assert.equal(age(new Date(Date.now() - 5 * 3_600_000).toISOString()), "5 hours");
});
