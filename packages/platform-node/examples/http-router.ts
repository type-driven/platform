import * as Http from "@effect/platform-node/HttpServer"
import * as NodeContext from "@effect/platform-node/NodeContext"
import { runMain } from "@effect/platform-node/Runtime"
import * as Schema from "@effect/schema/Schema"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { createServer } from "node:http"

const ServerLive = Http.server.layer(() => createServer(), { port: 3000 })

const serve = Http.router.empty.pipe(
  Http.router.get(
    "/",
    Effect.map(
      Http.request.ServerRequest,
      (req) => Http.response.text(req.url)
    )
  ),
  Http.router.get(
    "/healthz",
    Http.response.text("ok").pipe(
      Http.middleware.withLoggerDisabled
    )
  ),
  Http.router.post(
    "/upload",
    Effect.gen(function*(_) {
      const data = yield* _(Http.request.schemaFormData(Schema.struct({
        files: Http.formData.filesSchema
      })))
      console.log("got files", data.files)
      return Http.response.empty()
    })
  ),
  Http.server.serve(Http.middleware.logger)
)

const HttpLive = Layer.scopedDiscard(serve).pipe(
  Layer.provide(ServerLive),
  Layer.provide(NodeContext.layer)
)

Layer.launch(HttpLive).pipe(
  runMain
)
