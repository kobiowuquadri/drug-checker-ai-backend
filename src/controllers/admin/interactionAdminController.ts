import { Request, Response } from "express";
import {
  createInteractionRecordService,
  deleteInteractionRecordService,
  getInteractionRecordService,
  getInteractionRecordsService,
  updateInteractionRecordService,
} from "../../services/admin/interactionAdminService.js";
import { DrugInteractionCreationAttributes } from "../../schemas/interactions/drugInteractionSchema.js";

export const createInteractionRecordController = async (
  req: Request<{}, {}, DrugInteractionCreationAttributes>,
  res: Response
) => {
  await createInteractionRecordService(req.body, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const getInteractionRecordsController = async (req: Request, res: Response) => {
  await getInteractionRecordsService((result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const getInteractionRecordController = async (req: Request, res: Response) => {
  await getInteractionRecordService(Number(req.params.id), (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const updateInteractionRecordController = async (
  req: Request<{ id: string }, {}, Partial<DrugInteractionCreationAttributes>>,
  res: Response
) => {
  await updateInteractionRecordService(Number(req.params.id), req.body, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const deleteInteractionRecordController = async (req: Request, res: Response) => {
  await deleteInteractionRecordService(Number(req.params.id), (result) => {
    return res.status(result.statusCode).json(result);
  });
};
