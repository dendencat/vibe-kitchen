# Node.js security runtime configuration — 2026-10-22

Application version: 2.0.1 (from 2.0.0). Select Node.js 22.23.4 in `.nvmrc` and `.node-version`; enforce the fixed patch floors for supported 22, 24, and 26 release lines through package engines and `engine-strict=true`. Dependency declarations and locked dependency resolutions are unchanged.

Source: [Node.js October 2026 security releases](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases). This update configures local tooling; it does not establish the runtime state of an existing deployment.

Verification used the verified Node.js 22.23.4 binary and `npm ci --ignore-scripts`. Typecheck, build, lint, format check, 265 unit tests, configured coverage (100% statements/branches/functions/lines), and all 7 Playwright scenarios passed. Browser tests used the existing pinned Playwright dependency with Chromium downloaded to a temporary directory, plus permission to start the local test server. No dependency upgrades or application behavior changes were made.
