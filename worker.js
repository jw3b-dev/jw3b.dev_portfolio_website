// Site Worker entry — serves the built SPA from the ASSETS binding.
// `not_found_handling: single-page-application` (wrangler.jsonc) makes any
// unmatched path fall back to index.html so React Router client routes resolve.
export default {
  async fetch(request, env) {
    const res = await env.ASSETS.fetch(request);
    // Tag responses so we can confirm the Worker (not Pages) is serving a host.
    const out = new Response(res.body, res);
    out.headers.set("x-served-by", "jw3b-dev-site-worker");
    return out;
  },
};
