import axios from "axios";

export interface OcrResult {
  text: string;
  source: "google-vision" | "google-vision-error" | "none";
  error?: string;
}

const GOOGLE_VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";

const getGoogleVisionApiKey = () =>
  process.env.GOOGLE_CLOUD_VISION_API_KEY ||
  process.env.GOOGLE_VISION_API_KEY ||
  process.env.GOOGLE_CLOUD_VISON_API_KEY;

const getGoogleVisionErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const googleMessage = error.response?.data?.error?.message;
    if (googleMessage) return String(googleMessage);
    if (error.code) return error.code;
    if (error.message) return error.message;
  }

  return "Google Vision OCR request failed";
};

export const extractMedicationLabelText = async (imageBase64: string): Promise<OcrResult> => {
  const apiKey = getGoogleVisionApiKey();
  if (!apiKey) {
    return {
      text: "",
      source: "none",
      error: "GOOGLE_CLOUD_VISION_API_KEY is not configured",
    };
  }

  try {
    const response = await axios.post(
      GOOGLE_VISION_ENDPOINT,
      {
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
            imageContext: { languageHints: ["en"] },
          },
        ],
      },
      {
        params: { key: apiKey },
        timeout: 12000,
      }
    );

    const firstResponse = response.data?.responses?.[0] || {};
    if (firstResponse.error?.message) {
      return {
        text: "",
        source: "google-vision-error",
        error: String(firstResponse.error.message),
      };
    }

    const text =
      firstResponse.fullTextAnnotation?.text ||
      firstResponse.textAnnotations?.[0]?.description ||
      "";

    return {
      text: String(text || "").trim(),
      source: text ? "google-vision" : "none",
      error: text ? undefined : "Google Vision returned no readable text",
    };
  } catch (error) {
    return {
      text: "",
      source: "google-vision-error",
      error: getGoogleVisionErrorMessage(error),
    };
  }
};
