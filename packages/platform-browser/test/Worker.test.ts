import "@vitest/web-worker"
import * as EffectWorker from "@effect/platform-browser/Worker"
import { Effect, Stream } from "effect"
import { assert, describe, it } from "vitest"

describe("Worker", () => {
  it("executes streams", () =>
    Effect.gen(function*(_) {
      const pool = yield* _(EffectWorker.makePool<number, never, number>({
        spawn: () => new globalThis.Worker(new URL("./fixtures/worker.ts", import.meta.url)),
        size: 1
      }))
      const items = yield* _(pool.execute(99), Stream.runCollect)
      assert.strictEqual(items.length, 100)
    }).pipe(Effect.scoped, Effect.provide(EffectWorker.layerManager), Effect.runPromise))

  it("SharedWorker", () =>
    Effect.gen(function*(_) {
      const pool = yield* _(EffectWorker.makePool<number, never, number>({
        spawn: () => new globalThis.SharedWorker(new URL("./fixtures/worker.ts", import.meta.url)),
        size: 1
      }))
      const items = yield* _(pool.execute(99), Stream.runCollect)
      assert.strictEqual(items.length, 100)
    }).pipe(Effect.scoped, Effect.provide(EffectWorker.layerManager), Effect.runPromise))

  // TODO: vitest/web-worker doesn't support postMessage throwing errors
  // it("send error", () =>
  //   Effect.gen(function*(_) {
  //     const pool = yield* _(EffectWorker.makePool<number, never, number>({
  //       spawn: () => new globalThis.Worker(new URL("./fixtures/worker.ts", import.meta.url)),
  //       transfers(_message) {
  //         return [new Uint8Array([1, 2, 3])]
  //       },
  //       size: 1
  //     }))
  //     const items = yield* _(pool.execute(99), Stream.runCollect, Effect.flip)
  //     console.log(items)
  //   }).pipe(Effect.scoped, Effect.provide(EffectWorker.layerManager), Effect.runPromise))
})
