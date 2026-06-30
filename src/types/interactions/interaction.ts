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
  matchedDrugA?: SelectedDrug;
  matchedDrugB?: SelectedDrug;
  verified: boolean;
  isAiAssessed?: boolean;
  severity: string | null;
  effect: string;
  recommendation: string;
  source: string;
  aiExplanation: string | null;
}

export interface DuplicateTherapyWarning {
  ingredient: SelectedDrug;
  drugs: SelectedDrug[];
  severity: "LOW" | "MODERATE" | "HIGH";
  effect: string;
  recommendation: string;
  source: string;
}

export interface SafetySummary {
  totalSelectedDrugs: number;
  totalPairsChecked: number;
  verifiedInteractions: number;
  unverifiedPairs: number;
  duplicateTherapies: number;
  severitySummary: {
    LOW: number;
    MODERATE: number;
    HIGH: number;
  };
  highestSeverity: "LOW" | "MODERATE" | "HIGH" | null;
  actionMessage: string;
}

export type InteractionResponse = BaseResponse;
