---
slug: commands-author
title: Author command
description: open a local admin editor for LiteXML / envelopes and write a sidecar diff
order: 41
---

# Author command

`mxs author` serves the same rich editor surface as the Mix Space admin write page for a local LiteXML fragment or `<mxpost>` / `<mxnote>` envelope. It does not contact `mx-core`. Saving writes the file back and overwrites `<file>.diff` with a unified diff of the current body against the body frozen when the process started.

| Command | Behavior |
| --- | --- |
| `mxs author <file>` | Start the editor, print the URL, open a browser. |
| `mxs author --no-open <file>` | Print the URL only. |
| `mxs author --port 4173 <file>` | Listen on that port; fail if it is occupied. |
| `mxs author --variant note <file>` | Force note variant for a raw fragment. Envelopes ignore this and use the root tag. |

`<file>` is required. Stdin (`-`) is not accepted.

## Save contract

- Only the `<content>` body is edited. Envelope meta (title, slug, tags, …) is left byte-stable.
- Each save overwrites `<file>` and `<file>.diff`.
- The diff is always current body vs the body at process start, not vs the previous save.
- An unchanged save still writes a headers-only diff.
- The process owns the file until Ctrl+C. Do not rewrite `<file>` from another process while it is running.

## Agent loop

1. Write the envelope to a file.
2. Start `mxs author <file>` (background is fine) and tell the human the URL.
3. **Stop.** Do not poll, do not auto-continue.
4. When the human says they are done, read `<file>.diff`. Use that to understand edits. Do not rescan the full article unless the diff is missing or unreadable.
5. Continue with slop / publish using the updated file.

## Failure modes

| Symptom | Likely cause |
| --- | --- |
| `cannot resolve mxs author editor` | Source: run `pnpm -C apps/admin run build:author`. Published: reinstall `@mx-space/cli`. |
| `port N is in use` | Pick another `--port` or omit it. |
| `file not found` | Pass a real path; stdin is not supported. |
| `expected root <mxpost>` | Envelope is malformed. |
