import Report from "../../schemas/reports/reportSchema.js";
import { GenerateReportRequest, ReportResponse } from "../../types/reports/report.js";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, SUCCESS } from "../../constants/statusCode.js";
import { messageHandler } from "../../utils/index.js";
import { Severity } from "../../constants/severity.js";

const buildSeveritySummary = (interactionResults: any[]) => {
  const summary = {
    [Severity.LOW]: 0,
    [Severity.MODERATE]: 0,
    [Severity.HIGH]: 0,
  };

  interactionResults.forEach((result) => {
    if (result?.verified && result?.severity && result.severity in summary) {
      summary[result.severity as Severity] += 1;
    }
  });

  return summary;
};

export const generateReportService = async (
  userId: number,
  data: GenerateReportRequest,
  callback: (data: ReportResponse) => void
) => {
  try {
    if (!data.selectedDrugs || data.selectedDrugs.length < 2 || data.selectedDrugs.length > 5) {
      return callback(messageHandler("Selected drugs must contain 2 to 5 drugs", false, BAD_REQUEST, {}));
    }

    const report = await Report.create({
      userId,
      title: data.title || "Drug Interaction Report",
      selectedDrugs: data.selectedDrugs,
      interactionResults: data.interactionResults || [],
      severitySummary: buildSeveritySummary(data.interactionResults || []),
    });

    return callback(messageHandler("Report generated successfully", true, SUCCESS, report));
  } catch (error) {
    return callback(messageHandler("An error occured while generating report.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getReportsService = async (userId: number, callback: (data: ReportResponse) => void) => {
  try {
    const reports = await Report.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    return callback(messageHandler("Reports fetched successfully", true, SUCCESS, reports));
  } catch (error) {
    return callback(messageHandler("An error occured while fetching reports.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getReportService = async (userId: number, reportId: number, callback: (data: ReportResponse) => void) => {
  try {
    const report = await Report.findOne({ where: { id: reportId, userId } });
    if (!report) {
      return callback(messageHandler("Report not found", false, NOT_FOUND, {}));
    }

    return callback(messageHandler("Report fetched successfully", true, SUCCESS, report));
  } catch (error) {
    return callback(messageHandler("An error occured while fetching report.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const deleteReportService = async (userId: number, reportId: number, callback: (data: ReportResponse) => void) => {
  try {
    const report = await Report.findOne({ where: { id: reportId, userId } });
    if (!report) {
      return callback(messageHandler("Report not found", false, NOT_FOUND, {}));
    }

    await report.destroy();

    return callback(messageHandler("Report deleted successfully", true, SUCCESS, {}));
  } catch (error) {
    return callback(messageHandler("An error occured while deleting report.", false, INTERNAL_SERVER_ERROR, error));
  }
};
