// Talks to X. In dry-run mode it only prints what it would do.

import { appendFile, mkdir } from "node:fs/promises";
import { TwitterApi } from "twitter-api-v2";
import { config } from "./config.js";

let client;
let me;

function getClient() {
  if (!client) {
    const { appKey, appSecret, accessToken, accessSecret } = config.x;
    if (!appKey || !appSecret || !accessToken || !accessSecret) {
      throw new Error("X API keys are missing. Fill them in .env, or set DRY_RUN=true.");
    }
    client = new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
  }
  return client;
}

async function log(entry) {
  await mkdir(new URL("../data/", import.meta.url), { recursive: true });
  await appendFile(
    new URL("../data/posts.log", import.meta.url),
    JSON.stringify({ at: new Date().toISOString(), dryRun: config.dryRun, ...entry }) + "\n",
  );
}

export async function post(text) {
  if (config.dryRun) {
    console.log(`\n[dry run] POST\n${text}\n`);
  } else {
    await getClient().v2.tweet(text);
  }
  await log({ type: "post", text });
}

export async function reply(text, toId) {
  if (config.dryRun) {
    console.log(`\n[dry run] REPLY to ${toId}\n${text}\n`);
  } else {
    await getClient().v2.reply(text, toId);
  }
  await log({ type: "reply", toId, text });
}

// New mentions since sinceId, each with the text of the post it replied to.
export async function getMentions(sinceId) {
  if (config.dryRun) return [];
  const api = getClient().v2;
  me ??= (await api.me()).data;
  const page = await api.userMentionTimeline(me.id, {
    ...(sinceId ? { since_id: sinceId } : {}),
    expansions: ["referenced_tweets.id", "author_id"],
    "tweet.fields": ["author_id", "referenced_tweets"],
    max_results: 50,
  });
  const parents = new Map((page.includes?.tweets ?? []).map((t) => [t.id, t.text]));
  return (page.data?.data ?? [])
    .filter((t) => t.author_id !== me.id)
    .map((t) => {
      const parentId = t.referenced_tweets?.find((r) => r.type === "replied_to")?.id;
      return { id: t.id, authorId: t.author_id, text: t.text, parentText: parents.get(parentId) ?? "" };
    });
}
