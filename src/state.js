// Remembers what the bot already did, in data/state.json.

import { mkdir, readFile, writeFile } from "node:fs/promises";

const FILE = new URL("../data/state.json", import.meta.url);

const DEFAULT_STATE = {
  lastPostAt: 0,
  lastSummaryDate: "",
  postCount: 0,
  tipIndex: 0,
  termIndex: 0,
  recentCoins: [], // [{ address, at }]
  lastMentionId: null,
  repliedIds: [],
  repliesPerUser: {}, // { "<date>:<userId>": count }
};

export async function loadState() {
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(await readFile(FILE, "utf8")) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveState(state) {
  const day = new Date().toISOString().slice(0, 10);
  state.recentCoins = state.recentCoins.filter((c) => Date.now() - c.at < 24 * 3_600_000);
  state.repliedIds = state.repliedIds.slice(-500);
  state.repliesPerUser = Object.fromEntries(
    Object.entries(state.repliesPerUser).filter(([key]) => key.startsWith(day)),
  );
  await mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await writeFile(FILE, JSON.stringify(state, null, 2));
}
