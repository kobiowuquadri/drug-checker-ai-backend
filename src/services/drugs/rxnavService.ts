import axios from "axios";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, SUCCESS } from "../../constants/statusCode.js";
import { messageHandler } from "../../utils/index.js";
import { DrugResponse } from "../../types/drugs/drug.js";
import { SelectedDrug } from "../../types/interactions/interaction.js";

const getRxNavBaseUrl = () => process.env.RXNAV_BASE_URL || "https://rxnav.nlm.nih.gov/REST";

const cleanText = (value: any) => String(value || "").trim();

const transformDrugSearchResponse = (data: any) => {
  const conceptGroups = data?.drugGroup?.conceptGroup || [];
  const concepts = conceptGroups.flatMap((group: any) => group?.conceptProperties || []);
  const uniqueDrugs = new Map<string, any>();

  concepts.forEach((concept: any) => {
    const rxcui = cleanText(concept.rxcui);
    if (!rxcui || uniqueDrugs.has(rxcui)) {
      return;
    }

    uniqueDrugs.set(rxcui, {
      rxcui,
      name: cleanText(concept.name),
      synonym: cleanText(concept.synonym),
      tty: cleanText(concept.tty),
      language: cleanText(concept.language),
      suppress: cleanText(concept.suppress),
    });
  });

  return Array.from(uniqueDrugs.values());
};

const transformDrugDetailsResponse = (data: any) => {
  const properties = data?.properties || {};

  return {
    rxcui: cleanText(properties.rxcui),
    name: cleanText(properties.name),
    synonym: cleanText(properties.synonym),
    tty: cleanText(properties.tty),
    language: cleanText(properties.language),
    suppress: cleanText(properties.suppress),
    umlscui: cleanText(properties.umlscui),
  };
};

const transformRelatedIngredientResponse = (data: any) => {
  const conceptGroups = data?.relatedGroup?.conceptGroup || [];
  const concepts = conceptGroups.flatMap((group: any) => group?.conceptProperties || []);
  const ingredients = new Map<string, SelectedDrug>();

  concepts.forEach((concept: any) => {
    const rxcui = cleanText(concept.rxcui);
    const name = cleanText(concept.name);

    if (!rxcui || !name || ingredients.has(rxcui)) {
      return;
    }

    ingredients.set(rxcui, { rxcui, name });
  });

  return Array.from(ingredients.values());
};

export const searchDrugsService = async (query: string, callback: (data: DrugResponse) => void) => {
  try {
    if (!query || !query.trim()) {
      return callback(messageHandler("Search query is required", false, BAD_REQUEST, {}));
    }

    const response = await axios.get(`${getRxNavBaseUrl()}/drugs.json`, {
      params: { name: query.trim() },
    });

    return callback(messageHandler("Drug search completed successfully", true, SUCCESS, {
      query: query.trim(),
      drugs: transformDrugSearchResponse(response.data),
    }));
  } catch (error) {
    return callback(messageHandler("An error occured while searching drugs.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const getDrugDetailsService = async (rxcui: string, callback: (data: DrugResponse) => void) => {
  try {
    if (!rxcui || !rxcui.trim()) {
      return callback(messageHandler("RXCUI is required", false, BAD_REQUEST, {}));
    }

    const response = await axios.get(`${getRxNavBaseUrl()}/rxcui/${encodeURIComponent(rxcui.trim())}/properties.json`);

    return callback(messageHandler("Drug details fetched successfully", true, SUCCESS, transformDrugDetailsResponse(response.data)));
  } catch (error) {
    return callback(messageHandler("An error occured while fetching drug details.", false, INTERNAL_SERVER_ERROR, error));
  }
};

export const resolveDrugIngredients = async (drug: SelectedDrug) => {
  if (!/^\d+$/.test(drug.rxcui)) {
    return [drug];
  }

  try {
    const response = await axios.get(`${getRxNavBaseUrl()}/rxcui/${encodeURIComponent(drug.rxcui)}/related.json`, {
      params: { tty: "IN+MIN+PIN" },
    });
    const ingredients = transformRelatedIngredientResponse(response.data);

    return ingredients.length ? ingredients : [drug];
  } catch (error) {
    return [drug];
  }
};
