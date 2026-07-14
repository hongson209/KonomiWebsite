export async function onRequestGet(context) {
  const country = String(context.request.cf?.country || "").toUpperCase();
  const language = country === "VN" ? "vi" : "en";
  return new Response(JSON.stringify({ country, language }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store, max-age=0",
      "x-content-type-options": "nosniff"
    }
  });
}
