# Frontend Tests

Frontend tests now keep both legacy jsdom verification and real browser E2E coverage:

- `unit/` for utils, store, crypto, and storage tests
- `integration/` for page and state coordination tests
- `e2e/` for legacy jsdom-based "pseudo E2E" verification
- `browser/` for Playwright-based real browser E2E
- `fixtures/` for shared test data and mock services
