(function () {
  const metaBaseUrl = document.querySelector('meta[name="portfolio-api-base-url"]')?.content?.trim();
  const configuredBaseUrl = (window.PORTFOLIO_API_BASE_URL || metaBaseUrl || window.location.origin).replace(/\/+$/, "");
  const apiBaseUrl = configuredBaseUrl.endsWith("/api") ? configuredBaseUrl : `${configuredBaseUrl}/api`;

  async function request(path, options = {}) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = normalizedPath.startsWith("/api/")
      ? `${apiBaseUrl}${normalizedPath.slice(4)}`
      : `${apiBaseUrl}${normalizedPath}`;
    const headers = new Headers(options.headers || {});
    if (options.body !== undefined) headers.set("Content-Type", "application/json");

    let response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch {
      throw new Error("The portfolio server could not be reached. Please try again shortly.");
    }

    let payload = null;
    if (response.status !== 204) {
      const text = await response.text();
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          throw new Error(response.ok
            ? "The server returned an invalid JSON response."
            : `Request failed (${response.status}) with an invalid response.`);
        }
      }
    }
    if (!response.ok) {
      const details = payload && Array.isArray(payload.errors)
        ? payload.errors.map((item) => item.message).join(" ")
        : "";
      throw new Error(details || (payload && payload.message) || `Request failed (${response.status}).`);
    }
    return payload;
  }

  window.PortfolioAPI = Object.freeze({
    baseUrl: apiBaseUrl,
    request,
    get(path) {
      return request(path);
    },
    post(path, body) {
      return request(path, { method: "POST", body: JSON.stringify(body) });
    }
  });
})();
