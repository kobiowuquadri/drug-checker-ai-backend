import { userRouter } from "./users/index.js"

const baseRoute = '/api/v1'

const router = (app: any) => {
  app.use(`${baseRoute}/users`, userRouter)
}

export default router