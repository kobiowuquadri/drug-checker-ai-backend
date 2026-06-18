import { Request, Response } from "express";
import { checkInteractionsService } from "../../services/interactions/interactionService.js";
import { InteractionCheckRequest } from "../../types/interactions/interaction.js";

export const checkInteractionsController = async (req: Request<{}, {}, InteractionCheckRequest>, res: Response) => {
  await checkInteractionsService(req.body, (req as any).user?.id, req.cookies?.refreshToken, (result) => {
    return res.status(result.statusCode).json(result);
  });
};
