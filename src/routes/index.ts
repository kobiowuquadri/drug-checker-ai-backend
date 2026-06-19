import { userRouter } from "./users/index.js"
import { drugRouter } from "./drugs/index.js"
import { interactionRouter } from "./interactions/index.js"
import { historyRouter } from "./history/index.js"
import { reportRouter } from "./reports/index.js"
import { adminRouter } from "./admin/index.js"

const baseRoute = '/api/v1'

const router = (app: any) => {
  app.use(`${baseRoute}/users`, userRouter)
  app.use(`${baseRoute}/drugs`, drugRouter)
  app.use(`${baseRoute}/interactions`, interactionRouter)
  app.use(`${baseRoute}/history`, historyRouter)
  app.use(`${baseRoute}/reports`, reportRouter)
  app.use(`${baseRoute}/admin`, adminRouter)
}

export default router
