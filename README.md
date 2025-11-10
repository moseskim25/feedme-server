# feedme-server

## Environment Variables

### Cloudflare Images

The server now uploads generated images directly to [Cloudflare Images](https://developers.cloudflare.com/images/). Make sure these environment variables are defined before running the API:

- `CLOUDFLARE_API_TOKEN` – Scoped API token with **Images: Edit** permission (a global or origin key will not work).
- `CLOUDFLARE_ACCOUNT_ID` – Your Cloudflare account ID.
- `CLOUDFLARE_IMAGES_DELIVERY_VARIANT` – Optional. If set, the API chooses the matching variant URL from the upload response; otherwise it falls back to the first variant returned.

You can remove the legacy `R2_*` variables once you stop using R2-generated URLs.

### Sentry

Error tracking and monitoring is configured via [Sentry](https://sentry.io/). To enable it, set:

- `SENTRY_DSN` – Your Sentry project DSN (optional, Sentry will be disabled if not set).
