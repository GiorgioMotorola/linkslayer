export async function fetchWikipediaArticle(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`;
  const res = await fetch(url);

  if (!res.ok) return '<p>Article not found.</p>';

  let html = await res.text();
  const refIndex = html.indexOf('id="References"');
  if (refIndex !== -1) {
    html = html.slice(0, refIndex);
  }

  return html;
}
