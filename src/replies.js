// Writes the reply when someone tags @askLens.

import { getCoin } from "./market.js";
import { detect } from "./detect.js";
import { getMintFacts } from "./solana.js";
import { age, fitPost, shortAddress, usd } from "./text.js";
import { mintLine } from "./content/posts.js";

const HELP =
  "Hi! Tag me under a post with a Solana coin's contract address and I'll check it for you.";

export function coinReplyText(address, coin, facts) {
  const lines = [`$${coin?.symbol ?? "?"} quick check (${shortAddress(address)})`];
  lines.push(`• Age: ${age(coin?.createdAt)}`);
  lines.push(`• Liquidity: ${usd(coin?.liquidityUsd)}`);
  lines.push(mintLine(facts));
  for (const risk of facts?.risks ?? []) lines.push(`• ⚠️ ${risk}`);
  lines.push("Full risk check coming soon. Not financial advice.");
  return fitPost(lines.join("\n"));
}

// mentionText: the post that tagged us. parentText: the post it replied to, if any.
export async function makeReply(mentionText, parentText = "") {
  const fromMention = detect(mentionText);
  const fromParent = detect(parentText);
  const address = fromMention.addresses[0] ?? fromParent.addresses[0];
  const ticker = fromMention.tickers[0] ?? fromParent.tickers[0];

  if (address) {
    const facts = await getMintFacts(address).catch(() => undefined);
    if (facts === null) return fitPost(`${shortAddress(address)} doesn't look like a Solana coin address. Double-check it?`);
    const coin = await getCoin(address).catch(() => null);
    return coinReplyText(address, coin, facts);
  }
  if (ticker) {
    return fitPost(
      `Many coins share the name $${ticker}. Send me the contract address so I check the right one.`,
    );
  }
  return HELP;
}
