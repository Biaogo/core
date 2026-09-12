## TL;DR

Prevent repeated preview failures from exhausting browser resources, recover unhealthy containers automatically, and close admin dropdowns when their triggers disappear.

## Changes

- Failed link previews now retain retry cooldowns, including first-fetch failures. Concurrent requests share a fetch, and database leases prevent duplicate collection across instances. ([f0419d5](https://github.com/mx-space/core/commit/f0419d58c4508a016367c1a2b4ff9d778352e5aa))
- Browser sessions retain their capacity until closure is confirmed. Failed closures quarantine the session rather than repeatedly launching replacements. ([f0419d5](https://github.com/mx-space/core/commit/f0419d58c4508a016367c1a2b4ff9d778352e5aa))
- Docker images now include a PID 1 reaper and an independent watchdog for excessive browser processes, fully quarantined pools, and missing application heartbeats. Recovery exits the container and requires an enabled restart policy; API requests may be briefly interrupted. Core dumps are disabled by default, and supplied Compose files bound container logs. ([f0419d5](https://github.com/mx-space/core/commit/f0419d58c4508a016367c1a2b4ff9d778352e5aa))
- Admin dropdowns close when their trigger becomes hidden, preventing detached menus from remaining on screen. ([61838f0](https://github.com/mx-space/core/commit/61838f09e))

---

**Full Changelog**: https://github.com/mx-space/core/compare/v14.10.0...v14.10.1
