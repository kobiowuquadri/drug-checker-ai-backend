import { BaseResponse } from "../users/auth.js";

export interface DrugSearchQuery {
  q?: string;
}

export type DrugResponse = BaseResponse;
