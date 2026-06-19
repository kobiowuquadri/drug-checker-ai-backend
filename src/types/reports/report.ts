import { BaseResponse } from "../users/auth.js";
import { InteractionResult, SelectedDrug } from "../interactions/interaction.js";
import { ReportStatus } from "../../constants/reportStatus.js";

export interface GenerateReportRequest {
  historyId?: number;
  title?: string;
  notes?: string;
  selectedDrugs?: SelectedDrug[];
  interactionResults?: InteractionResult[];
}

export interface UpdateReportRequest {
  title?: string;
  notes?: string | null;
  status?: ReportStatus;
}

export type ReportResponse = BaseResponse;
