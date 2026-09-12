import { Args, Command, Options } from '@effect/cli'
import { FileSystem } from '@effect/platform'
import { Cause, Effect, Exit, Option } from 'effect'
import open from 'open'

import { Generic, ValidationXml } from '../../domain/errors'
import { Lexical, type LexicalState } from '../../services/Lexical'
import { Renderer } from '../../services/Renderer'
import { registerCommandHelp } from '../help/registry'
import { openAuthorDocument } from './document'
import { nodeAuthorFs } from './fs'
import {
  findCliPackageRoot,
  isAuthorSourceModule,
  pickAuthorPort,
  resolveAuthorSpaDir,
} from './paths'
import { startAuthorServer } from './server'

registerCommandHelp({
  name: 'author',
  description:
    'open a local admin editor for a LiteXML fragment or <mxpost>/<mxnote> envelope',
  isLeaf: true,
  skillChapter: 'commands-author',
  leafOptions: [
    {
      flag: '--port <n>',
      description:
        'listen on this port; fail if occupied. Default: first free port from 4173',
    },
    {
      flag: '--no-open',
      description: 'print the URL without opening a browser',
    },
    {
      flag: '--variant <article|note>',
      description:
        'editor variant for raw fragments; envelopes use the root tag',
    },
  ],
})

const fileArg = Args.text({ name: 'file' })
const portOpt = Options.integer('port').pipe(Options.optional)
const noOpenOpt = Options.boolean('no-open').pipe(Options.optional)
const variantOpt = Options.choice('variant', ['article', 'note']).pipe(
  Options.optional,
)

export const authorCmd = Command.make(
  'author',
  {
    file: fileArg,
    port: portOpt,
    noOpen: noOpenOpt,
    variant: variantOpt,
  },
  ({ file, port, noOpen, variant }) =>
    Effect.gen(function* () {
      const renderer = yield* Renderer
      const lexical = yield* Lexical
      const fs = yield* FileSystem.FileSystem

      if (file === '-' || file === '') {
        return yield* Effect.fail(
          new ValidationXml({
            message: 'mxs author requires a file path',
            hint: 'write the envelope to a file first, then `mxs author <file>`',
          }),
        )
      }

      const exists = yield* fs.exists(file)
      if (!exists) {
        return yield* Effect.fail(
          new Generic({
            message: `file not found: ${file}`,
          }),
        )
      }

      const source = yield* fs.readFileString(file).pipe(
        Effect.mapError(
          (err) =>
            new Generic({
              message: `cannot read ${file}: ${err.message}`,
              cause: err,
            }),
        ),
      )

      const cliRoot = findCliPackageRoot(import.meta.url)
      if (!cliRoot) {
        return yield* Effect.fail(
          new Generic({ message: 'cannot resolve @mx-space/cli package root' }),
        )
      }

      const spaDir = resolveAuthorSpaDir(
        cliRoot,
        isAuthorSourceModule(import.meta.url),
      )
      const listenPort = yield* Effect.tryPromise({
        try: () => pickAuthorPort(Option.getOrUndefined(port)),
        catch: (err) =>
          err instanceof Generic
            ? err
            : new Generic({ message: String(err), cause: err }),
      })

      const doc = yield* Effect.try({
        try: () =>
          openAuthorDocument(file, source, Option.getOrUndefined(variant)),
        catch: (err) =>
          err instanceof ValidationXml
            ? err
            : new ValidationXml({
                message: err instanceof Error ? err.message : String(err),
                cause: err,
              }),
      })

      const runXml = <A>(eff: Effect.Effect<A, ValidationXml>): A => {
        const exit = Effect.runSyncExit(eff)
        if (Exit.isSuccess(exit)) return exit.value
        const err = Cause.squash(exit.cause)
        throw err instanceof Error ? err : new Error(String(err))
      }

      yield* Effect.try({
        try: () => {
          doc.originalBody = runXml(
            lexical.payloadToLitexml(
              runXml(lexical.litexmlToPayload(doc.originalBody)),
            ),
          )
        },
        catch: (err) =>
          new ValidationXml({
            message: err instanceof Error ? err.message : String(err),
            cause: err,
          }),
      })

      const server = yield* Effect.tryPromise({
        try: () =>
          startAuthorServer({
            doc,
            spaDir,
            port: listenPort,
            fs: nodeAuthorFs,
            codec: {
              litexmlToLexical: (xml) => runXml(lexical.litexmlToPayload(xml)),
              lexicalToLitexml: (state) =>
                runXml(lexical.payloadToLitexml(state as LexicalState)),
            },
          }),
        catch: (err) =>
          new Generic({
            message: err instanceof Error ? err.message : String(err),
            cause: err,
          }),
      })

      const url = `http://127.0.0.1:${server.port}`
      yield* renderer.emitInfo(`mxs author ${url}`)
      yield* renderer.emitInfo(`saving writes ${file} and ${file}.diff`)

      if (!Option.getOrElse(noOpen, () => false)) {
        yield* Effect.promise(() => open(url))
      }

      yield* Effect.async<void, Generic>((resume) => {
        const stop = () => {
          void server.close().then(
            () => resume(Effect.void),
            (err) =>
              resume(
                Effect.fail(
                  new Generic({
                    message: err instanceof Error ? err.message : String(err),
                    cause: err,
                  }),
                ),
              ),
          )
        }
        process.once('SIGINT', stop)
        process.once('SIGTERM', stop)
      })
    }),
)
