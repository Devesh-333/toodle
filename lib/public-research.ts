import type { PublicEvidenceItem } from "./types";

const USER_AGENT = "IdeaProbe/1.0 (public idea validation)";
const MAX_SNIPPET = 360;
const STOP_WORDS = new Set("about after again against all also and any app are because been before being between build can could daily does each from have help into idea ideas just make more most need needs people real same that them then there these they this through using want was were what when where which while with would your their for the its our you how why who use has not but user users helps service using using".split(" "));

function keywords(idea: string) {
  const words = idea.toLowerCase().match(/[a-z0-9][a-z0-9'-]{2,}/g) ?? [];
  const selected = [...new Set(words.filter((word) => !STOP_WORDS.has(word)))].slice(0, 7);
  return selected.join(" ") || "startup idea";
}

async function fetchJson(url: string, timeoutMs = 5500): Promise<unknown> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Public search returned ${response.status}`);
  return response.json();
}

function excerpt(text: unknown): string {
  if (typeof text !== "string") return "";
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_SNIPPET);
}

type RedditPost = { title?: unknown; selftext?: unknown; ups?: unknown; subreddit?: unknown; permalink?: unknown; num_comments?: unknown };
function redditUrl(path: unknown): string | null {
  if (typeof path !== "string" || !/^\/r\/[\w-]+\/comments\/[\w]+(?:\/[^?#]*)?/.test(path)) return null;
  return `https://www.reddit.com${path}`;
}

function redditPosts(data: unknown): RedditPost[] {
  const children = (data as { data?: { children?: Array<{ data?: RedditPost }> } })?.data?.children;
  return Array.isArray(children) ? children.map((child) => child.data).filter((item): item is RedditPost => !!item && typeof item === "object") : [];
}

async function searchReddit(query: string): Promise<PublicEvidenceItem[]> {
  const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(`${query} pain OR frustration OR "I wish"`)}&sort=relevance&limit=25`;
  const posts = redditPosts(await fetchJson(searchUrl));
  const results: PublicEvidenceItem[] = [];
  const commentCandidates = posts.filter((post) => redditUrl(post.permalink) && Number(post.num_comments) > 0).slice(0, 3);
  const commentSets = await Promise.allSettled(commentCandidates.map(async (post) => {
    const url = redditUrl(post.permalink)!;
    const thread = await fetchJson(`${url}.json?limit=8&sort=top`, 3500);
    const threadData = thread as Array<{ data?: { children?: Array<{ kind?: string; data?: { body?: unknown; permalink?: unknown; ups?: unknown } }> } }>;
    const comments = threadData[1]?.data?.children ?? [];
    return comments.filter((item) => item.kind === "t1" && typeof item.data?.body === "string" && !item.data.body.startsWith("[deleted]") && !item.data.body.startsWith("[removed]"))
      .slice(0, 2).map((item): PublicEvidenceItem => ({
        id: `reddit-comment-${String(item.data?.permalink ?? "").slice(-48)}`,
        source: "Reddit", kind: "comment", title: excerpt(post.title), snippet: excerpt(item.data?.body),
        score: Number.isFinite(Number(item.data?.ups)) ? Number(item.data?.ups) : null,
        community: typeof post.subreddit === "string" ? `r/${post.subreddit}` : null,
        url: redditUrl(item.data?.permalink) ?? url,
      })).filter((item) => item.snippet);
  }));
  for (let i = 0; i < posts.length && results.length < 12; i += 1) {
    const post = posts[i];
    const url = redditUrl(post.permalink);
    const title = excerpt(post.title);
    const snippet = excerpt(post.selftext) || title;
    if (url && title && snippet) results.push({ id: `reddit-post-${String(post.permalink)}`, source: "Reddit", kind: "post", title, snippet, score: Number.isFinite(Number(post.ups)) ? Number(post.ups) : null, community: typeof post.subreddit === "string" ? `r/${post.subreddit}` : null, url });
  }
  for (const set of commentSets) if (set.status === "fulfilled") results.push(...set.value);
  return results.slice(0, 16);
}

async function searchHackerNews(query: string): Promise<PublicEvidenceItem[]> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=12`;
  const data = await fetchJson(url);
  const hits = (data as { hits?: Array<{ objectID?: unknown; title?: unknown; story_text?: unknown; points?: unknown; url?: unknown; num_comments?: unknown }> })?.hits;
  if (!Array.isArray(hits)) return [];
  return hits.flatMap((hit): PublicEvidenceItem[] => {
    const id = typeof hit.objectID === "string" ? hit.objectID : "";
    const title = excerpt(hit.title);
    const destination = typeof hit.url === "string" && /^https?:\/\//i.test(hit.url) ? hit.url : `https://news.ycombinator.com/item?id=${encodeURIComponent(id)}`;
    if (!id || !title) return [];
    const result: PublicEvidenceItem[] = [{ id: `hn-${id}`, source: "Hacker News", kind: "post", title, snippet: excerpt(hit.story_text) || title, score: Number.isFinite(Number(hit.points)) ? Number(hit.points) : null, community: "Hacker News", url: destination }];
    return result;
  });
}

export async function collectPublicEvidence(idea: string): Promise<PublicEvidenceItem[]> {
  const query = keywords(idea);
  const [reddit, hackerNews] = await Promise.allSettled([searchReddit(query), searchHackerNews(query)]);
  const items = [
    ...(reddit.status === "fulfilled" ? reddit.value : []),
    ...(hackerNews.status === "fulfilled" ? hackerNews.value : []),
  ];
  return items.slice(0, 24);
}
