# Nano Banana by Ace Data Cloud for Activepieces

Create Nano Banana images with Ace Data Cloud, then query the **same task ID**. This is an independent Ace integration, not an official Nano Banana product. [中文指南](README.zh-CN.md)

**Release state (2026-10-18):** source candidate `@acedatacloud/piece-nano-banana@0.1.0`. npm publication, full Activepieces installation and official shared-catalog listing are separate gates and are **not yet verified**. The official catalog target is a service-named entry **Nano Banana by Ace Data Cloud**. Do not assume a GitHub repository makes it searchable in the shared catalog.

## 1. Install when the package is published

[Activepieces community publication guide](https://www.activepieces.com/docs/build-pieces/sharing-pieces/community). For Activepieces CE 0.92.2+, a platform administrator uses **Platform Admin → Catalogue → Pieces → Install Piece → NPM Registry** and enters `@acedatacloud/piece-nano-banana` with the verified released version. Once installed, search **Nano Banana** in a flow, confirm **Nano Banana by Ace Data Cloud** and the Ace logo, then choose **Create Nano Banana task** or **Get Nano Banana task**.

![Official Activepieces custom-piece installation dialog](docs/screenshots/install-piece.png)

The screenshot is an official Activepieces documentation reference retrieved on 2026-10-18; it does not show this candidate installed. UI paths may differ by server version. Current contribution policy pauses unsolicited monorepo PRs; external npm publication is allowed. Official shared-catalog inclusion remains pending.

## 2. Register and obtain the correct API key

1. Register or sign in at [Ace Data Cloud Applications](https://platform.acedata.cloud/console/applications?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=nano_banana_activepieces_readme_api_key). If no General application exists, choose **Initialize General Application**.
2. Open General application or an application with **Nano Banana** access. General keys access entitled services; service-specific keys are limited to that service. Check [current price and balance](https://platform.acedata.cloud/models?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=nano_banana_activepieces_readme_pricing) before creating anything.
3. Click the application copy button marked **1**, or **Manage Keys** marked **2** to create a dedicated key.

![Copy the API key or open Manage Keys; real redacted screenshot](docs/screenshots/get-api-key-en.png)

4. Choose **Manage Keys → Create**, name it `Activepieces Nano Banana`, set expiry and usage limits as needed. If **Allowed APIs** is enabled, include `/nano-banana/images` and `/nano-banana/tasks`. Copy the created key.

![Create a dedicated API key; real redacted screenshot](docs/screenshots/create-api-key-en.png)

These redacted Ace console screenshots are reused from the fixed source listed in [image provenance](docs/screenshots/source.json); they are not evidence of a new service request. Paste only the raw key into the Activepieces **Connection → Ace Data Cloud API key** field, without `Bearer `. A `platform-...` management token is not a generation API key. Never include credentials in exported flows.

## 3. First flow and result

1. Import [the credential-free quickstart](examples/quickstart.json). It has Manual Trigger → Create Nano Banana task → Get Nano Banana task. The target instance also needs official `@activepieces/piece-manual-trigger@0.0.8`.
2. Select your own connection in both actions. Start with model `nano-banana-2-lite` and one image, 1K, 1:1. Review current price; these are sample inputs, not a price guarantee.
3. Run creation **once**, save `task_id`. Lookup maps that output automatically. If `pending`, wait and repeat only **Get Nano Banana task** using the same ID. Keep creation outside repeated polling.
4. Use `media_urls` only after `status=succeeded` and `success=true`; a pending preview is not final. Confirm one creation request and Credits deduction in [request history](https://platform.acedata.cloud/console/usages?utm_source=opensource&utm_medium=referral&utm_campaign=evergreen&utm_content=nano_banana_activepieces_readme_request_history). Task lookup does not create another item.

The first version exposes text-to-image only; image editing is not exposed yet. HTTP creation retries and template step retries are disabled. On creation timeout or 5xx inspect history before another submission; the task might already exist. No paid request was made during source validation.

## Troubleshooting and privacy

| Result | Action |
| --- | --- |
| 401/403 | Recheck raw API key, service entitlement, expiry and both Allowed APIs. |
| 400 | Check the selected model and required inputs against the current API guide. |
| pending | Query the same ID; do not repeat creation. |
| 429 | Reduce concurrency, wait, and inspect history; no automatic paid retry. |
| Failed or missing task | Check task/trace ID and retention in request history. |

Only chosen inputs and your key are sent to `https://api.acedata.cloud`; output removes internal routing and credentials. HTTPS certificates are verified; HTTPS proxy configuration is not supported. Prices and billing are in Credits; do not equate Credits with USD.

## Development

```sh
npm ci --legacy-peer-deps --ignore-scripts
npm test
npm pack --dry-run
```

Uses the pinned existing [Ace NanoBanana Dify contract](https://github.com/AceDataCloud/NanoBananaDify) as a mapping reference, not as publication proof. Source: https://github.com/AceDataCloud/NanoBananaActivepieces · Support: https://github.com/AceDataCloud/NanoBananaActivepieces/issues · dev@acedata.cloud · MIT.
