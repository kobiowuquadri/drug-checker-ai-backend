import { Request, Response } from "express";
import { getDrugDetailsService } from "../../services/drugs/rxnavService.js";
import { searchMedicationsService } from "../../services/drugs/medicationService.js";
import { identifyMedicationFromImage } from "../../services/ai/geminiService.js";
import { lookupBarcodeService } from "../../services/drugs/barcodeService.js";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, SUCCESS } from "../../constants/statusCode.js";
import { messageHandler } from "../../utils/index.js";

export const searchDrugsController = async (req: Request, res: Response) => {
  const query = String(req.query.q || "");
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || "20"), 10)));

  await searchMedicationsService(query, page, limit, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const getDrugDetailsController = async (req: Request, res: Response) => {
  await getDrugDetailsService(req.params.rxcui, (result) => {
    return res.status(result.statusCode).json(result);
  });
};

export const barcodeLookupController = async (req: Request, res: Response) => {
  const { barcodeValue } = req.body || {};

  if (!barcodeValue || typeof barcodeValue !== "string") {
    return res.status(BAD_REQUEST).json(
      messageHandler("Barcode value is required.", false, BAD_REQUEST, {})
    );
  }

  try {
    const result = await lookupBarcodeService(barcodeValue.trim());
    return res.status(SUCCESS).json(
      messageHandler("Barcode lookup completed.", true, SUCCESS, result)
    );
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json(
      messageHandler("Barcode lookup failed.", false, INTERNAL_SERVER_ERROR, error)
    );
  }
};

export const scanMedicationController = async (req: Request, res: Response) => {
  const { image, mimeType } = req.body || {};

  if (!image || typeof image !== "string") {
    return res.status(BAD_REQUEST).json(
      messageHandler("Image data is required.", false, BAD_REQUEST, {})
    );
  }

  try {
    const scanResult = await identifyMedicationFromImage(image, mimeType || "image/jpeg");
    return res.status(SUCCESS).json(
      messageHandler("Scan completed.", true, SUCCESS, scanResult)
    );
  } catch (error) {
    return res.status(INTERNAL_SERVER_ERROR).json(
      messageHandler("Failed to process image.", false, INTERNAL_SERVER_ERROR, error)
    );
  }
};
