import * as FormData from "@effect/platform/Http/FormData"
import { Chunk, Effect, identity, Stream } from "effect"
import { assert, describe, test } from "vitest"

describe("FormData", () => {
  test("it parses", () =>
    Effect.gen(function*(_) {
      const data = new globalThis.FormData()
      data.append("foo", "bar")
      data.append("test", "ing")
      data.append("file", new globalThis.File(["A".repeat(1024 * 1024)], "foo.txt", { type: "text/plain" }))
      const response = new Response(data)

      const parts = yield* _(
        Stream.fromReadableStream(() => response.body!, identity),
        Stream.pipeThroughChannel(FormData.makeChannel(Object.fromEntries(response.headers))),
        Stream.mapEffect((part) => {
          return Effect.unified(
            part._tag === "File" ?
              Effect.zip(
                Effect.succeed(part.name),
                Stream.runLast(Stream.mkString(Stream.decodeText(part.content))).pipe(Effect.flatten)
              ) :
              Effect.succeed([part.key, part.value] as const)
          )
        }),
        Stream.runCollect
      )

      assert.deepStrictEqual(Chunk.toReadonlyArray(parts), [
        ["foo", "bar"],
        ["test", "ing"],
        ["foo.txt", "A".repeat(1024 * 1024)]
      ])
    }).pipe(Effect.runPromise))
})
