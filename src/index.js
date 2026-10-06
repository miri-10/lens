// The bot: posts on a schedule and replies when tagged. Stop it with Ctrl+C.

import { config } from "./config.js";
import { makeSummaryPost, makeTermPost, makeTipPost, makeTrendingPost } from "./content/posts.js";
import { makeReply } from "./replies.js";
import { loadState, saveState } from "./state.js";
import { getMentions, post, reply } from "./x.js";

// The order regular posts rotate through.
const CYCLE = ["trending", "tip", "trending", "term"];
const TICK_MS = 60_000;

const today = () => new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function nextPost(state) {
  const kind = CYCLE[state.postCount % CYCLE.length];
  if (kind === "trending") {
    const recent = state.recentCoins.map((c) => c.address);
    const trending = await makeTrendingPost(recent).catch((err) => {
      console.error(`Trending post failed, posting a tip instead: ${err.message}`);
      return null;
    });
    if (trending) {
      state.recentCoins.push({ address: trending.coinAddress, at: Date.now() });
      return trending;
    }
  }
  if (kind === "term") return makeTermPost(state.termIndex++);
  return makeTipPost(state.tipIndex++);
}

async function postIfDue(state) {
  const now = new Date();
  if (now.getUTCHours() >= config.summaryHourUtc && state.lastSummaryDate !== today()) {
    const summary = await makeSummaryPost();
    if (summary) await post(summary.text);
    state.lastSummaryDate = today();
    return;
  }
  if (Date.now() - state.lastPostAt < config.postIntervalHours * 3_600_000) return;
  const next = await nextPost(state);
  await post(next.text);
  state.lastPostAt = Date.now();
  state.postCount++;
}

async function answerMentions(state) {
  const mentions = await getMentions(state.lastMentionId);
  // X returns newest first; answer oldest first.
  for (const mention of [...mentions].reverse()) {
    if (!state.lastMentionId || BigInt(mention.id) > BigInt(state.lastMentionId)) {
      state.lastMentionId = mention.id;
    }
    if (state.repliedIds.includes(mention.id)) continue;
    state.repliedIds.push(mention.id);

    const key = `${today()}:${mention.authorId}`;
    if ((state.repliesPerUser[key] ?? 0) >= config.maxRepliesPerUserPerDay) continue;
    state.repliesPerUser[key] = (state.repliesPerUser[key] ?? 0) + 1;

    await reply(await makeReply(mention.text, mention.parentText), mention.id);
  }
}

async function step(name, state, fn) {
  try {
    await fn(state);
  } catch (err) {
    console.error(`${name} failed: ${err.message}`);
  } finally {
    await saveState(state);
  }
}

async function main() {
  console.log(`@askLens bot started${config.dryRun ? " in DRY RUN mode (nothing is sent to X)" : ""}.`);
  const state = await loadState();
  let lastMentionCheck = 0;
  for (;;) {
    await step("Posting", state, postIfDue);
    if (Date.now() - lastMentionCheck >= config.mentionCheckMinutes * 60_000) {
      lastMentionCheck = Date.now();
      await step("Replying", state, answerMentions);
    }
    await sleep(TICK_MS);
  }
}

main();
