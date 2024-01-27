# cf-workers-kv-pixel

Lightweight library for tracking embedded pixels with Cloudflare Workers and KV Storage. The Worker acts as a proxy and returns the base64 1x1px transparent pixel. Parsing the URL parameters to collect data based around the Cloudflare request object.

See documentation regarding [Cloudflare Workers](https://developers.cloudflare.com/workers/get-started/) and [KV Storage](https://developers.cloudflare.com/kv/get-started/)

## Setup

- Create a KV worker and `wrangler.toml` file. Set it up similar to the `wrangler.example.toml` file.
- Run `wrangler deploy` to deploy
- (OPTIONAL): Define a custom route
- Embed your pixel where you want, email, etc.
  - (IMPORTANT): Make sure you pass `?id=<string>` to your URL to make sure it saves to KV
- Visit your worker URL or custom route `/analytics` to see your tracking
  - (OPTIONAL): Set up Cloudflare Access to protect the Analytics data from the public
