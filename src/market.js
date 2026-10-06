// Market data from GeckoTerminal's free public API (about 30 requests a minute).

const API = "https://api.geckoterminal.com/api/v2/networks/solana";

// Base coins that aren't interesting to post about.
const SKIP = new Set([
  "So11111111111111111111111111111111111111112", // wrapped SOL
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
]);

async function get(path) {
  const res = await fetch(`${API}${path}`, { headers: { accept: "application/json;version=20230302" } });
  if (!res.ok) throw new Error(`GeckoTerminal ${path} failed: HTTP ${res.status}`);
  return res.json();
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toCoin(pool, tokensById) {
  const a = pool.attributes;
  const tokenId = pool.relationships?.base_token?.data?.id ?? "";
  const token = tokensById.get(tokenId)?.attributes;
  return {
    address: token?.address ?? tokenId.replace(/^solana_/, ""),
    symbol: token?.symbol ?? a.name?.split(" / ")[0] ?? "?",
    name: token?.name ?? a.name,
    priceUsd: number(a.base_token_price_usd),
    liquidityUsd: number(a.reserve_in_usd),
    volume24hUsd: number(a.volume_usd?.h24),
    change24hPct: number(a.price_change_percentage?.h24),
    createdAt: a.pool_created_at ?? null,
    pool: a.address,
  };
}

function coinsFrom(body) {
  const tokensById = new Map((body.included ?? []).map((t) => [t.id, t]));
  return (body.data ?? []).map((pool) => toCoin(pool, tokensById));
}

// Trending coins on Solana right now, one entry per coin.
export async function getTrendingCoins() {
  const body = await get("/trending_pools?include=base_token");
  const seen = new Set();
  return coinsFrom(body).filter((c) => {
    if (SKIP.has(c.address) || seen.has(c.address)) return false;
    seen.add(c.address);
    return true;
  });
}

// The coin's biggest pool, or null when it has none.
export async function getCoin(address) {
  const body = await get(`/tokens/${address}/pools?include=base_token&page=1`);
  const coins = coinsFrom(body).filter((c) => c.address === address);
  if (!coins.length) return null;
  return coins.reduce((best, c) => ((c.liquidityUsd ?? 0) > (best.liquidityUsd ?? 0) ? c : best));
}
