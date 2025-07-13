export async function fetchWikipediaArticle(title) {
  if (!title || typeof title !== "string" || title.trim() === "") {
    console.warn("⛔ fetchWikipediaArticle called with invalid title:", title);
    return null;
  }

  const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(
    title
  )}`;

  let res;
  try {
    res = await fetch(url);
  } catch (error) {
    console.error("🛑 Network error during Wikipedia fetch:", error);
    return null;
  }

  if (!res.ok) {
    console.error("🛑 Wikipedia fetch failed:", res.status, res.statusText);
    return null;
  }

  let html = await res.text();

  const refIndex = html.indexOf('id="References"');
  if (refIndex !== -1) {
    html = html.slice(0, refIndex);
  }

  return html;
}
