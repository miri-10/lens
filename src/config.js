function number(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const config = {
  dryRun: process.env.DRY_RUN !== "false",
  x: {
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  },
  rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  postIntervalHours: number("POST_INTERVAL_HOURS", 4),
  summaryHourUtc: Number(process.env.SUMMARY_HOUR_UTC ?? 14),
  mentionCheckMinutes: number("MENTION_CHECK_MINUTES", 15),
  maxRepliesPerUserPerDay: number("MAX_REPLIES_PER_USER_PER_DAY", 5),
};
