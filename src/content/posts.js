// Builds each kind of post from live data or the tip/term lists.

import { getTrendingCoins } from "../market.js";
import { getMintFacts } from "../solana.js";
import { age, fitPost, percent, usd } from "../text.js";
import { TERMS } from "./terms.js";
import { TIPS } from "./tips.js";

const FOOTER = "Not financial advice. Tag @askLens to check a coin.";

export function mintLine(facts) {
  if (!facts) return "• Mint/freeze: couldn't check";
  const mint = facts.mintAuthority ? "ON ⚠️" : "off ✅";
  const freeze = facts.freezeAuthority ? "ON ⚠️" : "off ✅";
  return `• Mint: ${mint} · Freeze: ${freeze}`;
}

export function trendingPostText(coin, facts) {
  const lines = [
    `🔥 Trending on Solana: $${coin.symbol}`,
    `• Age: ${age(coin.createdAt)}`,
    `• Liquidity: ${usd(coin.liquidityUsd)}`,
    `• 24h: ${percent(coin.change24hPct)}`,
    mintLine(facts),
  ];
  if (facts?.risks.length) lines.push(`• ⚠️ ${facts.risks[0]}`);
  lines.push(FOOTER);
  return fitPost(lines.join("\n"));
}

// Picks a trending coin not posted recently. Returns { text, coinAddress } or null.
export async function makeTrendingPost(recentAddresses = []) {
  const coins = await getTrendingCoins();
  const coin = coins.find((c) => !recentAddresses.includes(c.address));
  if (!coin) return null;
  const facts = await getMintFacts(coin.address).catch(() => null);
  return { text: trendingPostText(coin, facts), coinAddress: coin.address };
}

export function makeTipPost(index) {
  const tip = TIPS[index % TIPS.length];
  return { text: fitPost(`🛡️ Safety tip\n${tip}`) };
}

export function makeTermPost(index) {
  const [term, meaning] = TERMS[index % TERMS.length];
  return { text: fitPost(`📘 Crypto in one line\n${term}: ${meaning}`) };
}

export function summaryPostText(coins, mintOnCount, checkedCount) {
  const withChange = coins.filter((c) => c.change24hPct != null);
  const gainer = withChange.reduce((a, c) => (c.change24hPct > a.change24hPct ? c : a), withChange[0]);
  const withVolume = coins.filter((c) => c.volume24hUsd != null);
  const traded = withVolume.reduce((a, c) => (c.volume24hUsd > a.volume24hUsd ? c : a), withVolume[0]);
  const withAge = coins.filter((c) => c.createdAt);
  const newest = withAge.reduce((a, c) => (new Date(c.createdAt) > new Date(a.createdAt) ? c : a), withAge[0]);

  const lines = ["📊 Solana daily recap (trending coins)"];
  if (gainer) lines.push(`• Top gainer: $${gainer.symbol} ${percent(gainer.change24hPct)}`);
  if (traded) lines.push(`• Most traded: $${traded.symbol} (${usd(traded.volume24hUsd)})`);
  if (newest) lines.push(`• Newest: $${newest.symbol} (${age(newest.createdAt)} old)`);
  if (checkedCount) lines.push(`• ${mintOnCount} of ${checkedCount} can still mint new coins${mintOnCount ? " ⚠️" : " ✅"}`);
  lines.push("Not financial advice.");
  return fitPost(lines.join("\n"));
}

export async function makeSummaryPost() {
  const coins = (await getTrendingCoins()).slice(0, 10);
  if (!coins.length) return null;
  const facts = await Promise.all(coins.map((c) => getMintFacts(c.address).catch(() => null)));
  const checked = facts.filter(Boolean);
  const mintOn = checked.filter((f) => f.mintAuthority).length;
  return { text: summaryPostText(coins, mintOn, checked.length) };
}
