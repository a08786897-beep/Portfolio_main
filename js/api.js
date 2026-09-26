(function () {
  const baseUrl = (window.PORTFOLIO_API_BASE_URL || `${window.location.origin}/api`).replace(/\/+$/, "");
  const tokenKey = "portfolioAdminToken";

  async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (options.body !== undefined) headers.set("Content-Type", "application/json");
    const token = sessionStorage.getItem(tokenKey);
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, { ...options, headers });
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
    baseUrl,
    tokenKey,
    request,
    get(path) {
      return request(path);
    },
    post(path, body) {
      return request(path, { method: "POST", body: JSON.stringify(body) });
    },
    put(path, body) {
      return request(path, { method: "PUT", body: JSON.stringify(body) });
    },
    patch(path, body) {
      return request(path, { method: "PATCH", body: JSON.stringify(body) });
    },
    delete(path) {
      return request(path, { method: "DELETE" });
    }
  });
})();
