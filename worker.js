// Site Worker entry — serves the built SPA from the ASSETS binding.
// `not_found_handling: single-page-application` (wrangler.jsonc) makes any
// unmatched path fall back to index.html so React Router client routes resolve.
export default {
  async fetch(request, env) {
    const res = await env.ASSETS.fetch(request);
    // Tag responses so we can confirm the Worker (not Pages) is serving a host.
    const out = new Response(res.body, res);
    out.headers.set("x-served-by", "jw3b-dev-site-worker");
    // Never edge/browser-cache the SPA shell: a plain Vite SPA has no deploy-tied
    // cache invalidation (unlike agilegypsy's OpenNext), so a cached index.html pins
    // visitors to stale hashed-asset refs and new deploys never show. Content-hashed
    // /assets/* keep their own immutable long-cache headers untouched.
    const ct = out.headers.get("content-type") || "";
    if (ct.includes("text/html")) {
      out.headers.set("cache-control", "no-store, must-revalidate");
    }
    return out;
  },
};
