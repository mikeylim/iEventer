import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Default-on caching is fine for our use case; auth-dependent pages
  // already opt out via `export const dynamic = "force-dynamic"`.
});
