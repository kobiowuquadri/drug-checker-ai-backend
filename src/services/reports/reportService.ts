import Report from "../../schemas/reports/reportSchema.js";
import { GenerateReportRequest, ReportResponse, UpdateReportRequest } from "../../types/reports/report.js";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, SUCCESS } from "../../constants/statusCode.js";
import { messageHandler } from "../../utils/index.js";
import { Severity } from "../../constants/severity.js";
import { ReportStatus } from "../../constants/reportStatus.js";
import InteractionHistory from "../../schemas/history/interactionHistorySchema.js";

const buildSeveritySummary = (interactionResults: any[]) => {
  const summary = {
    [Severity.LOW]: 0,
    [Severity.MODERATE]: 0,
    [Severity.HIGH]: 0,
  };

  interactionResults.forEach((result) => {
    if (result?.severity && result.severity in summary) {
      summary[result.severity as Severity] += 1;
    }
  });

  return summary;
};

const isInvalidId = (id: number) => !Number.isInteger(id) || id < 1;

const slimInteraction = (interaction: any) => ({
  drugA: interaction.drugA,
  drugB: interaction.drugB,
  severity: interaction.severity,
  effect: interaction.effect,
  recommendation: interaction.recommendation,
  source: interaction.source,
  aiExplanation: interaction.aiExplanation,
});

const formatReportListItem = (report: Report) => ({
  id: report.id,
  title: report.title,
  status: report.status,
  notes: report.notes,
  selectedDrugs: report.selectedDrugs,
  severitySummary: report.severitySummary,
  interactionCount: Array.isArray(report.interactionResults) ? report.interactionResults.length : 0,
  pdfUrl: report.pdfUrl,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
});

const formatReportDetail = (report: Report) => ({
  id: report.id,
  title: report.title,
  status: report.status,
  notes: report.notes,
  selectedDrugs: report.selectedDrugs,
  severitySummary: report.severitySummary,
  interactions: Array.isArray(report.interactionResults) ? report.interactionResults.map(slimInteraction) : [],
  pdfUrl: report.pdfUrl,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
});

const extractHistoryReportData = (history: InteractionHistory) => {
  const storedResults: any = history.results || {};
  const rawInteractions = storedResults.interactions || storedResults.results || [];
  const interactions = Array.isArray(rawInteractions)
    ? rawInteractions.filter((interaction: any) => interaction.verified !== false && interaction.severity).map(slimInteraction)
    : [];

  return {
    selectedDrugs: history.selectedDrugs || storedResults.selectedDrugs || [],
    interactionResults: interactions,
    severitySummary: storedResults.safetySummary?.severitySummary || buildSeveritySummary(interactions),
  };
};

const resolveReportSource = async (userId: number, data: GenerateReportRequest) => {
  if (data.historyId) {
    const history = await InteractionHistory.findOne({ where: { id: data.historyId, userId } });

    if (!history) {
      return { error: "Interaction history not found", selectedDrugs: [], interactionResults: [], severitySummary: null };
    }

    return { error: null, ...extractHistoryReportData(history) };
  }

  return {
    error: null,
    selectedDrugs: data.selectedDrugs || [],
    interactionResults: data.interactionResults || [],
    severitySummary: buildSeveritySummary(data.interactionResults || []),
  };
};

export const generateReportService = async (
  userId: number,
  data: GenerateReportRequest,
  callback: (data: ReportResponse) => void
) => {
  try {
    const reportSource = await resolveReportSource(userId, data);

    if (reportSource.error) {
      return callback(messageHandler(reportSource.error, false, NOT_FOUND, {}));
    }

    if (!reportSource.selectedDrugs || reportSource.selectedDrugs.length < 2 || reportSource.selectedDrugs.length > 5) {
      return callback(messageHandler("Selected drugs must contain 2 to 5 drugs", false, BAD_REQUEST, {}));
    }

    const report = await Report.create({
      userId,
      title: data.title || "Drug Interaction Report",
      notes: data.notes || null,
      status: ReportStatus.GENERATED,
      pdfUrl: null,
      selectedDrugs: reportSource.selectedDrugs,
      interactionResults: reportSource.interactionResults || [],
      severitySummary: reportSource.severitySummary || buildSeveritySummary(reportSource.interactionResults || []),
    });

    return callback(messageHandler("Report generated successfully", true, SUCCESS, formatReportDetail(report)));
  } catch (error) {
    return callback(messageHandler("An error occured while generating report.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const updateReportService = async (
  userId: number,
  reportId: number,
  data: UpdateReportRequest,
  callback: (data: ReportResponse) => void
) => {
  try {
    if (isInvalidId(reportId)) {
      return callback(messageHandler("Invalid report id", false, BAD_REQUEST, {}));
    }

    const report = await Report.findOne({ where: { id: reportId, userId } });
    if (!report) {
      return callback(messageHandler("Report not found", false, NOT_FOUND, {}));
    }

    await report.update({
      ...data,
      updatedAt: new Date(),
    });

    return callback(messageHandler("Report updated successfully", true, SUCCESS, formatReportDetail(report)));
  } catch (error) {
    return callback(messageHandler("An error occured while updating report.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getReportsService = async (userId: number, callback: (data: ReportResponse) => void) => {
  try {
    const reports = await Report.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    return callback(messageHandler("Reports fetched successfully", true, SUCCESS, reports.map(formatReportListItem)));
  } catch (error) {
    return callback(messageHandler("An error occured while fetching reports.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getReportService = async (userId: number, reportId: number, callback: (data: ReportResponse) => void) => {
  try {
    if (isInvalidId(reportId)) {
      return callback(messageHandler("Invalid report id", false, BAD_REQUEST, {}));
    }

    const report = await Report.findOne({ where: { id: reportId, userId } });
    if (!report) {
      return callback(messageHandler("Report not found", false, NOT_FOUND, {}));
    }

    return callback(messageHandler("Report fetched successfully", true, SUCCESS, formatReportDetail(report)));
  } catch (error) {
    return callback(messageHandler("An error occured while fetching report.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const deleteReportService = async (userId: number, reportId: number, callback: (data: ReportResponse) => void) => {
  try {
    if (isInvalidId(reportId)) {
      return callback(messageHandler("Invalid report id", false, BAD_REQUEST, {}));
    }

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
