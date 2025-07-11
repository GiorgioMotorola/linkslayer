export async function fetchWikipediaArticle(title) {
  if (!title || typeof title !== "string" || title.trim() === "") {
    console.warn("⛔ fetchWikipediaArticle called with invalid title:", title);
    return "<p style='color:red;'>Invalid article title.</p>";
  }

  const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(
    title
  )}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error("🛑 Wikipedia fetch failed:", res.status, res.statusText);
    return "<p style='color:red;'>Article not found or failed to load.</p>";
  }

  let html = await res.text();

  const refIndex = html.indexOf('id="References"');
  if (refIndex !== -1) {
    html = html.slice(0, refIndex);
  }

  return html;
}
