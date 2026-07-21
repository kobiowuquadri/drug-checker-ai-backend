import axios from "axios";
import { identifyMedicationByBarcode } from "../ai/geminiService.js";

interface BarcodeResult {
  medicationName: string | null;
  genericName: string | null;
  rxcui: string | null;
  source: string;
}

const TIMEOUT = 6000;

// NDC can appear inside EAN-13 / UPC-A barcodes
function ndcVariants(raw: string): string[] {
  const digits = raw.replace(/\D/g, "");
  const variants = new Set<string>([raw, digits]);

  // EAN-13: strip leading 0 → 12-digit UPC → strip last check digit → 11-digit NDC
  if (digits.length === 13 && digits.startsWith("0")) variants.add(digits.slice(1));
  if (digits.length === 12) variants.add(digits.slice(0, 11)); // UPC → NDC area
  if (digits.length === 11) variants.add(digits); // bare NDC

  return [...variants];
}

async function openFDALookup(raw: string): Promise<BarcodeResult | null> {
  for (const ndc of ndcVariants(raw)) {
    try {
      const { data } = await axios.get("https://api.fda.gov/drug/ndc.json", {
        params: { search: `package_ndc:"${ndc}"`, limit: 1 },
        timeout: TIMEOUT,
      });
      const result = data?.results?.[0];
      if (!result) continue;

      const genericName = result.generic_name ?? null;
      const brandName = result.brand_name ?? null;
      const medicationName = genericName || brandName;
      if (!medicationName) continue;

      return { medicationName, genericName, rxcui: null, source: "OpenFDA" };
    } catch {}
  }
  return null;
}

async function rxNavLookup(raw: string): Promise<BarcodeResult | null> {
  const base = process.env.RXNAV_BASE_URL || "https://rxnav.nlm.nih.gov/REST";

  for (const ndc of ndcVariants(raw)) {
    try {
      const { data: idData } = await axios.get(`${base}/rxcui.json`, {
        params: { idtype: "NDC", id: ndc },
        timeout: TIMEOUT,
      });
      const rxcui = idData?.idGroup?.rxnormId?.[0];
      if (!rxcui) continue;

      const { data: propData } = await axios.get(`${base}/rxcui/${rxcui}/properties.json`, {
        timeout: TIMEOUT,
      });
      const name = propData?.properties?.name;
      if (!name) continue;

      return { medicationName: name, genericName: name, rxcui, source: "RxNorm" };
    } catch {}
  }
  return null;
}

async function upcItemDbLookup(raw: string): Promise<BarcodeResult | null> {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  try {
    const { data } = await axios.get("https://api.upcitemdb.com/prod/trial/lookup", {
      params: { upc: digits },
      timeout: TIMEOUT,
    });
    const item = data?.items?.[0];
    const title = String(item?.title || "").trim();
    if (!title) return null;

    return {
      medicationName: title,
      genericName: null,
      rxcui: null,
      source: "UPCitemdb",
    };
  } catch {
    return null;
  }
}

export async function lookupBarcodeService(barcodeValue: string): Promise<BarcodeResult> {
  const [fdaResult, rxNavResult, upcResult] = await Promise.allSettled([
    openFDALookup(barcodeValue),
    rxNavLookup(barcodeValue),
    upcItemDbLookup(barcodeValue),
  ]);

  const fda = fdaResult.status === "fulfilled" ? fdaResult.value : null;
  const rxnav = rxNavResult.status === "fulfilled" ? rxNavResult.value : null;
  const upc = upcResult.status === "fulfilled" ? upcResult.value : null;

  if (fda || rxnav || upc) return fda ?? rxnav ?? upc!;

  // Neither US database has this barcode (common for non-US products).
  // Try Gemini as a last resort — it may recognise common international barcodes.
  const gemini = await identifyMedicationByBarcode(barcodeValue);
  if (gemini.medicationName || gemini.genericName) {
    return {
      medicationName: gemini.medicationName,
      genericName: gemini.genericName,
      rxcui: null,
      source: "AI (Gemini)",
    };
  }

  return { medicationName: null, genericName: null, rxcui: null, source: "none" };
}
