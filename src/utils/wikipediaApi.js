export async function fetchWikipediaArticle(title) {
  // 1. Input Validation
  if (!title || typeof title !== "string" || title.trim() === "") {
    console.warn("⛔ fetchWikipediaArticle called with invalid title:", title);
    // Return null to indicate failure, allowing the calling function to do nothing.
    return null;
  }

  const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`;

  let res;
  try {
    res = await fetch(url);
  } catch (error) {
    // 2. Network/Fetch Error Handling
    console.error("🛑 Network error during Wikipedia fetch:", error);
    return null; // Return null on network errors
  }

  // 3. HTTP Response Error Handling (e.g., 404 Not Found)
  if (!res.ok) {
    console.error("🛑 Wikipedia fetch failed:", res.status, res.statusText);
    return null; // Return null on HTTP errors
  }

  let html = await res.text();

  // 4. Content Truncation (if applicable)
  // This part remains the same as it's about processing successful content
  const refIndex = html.indexOf('id="References"');
  if (refIndex !== -1) {
    html = html.slice(0, refIndex);
  }

  return html; // Return the HTML on success
}