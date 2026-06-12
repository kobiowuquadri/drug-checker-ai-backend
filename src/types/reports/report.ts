import { BaseResponse } from "../users/auth.js";
import { InteractionResult, SelectedDrug } from "../interactions/interaction.js";

export interface GenerateReportRequest {
  title?: string;
  selectedDrugs: SelectedDrug[];
  interactionResults: InteractionResult[];
}

export type ReportResponse = BaseResponse;
