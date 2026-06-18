import { Request, Response } from "express";
import { deleteReportService, generateReportService, getReportService, getReportsService, updateReportService } from "../../services/reports/reportService.js";
import { GenerateReportRequest, UpdateReportRequest } from "../../types/reports/report.js";

export const generateReportController = async (req: Request<{}, {}, GenerateReportRequest>, res: Response) => {
  await generateReportService((req as any).user.id, req.body, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const getReportsController = async (req: Request, res: Response) => {
  await getReportsService((req as any).user.id, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const getReportController = async (req: Request, res: Response) => {
  await getReportService((req as any).user.id, Number(req.params.id), (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const updateReportController = async (req: Request<{ id: string }, {}, UpdateReportRequest>, res: Response) => {
  await updateReportService((req as any).user.id, Number(req.params.id), req.body, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const deleteReportController = async (req: Request, res: Response) => {
  await deleteReportService((req as any).user.id, Number(req.params.id), (result) => {
    return res.status(result.statusCode).json(result);
  });
};
