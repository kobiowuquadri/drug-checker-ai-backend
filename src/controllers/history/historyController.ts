import { Request, Response } from "express";
import { createHistoryService, deleteHistoryService, getHistoriesService, getHistoryService } from "../../services/history/historyService.js";
import { CreateHistoryRequest } from "../../types/history/history.js";

export const createHistoryController = async (req: Request<{}, {}, CreateHistoryRequest>, res: Response) => {
  await createHistoryService((req as any).user.id, req.body, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const getHistoriesController = async (req: Request, res: Response) => {
  await getHistoriesService((req as any).user.id, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const getHistoryController = async (req: Request, res: Response) => {
  await getHistoryService((req as any).user.id, Number(req.params.id), (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const deleteHistoryController = async (req: Request, res: Response) => {
  await deleteHistoryService((req as any).user.id, Number(req.params.id), (result) => {
    return res.status(result.statusCode).json(result);
  });
};
