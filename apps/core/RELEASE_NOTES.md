## TL;DR

Admin editors now pick up remote draft-head changes live, and publishing a draft sends content push notifications again.

## Highlights

When another session saves a draft, the server now broadcasts a DRAFT_UPDATE to connected admin clients. The dashboard adopts the new head without waiting for the next save: if the editor has no unsaved work, the open draft updates in place and keeps scroll and panels; if there are local edits, a banner offers to take the new version or merge, using the same merge path as save conflicts.

Content push notifications previously fired only when a post or note was created for the first time. Publishing from a draft uses a republish path, so subscribers never got a ping when that draft went live. Republishing now sends the same content-published notification as a first-time create.

## Changes

### Features

- Connected admin editors receive draft-head updates as soon as another client saves, and can adopt the new revision without a manual refresh ([2703448](https://github.com/mx-space/core/commit/2703448ec5fb8a6b9949d9fa11adf83a98f62580), [7d91e65](https://github.com/mx-space/core/commit/7d91e65da1019f7ceeac440f1fca591c066a55fc))

### Bug Fixes

- Publishing a post or note from a draft now sends content push notifications, matching the create path ([43446bf](https://github.com/mx-space/core/commit/43446bf1e73affb1ab32cf452bae47d20eb5cccd))

---

**Full Changelog**: https://github.com/mx-space/core/compare/v14.10.1...v14.10.2
