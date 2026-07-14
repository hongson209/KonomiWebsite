const SERVER = {
  javaHost: "konomimc.top",
  javaPort: 25565,
};

const jsonHeaders = {
  "Content-Type": "application/json; charset=UTF-8",
  "Cache-Control": "no-store, max-age=0",
  "Access-Control-Allow-Origin": "*",
  "X-Content-Type-Options": "nosniff",
};

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function normalizeFallback(data) {
  const version =
    data?.protocol?.name ||
    data?.version ||
    "—";

  return {
    online: Boolean(data?.online),
    host: data?.hostname || SERVER.javaHost,
    port: Number(data?.port) || SERVER.javaPort,

    players: {
      online: Number(data?.players?.online) || 0,
      max: Number(data?.players?.max) || 0,
    },

    version: {
      name: version,
      name_clean: version,
    },

    motd: {
      clean: Array.isArray(data?.motd?.clean)
        ? data.motd.clean
        : [data?.motd?.clean || "—"],

      raw: Array.isArray(data?.motd?.raw)
        ? data.motd.raw
        : [data?.motd?.raw || "—"],
    },

    icon: data?.icon || null,
    provider: "mcsrvstat.us",
  };
}

async function getServerStatus() {
  const address = encodeURIComponent(
    `${SERVER.javaHost}:${SERVER.javaPort}`,
  );

  // API chính
  try {
    const primaryUrl =
      `https://api.mcstatus.io/v2/status/java/${address}` +
      `?query=false&timeout=6`;

    const primaryResponse = await fetchWithTimeout(
      primaryUrl,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "KonomiMC-Website/5.1",
        },
      },
      9000,
    );

    if (primaryResponse.ok) {
      const data = await primaryResponse.json();

      return {
        ...data,
        provider: "mcstatus.io",
      };
    }
  } catch (error) {
    console.log("Primary status API failed:", error?.message);
  }

  // API dự phòng
  try {
    const fallbackUrl =
      `https://api.mcsrvstat.us/3/${address}`;

    const fallbackResponse = await fetchWithTimeout(
      fallbackUrl,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "KonomiMC-Website/5.1 contact=4h3svn@gmail.com",
        },
      },
      9000,
    );

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      return normalizeFallback(data);
    }
  } catch (error) {
    console.log("Fallback status API failed:", error?.message);
  }

  throw new Error("Không kết nối được dịch vụ kiểm tra máy chủ");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/locale") {
      const country = request.cf?.country || "XX";
      const language = country === "VN" ? "vi" : "en";

      return new Response(
        JSON.stringify({
          country,
          language,
        }),
        {
          status: 200,
          headers: jsonHeaders,
        },
      );
    }

    if (url.pathname === "/api/status") {
      try {
        const data = await getServerStatus();

        return new Response(
          JSON.stringify(data),
          {
            status: 200,
            headers: jsonHeaders,
          },
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            __error: true,
            online: false,
            message: error?.message || "Status API failed",
          }),
          {
            status: 502,
            headers: jsonHeaders,
          },
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
};
