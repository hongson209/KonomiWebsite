export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/locale") {
      const country = request.cf?.country || "XX";
      const language = country === "VN" ? "vi" : "en";

      return Response.json(
        { country, language },
        {
          headers: {
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    return env.ASSETS.fetch(request);
  },
};
