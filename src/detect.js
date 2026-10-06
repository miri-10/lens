// Finds which coin a post is about: links, contract addresses and $TICKERS.

const ADDRESS = "[1-9A-HJ-NP-Za-km-z]{32,44}"; // Solana base58 address
const LINK = new RegExp(
  `(?:dexscreener\\.com/solana|birdeye\\.so/token|pump\\.fun/coin|solscan\\.io/token|geckoterminal\\.com/solana/pools)/(${ADDRESS})`,
  "gi",
);
const BARE_ADDRESS = new RegExp(`(?<![A-Za-z0-9/])(${ADDRESS})(?![A-Za-z0-9])`, "g");
const CASHTAG = /(?<![A-Za-z0-9])\$([A-Za-z][A-Za-z0-9]{1,9})(?![A-Za-z0-9])/g;

export function detect(text = "") {
  const addresses = [];
  const add = (a) => { if (!addresses.includes(a)) addresses.push(a); };

  // Links first: they say most clearly which coin is meant.
  for (const m of text.matchAll(LINK)) add(m[1]);
  for (const m of text.matchAll(BARE_ADDRESS)) add(m[1]);

  const tickers = [];
  for (const m of text.matchAll(CASHTAG)) {
    const ticker = m[1].toUpperCase();
    if (!tickers.includes(ticker)) tickers.push(ticker);
  }
  return { addresses, tickers };
}
