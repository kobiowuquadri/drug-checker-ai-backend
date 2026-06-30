import axios from "axios";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, SUCCESS } from "../../constants/statusCode.js";
import { messageHandler } from "../../utils/index.js";
import { DrugResponse } from "../../types/drugs/drug.js";
import Medication from "../../schemas/medications/medicationSchema.js";
import { medicationSeedData } from "../../database/seeders/medicationSeedData.js";

interface MedicationResult {
  id: number;
  rxcui: string;
  name: string;
  aliases: string[];
}

type MedRecord = { id: number; rxcui: string; genericName: string; aliases: string[] };

// In-memory cache — loaded once, reused on every keystroke
let cache: MedRecord[] | null = null;

async function loadCache(): Promise<MedRecord[]> {
  if (cache) return cache;
  try {
    const rows = await Medication.findAll({ order: [["genericName", "ASC"]] });
    cache = rows.map((m) => ({ id: m.id, rxcui: m.rxcui, genericName: m.genericName, aliases: m.aliases }));
  } catch {
    // DB unreachable — serve from bundled seed data so searches never fail
    cache = medicationSeedData
      .map((m, i) => ({ id: i + 1, rxcui: m.rxcui, genericName: m.genericName, aliases: m.aliases }))
      .sort((a, b) => a.genericName.localeCompare(b.genericName));
  }
  return cache;
}

function scoreMatch(med: MedRecord, q: string): number {
  const name = med.genericName.toLowerCase();
  if (name === q) return 3;
  if (name.startsWith(q)) return 2;
  if (name.includes(q)) return 1;
  const aliasExact = med.aliases.some((a) => a.toLowerCase() === q);
  if (aliasExact) return 1;
  return 0;
}

function matchesMedication(med: MedRecord, q: string): boolean {
  if (med.genericName.toLowerCase().includes(q)) return true;
  return med.aliases.some((alias) => alias.toLowerCase().includes(q));
}

function toResult(med: MedRecord): MedicationResult {
  return {
    id: med.id,
    rxcui: med.rxcui,
    name: med.genericName,
    aliases: med.aliases,
  };
}

export const searchMedicationsService = async (
  query: string,
  page: number,
  limit: number,
  callback: (data: DrugResponse) => void
) => {
  try {
    if (!query || !query.trim()) {
      return callback(messageHandler("Search query is required", false, BAD_REQUEST, {}));
    }

    const q = query.trim().toLowerCase();
    const medications = await loadCache();

    const localMatched = medications
      .filter((med) => matchesMedication(med, q))
      .sort((a, b) => {
        const diff = scoreMatch(b, q) - scoreMatch(a, q);
        if (diff !== 0) return diff;
        return a.genericName.localeCompare(b.genericName);
      });

    // When local results are sparse, augment with the full RxNorm drug database via RxNav
    let combined = localMatched;
    if (localMatched.length < 4) {
      const rxNavResults = await searchRxNav(query.trim());
      const localIds = new Set(localMatched.map((m) => m.rxcui));
      const extra = rxNavResults.filter((r) => !localIds.has(r.rxcui));
      combined = [...localMatched, ...extra];
    }

    const offset = (page - 1) * limit;
    const paginated = combined.slice(offset, offset + limit);

    return callback(
      messageHandler("Drug search completed successfully", true, SUCCESS, {
        query: query.trim(),
        total: combined.length,
        page,
        limit,
        drugs: paginated.map(toResult),
      })
    );
  } catch (error) {
    return callback(
      messageHandler("An error occurred while searching medications.", false, INTERNAL_SERVER_ERROR, error)
    );
  }
};

/** Search RxNav /drugs.json for drugs not in the local seed */
const rxNavCache = new Map<string, MedRecord[]>();

async function searchRxNav(term: string): Promise<MedRecord[]> {
  const key = term.toLowerCase();
  if (rxNavCache.has(key)) return rxNavCache.get(key)!;

  try {
    const baseUrl = process.env.RXNAV_BASE_URL || "https://rxnav.nlm.nih.gov/REST";
    const { data } = await axios.get(`${baseUrl}/drugs.json`, {
      params: { name: term },
      timeout: 6000,
    });

    const conceptGroups: any[] = data?.drugGroup?.conceptGroup || [];
    const results: MedRecord[] = [];
    let id = 9_000_000;

    for (const group of conceptGroups) {
      for (const c of group?.conceptProperties || []) {
        const rxcui = String(c.rxcui || "").trim();
        const name = String(c.name || "").trim();
        if (rxcui && name) {
          results.push({
            id: id++,
            rxcui,
            genericName: name,
            aliases: c.synonym ? [String(c.synonym).trim()] : [],
          });
        }
      }
    }

    rxNavCache.set(key, results);
    return results;
  } catch {
    return [];
  }
}

/** Clear the in-memory cache — useful if medications table is updated at runtime */
export const clearMedicationCache = () => {
  cache = null;
};
