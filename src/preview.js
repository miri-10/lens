// Shows what the bot would post, without sending anything or changing its memory.
//   npm run preview                  -> one of each post type
//   npm run reply -- "<post text>"   -> the reply the bot would give to that post

import { makeSummaryPost, makeTermPost, makeTipPost, makeTrendingPost } from "./content/posts.js";
import { makeReply } from "./replies.js";
import { postLength } from "./text.js";

function show(title, text) {
  console.log(`\n=== ${title} (${postLength(text)}/280) ===\n${text}`);
}

async function tryShow(title, make) {
  try {
    const result = await make();
    if (result) show(title, result.text);
    else console.log(`\n=== ${title} ===\n(nothing to post right now)`);
  } catch (err) {
    console.log(`\n=== ${title} ===\nFailed: ${err.message}`);
  }
}

const args = process.argv.slice(2);
if (args[0] === "--reply") {
  const text = args.slice(1).join(" ");
  if (!text) {
    console.log('Usage: npm run reply -- "@askLens is this legit? <contract address>"');
    process.exit(1);
  }
  show("Reply", await makeReply(text));
} else {
  await tryShow("Trending coin", () => makeTrendingPost());
  await tryShow("Safety tip", () => makeTipPost(Math.floor(Math.random() * 100)));
  await tryShow("Crypto term", () => makeTermPost(Math.floor(Math.random() * 100)));
  await tryShow("Daily recap", () => makeSummaryPost());
}
