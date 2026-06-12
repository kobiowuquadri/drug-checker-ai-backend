import { BaseResponse } from "../users/auth.js";

export interface SelectedDrug {
  rxcui: string;
  name: string;
}

export interface InteractionCheckRequest {
  drugs: SelectedDrug[];
}

export interface InteractionResult {
  drugA: SelectedDrug;
  drugB: SelectedDrug;
  verified: boolean;
  severity: string | null;
  effect: string;
  recommendation: string;
  source: string;
  aiExplanation: string | null;
}

export type InteractionResponse = BaseResponse;
