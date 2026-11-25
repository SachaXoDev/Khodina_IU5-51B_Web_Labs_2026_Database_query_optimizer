# Index Catalog — Tauri 2 desktop app

The app has two views: a guest catalog with paginated search, filters and thumbnails; and read-only index details. Image search is part of the catalog. There is no sign-in, editing, or upload to the server.

This branch includes the NestJS backend and the guest CLIP-candidate endpoint in [`../database_query_optimizer`](../database_query_optimizer). Run the backend separately for catalog browsing and in-app image search. Offline calibration does not need a running backend.

## Run and package

Use Node 22.12+ (or 20.19+) and current stable Rust (HTTP plugin minimum: Rust 1.90). Follow the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS: Xcode Command Line Tools on macOS, WebKitGTK 4.1 and build libraries on Linux, or MSVC Build Tools and WebView2 on Windows. Image inference also needs WebAssembly SIMD, module workers and worker `OffscreenCanvas`/`createImageBitmap` (a current WebView2/Safari/WebKitGTK; macOS 14 or newer recommended). No separately installed Cargo Tauri CLI is required.

```sh
# From the repository root:
cd native-tauri
npm ci
cp .env.example .env.local
# Edit .env.local with your actual API origin and, if different, MinIO origin.
npm run tauri -- dev
npm run tauri -- build --bundles app    # macOS .app; use dmg if wanted
# Linux: --bundles deb or appimage. Windows: --bundles nsis.
```

The packaged app is under `src-tauri/target/release/bundle/` for a host build. The LAN address is compiled in and displayed at the top of both pages. Change it and rebuild if the server's IP or port changes. An inline override also works, for example (replace the IP with your server's):

```sh
VITE_API_URL=http://192.168.1.78:3108 VITE_MEDIA_URL=http://192.168.1.78:9018 npm run tauri -- build --bundles app
```

For a defense without an Internet dependency at runtime, prepare the pinned q8 files and build with `VITE_BUNDLE_CLIP=1`. The catalog still uses the live LAN API.

```sh
node scripts/bundle-clip.mjs
VITE_BUNDLE_CLIP=1 VITE_API_URL=http://192.168.1.78:3108 VITE_MEDIA_URL=http://192.168.1.78:9018 npm run tauri -- build --bundles app
```

The preparation script reuses or downloads the calibration weights. Generated assets stay untracked under `public/models/`. Remove that generated directory before creating a compact, download-on-first-use build.

Start the backend separately on a LAN-facing interface and allow the API and MinIO ports through the host firewall. `VITE_API_URL` is an HTTP origin using a private RFC 1918 IPv4 address, **without `/api`**. Loopback, hostnames, URL credentials, and non-LAN addresses are rejected. `VITE_MEDIA_URL` defaults to the API IP on port 9000. For thumbnails, the backend must return relative `/media/…` or `/assets/…` URLs, or absolute URLs on one of the configured LAN origins with those paths. Set the backend's advertised MinIO host/port to an address that the desktop can reach; the client does not rewrite signed or absolute URLs. Invalid or unavailable thumbnails show an explicit placeholder.

The `npm run tauri` wrapper supplies a Tauri capability narrowed to the configured guest API/thumbnail paths and the `main` window. It supplies the same origin values to Vite. Do not bypass it with `npx tauri dev/build` or test LAN calls in a regular browser tab. The app makes GETs through the [Tauri HTTP plugin](https://v2.tauri.app/plugin/http-client/), with no cookies, authentication, redirects, browser CORS settings, or mixed-content exceptions. Images are displayed as local object URLs after a size- and type-checked fetch. The wrapper's loopback URL is used **only for the Vite development UI**, never the API. The release webview CSP permits bundled code and same-origin workers/WASM plus the Hugging Face HTTPS model downloads; it does not grant the webview access to arbitrary HTTP destinations. Use the LAN HTTP API only on a trusted network: it is not encrypted or authenticated.

## CLIP score and calibration

Guest `GET /api/indexes/clip-candidates?afterId=0&limit=100` returns `{items: [{id, shortDescription}], nextAfterId}`. Both parameters are optional; `afterId` accepts integers 0–2147483647 inclusive and `limit` accepts 1–100. Items are in ascending ID order. Send `nextAfterId` on the next request until it is `null`. The app scans all pages, independently of catalog pagination and filters. Candidates are published cards with trimmed descriptions of 50–100 characters for which the backend's local CLD3 detector ranks English first. Language detection is approximate, especially for short or mixed-language text. Reserved `demo_bench_idx_######` rows are excluded even on previously seeded databases; the legacy `clip_candidate` flag does not control eligibility.

The worker uses [Xenova/clip-vit-base-patch32](https://huggingface.co/Xenova/clip-vit-base-patch32/tree/6b7c523703ae26e39be4b03774966f8571c7f523) with Transformers.js 3.8.1. The pinned q8 text and vision ONNX encoders download about 154 MB total on first use unless bundled. ONNX's WASM runtime ships inside the app. The worker embeds the selected image once, scores caption pages locally, and reuses the loaded model and a bounded cache of text vectors. The file picker accepts JPEG, PNG or WebP (10 MiB, 16 megapixels maximum); the file remains on the device.

CLIP projects the image and descriptions into a common 512-dimensional space. The app L2-normalizes both vectors and uses their dot product, the raw cosine `c ∈ [-1, 1]`. It displays raw cosine and `score = (c + 1) / 2`. This affine transform preserves rank and does not depend on which other candidates are present; the score is **not a probability**. The threshold slider applies to `score` (0.40–0.90 inclusive), then Top K limits the globally sorted matches (1–20, with ID as the tie-breaker). A raw cosine of 0.30 maps to the provisional default score of 0.65; applying 0.40 directly to raw cosine rejected genuine matches in the fixture exercise. The diagnostics paginate all scores, including those below threshold. Threshold and Top K can be adjusted without re-running inference.

In the packaged app, open **Поиск по изображению** and click **Проверить на примере**. The Russian interface displays the real model scores without changing the English descriptions used by CLIP. The button uses the bundled `index_users_email.jpg`; **Выбрать файл** is available for other local photos.

Run the reproducible real-image exercise after installing dependencies:

```sh
npm run calibrate
# With the 14 labeled/demo candidates in PostgreSQL (see repository seed):
CLIP_DEMO_API=http://192.168.1.78:3108 npm run calibrate
```

For a live demo, initialize a disposable database with the backend schema and demo users, then run `psql "$DEMO_DATABASE_URL" -v demo_seed_confirm=1 -f scripts/demo_optimizer_seed.sql` from the repository root. The four photos in `fixtures/` are local calibration inputs; the backend must serve its own matching `/media/` files for catalog thumbnails.

Without an API the script reads all 14 captions from the SQL seed. With a live API it scores every page, labels the 14 known captions, and leaves extra captions unjudged rather than claiming they are false matches. The four local catalog photos each have a hand-labeled visible-content caption. The existing default-image placeholder and frontend hero graphic are no-match queries **against the 14 demo captions only**. The script prints the real scores for the labeled captions and the top results, compares the default with the best fixture F1 from a 0.01 threshold sweep, and reports false matches and unjudged hits separately. It uses the same model revision, q8 weights, normalization and ranking on ONNX Runtime CPU. The desktop uses WASM and webview image decoding, so allow small numerical differences.

In the offline CPU run with all 14 seed captions, the labeled caption ranked first for each of the four positive photos, but raw cosine ≥0.40 rejected all four. The cabinet photo scored raw 0.3220 / normalized 0.6610. At the default 0.65, three labeled positives passed and one did not (digital rain, 0.6374); no labeled negatives passed, including any candidate for either no-match graphic. Top K = 1, 3 or 5 gave the same three positive hits at that threshold. These are fixture results, not independent accuracy measurements.

Before adopting a less provisional threshold, record the desktop diagnostic scores on held-out photos/screenshots with relevant IDs labeled against the actual API candidate set. Include related but incorrect captions and out-of-domain images with no relevant candidate. Sweep thresholds over these labels; report precision, recall, and whether the relevant IDs appear in Top K. Choose a point that satisfies the desired precision without discarding too many valid matches, then verify it on a separate held-out set. Leave no-match results empty rather than lowering the threshold automatically.
