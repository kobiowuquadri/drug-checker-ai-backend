import { userRouter } from "./users/index.js"
import { drugRouter } from "./drugs/index.js"
import { interactionRouter } from "./interactions/index.js"
import { historyRouter } from "./history/index.js"
import { reportRouter } from "./reports/index.js"

const baseRoute = '/api/v1'
const requestedBaseRoute = '/api'

const router = (app: any) => {
  app.use(`${baseRoute}/users`, userRouter)
  app.use(`${baseRoute}/drugs`, drugRouter)
  app.use(`${baseRoute}/interactions`, interactionRouter)
  app.use(`${baseRoute}/history`, historyRouter)
  app.use(`${baseRoute}/reports`, reportRouter)

  app.use(`${requestedBaseRoute}/users`, userRouter)
  app.use(`${requestedBaseRoute}/drugs`, drugRouter)
  app.use(`${requestedBaseRoute}/interactions`, interactionRouter)
  app.use(`${requestedBaseRoute}/history`, historyRouter)
  app.use(`${requestedBaseRoute}/reports`, reportRouter)
}

export default router
