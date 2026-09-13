## What does this change?

<!-- One or two sentences. Link the issue this closes, if any. -->

## Area

- [ ] Backend (Rust API)
- [ ] iOS app
- [ ] Web / Docs
- [ ] CI / deployment

## Checklist

- [ ] Targets `dev`, not `main` (branch strategy is `main` → `test` → `sit` → `dev`)
- [ ] Backend: `cargo test` passes
- [ ] iOS: `xcodebuild -scheme truelable -destination 'platform=iOS Simulator,name=<device>' build-for-testing` passes
- [ ] Web: `bun run lint && bun run check-types && bun run build` passes
- [ ] Docs updated (`web/apps/docs`) if this changes an API contract or app architecture

## Screenshots

<!-- For UI changes: iOS or web, before/after. -->
