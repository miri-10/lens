// Formatting helpers for posts.

export const MAX_POST_LENGTH = 280;

// X counts most emoji and non-Latin characters as 2.
export function postLength(text) {
  let length = 0;
  for (const ch of text) length += ch.codePointAt(0) <= 0x10ff ? 1 : 2;
  return length;
}

// Drops whole lines from the middle (keeping the first and last line) until the post fits.
export function fitPost(text) {
  const lines = text.split("\n");
  while (postLength(lines.join("\n")) > MAX_POST_LENGTH && lines.length > 2) {
    lines.splice(lines.length - 2, 1);
  }
  const fitted = lines.join("\n");
  if (postLength(fitted) <= MAX_POST_LENGTH) return fitted;
  let cut = "";
  for (const ch of fitted) {
    if (postLength(cut + ch + "…") > MAX_POST_LENGTH) break;
    cut += ch;
  }
  return cut + "…";
}

export function usd(value) {
  if (value == null || !Number.isFinite(value)) return "unknown";
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

export function percent(value) {
  if (value == null || !Number.isFinite(value)) return "unknown";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}%`;
}

export function age(createdAt, now = Date.now()) {
  if (!createdAt) return "unknown";
  const hours = (now - new Date(createdAt).getTime()) / 3_600_000;
  if (!Number.isFinite(hours) || hours < 0) return "unknown";
  if (hours < 1) return "under 1 hour";
  if (hours < 48) return `${Math.floor(hours)} hours`;
  const days = Math.floor(hours / 24);
  if (days < 60) return `${days} days`;
  return `${Math.floor(days / 30)} months`;
}

export function shortAddress(address) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
