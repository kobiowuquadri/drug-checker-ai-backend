import { Request, Response } from "express";
import { getDrugDetailsService, searchDrugsService } from "../../services/drugs/rxnavService.js";

export const searchDrugsController = async (req: Request, res: Response) => {
  await searchDrugsService(String(req.query.q || ""), (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const getDrugDetailsController = async (req: Request, res: Response) => {
  await getDrugDetailsService(req.params.rxcui, (result) => {
    return res.status(result.statusCode).json(result);
  });
};
