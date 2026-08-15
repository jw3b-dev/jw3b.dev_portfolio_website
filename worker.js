// Site Worker entry — serves the built SPA from the ASSETS binding.
// `not_found_handling: single-page-application` (wrangler.jsonc) makes any
// unmatched path fall back to index.html so React Router client routes resolve.
export default {
  fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
