const articleCache = new Map();
const pendingRequests = new Map();

export async function fetchWikipediaArticle(title) {
  if (!title || typeof title !== "string" || title.trim() === "") {
    console.warn("⛔ fetchWikipediaArticle called with invalid title:", title);
    return null;
  }

  if (articleCache.has(title)) {
    console.log("✅ Cache hit for:", title);
    return articleCache.get(title);
  }

  if (pendingRequests.has(title)) {
    console.log("⏳ Waiting for pending request:", title);
    return pendingRequests.get(title);
  }

  const requestPromise = (async () => {
    const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(
      title
    )}`;

    let res;
    try {
      res = await fetch(url);
    } catch (error) {
      console.error("🛑 Network error during Wikipedia fetch:", error);
      pendingRequests.delete(title);
      return null;
    }

    if (!res.ok) {
      console.error("🛑 Wikipedia fetch failed:", res.status, res.statusText);
      pendingRequests.delete(title);
      return null;
    }

    let html = await res.text();

    const refIndex = html.indexOf('id="References"');
    if (refIndex !== -1) {
      html = html.slice(0, refIndex);
    }

    articleCache.set(title, html);
    pendingRequests.delete(title);

    console.log("💾 Cached article:", title, `(Cache size: ${articleCache.size})`);

    return html;
  })();

  pendingRequests.set(title, requestPromise);

  return requestPromise;
}

export function clearArticleCache() {
  articleCache.clear();
  pendingRequests.clear();
  console.log("🗑️ Article cache cleared");
}
