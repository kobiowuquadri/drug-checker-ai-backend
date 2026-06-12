import { BaseResponse } from "../users/auth.js";
import { InteractionResult, SelectedDrug } from "../interactions/interaction.js";

export interface CreateHistoryRequest {
  selectedDrugs: SelectedDrug[];
  results: InteractionResult[];
}

export type HistoryResponse = BaseResponse;
