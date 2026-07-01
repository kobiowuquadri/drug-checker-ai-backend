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

const LOCAL_MEDICATION_PATCHES: Array<Omit<MedRecord, "id">> = [
  { rxcui: "18343", genericName: "Artemether", aliases: ["Coartem", "Lonart", "Amatem", "Lokmal", "Artefan", "Lumartem", "Artemether Lumefantrine"] },
  { rxcui: "847728", genericName: "Lumefantrine", aliases: ["Coartem", "Lonart", "Amatem", "Lokmal", "Artefan", "Lumartem", "Artemether Lumefantrine"] },
  { rxcui: "18346", genericName: "Artesunate", aliases: ["Camosunate", "Arinate", "Artesun", "Larinate", "Combisunate", "P-Alaxin"] },
  { rxcui: "9071", genericName: "Quinine", aliases: ["Quinimax", "Quinine Sulfate"] },
  { rxcui: "10173", genericName: "Sulfadoxine", aliases: ["Fansidar", "Maladox", "Sulfadoxine Pyrimethamine"] },
  { rxcui: "9010", genericName: "Pyrimethamine", aliases: ["Fansidar", "Maladox", "Sulfadoxine Pyrimethamine"] },
  { rxcui: "2382", genericName: "Proguanil", aliases: ["Paludrine"] },
  { rxcui: "161", genericName: "Paracetamol", aliases: ["Emzor Paracetamol", "Panadol", "Calpol", "Emcap"] },
  { rxcui: "723", genericName: "Amoxicillin", aliases: ["Amoxil", "Moxclav", "Clamoxin", "Augmentin"] },
  { rxcui: "733", genericName: "Ampicillin", aliases: ["Ampiclox"] },
  { rxcui: "2625", genericName: "Cloxacillin", aliases: ["Ampiclox", "Cloxapen"] },
  { rxcui: "2582", genericName: "Clindamycin", aliases: ["Dalacin C"] },
  { rxcui: "6922", genericName: "Metronidazole", aliases: ["Flagyl", "Emgyl", "Metro"] },
  { rxcui: "10829", genericName: "Trimethoprim-Sulfamethoxazole", aliases: ["Septrin", "Cotrimoxazole", "Co-trimoxazole"] },
  { rxcui: "2551", genericName: "Ciprofloxacin", aliases: ["Ciprotab", "Ciproxin", "Cipro"] },
  { rxcui: "17767", genericName: "Amlodipine", aliases: ["Amlovar", "Amlodis", "Norvasc"] },
  { rxcui: "6809", genericName: "Metformin", aliases: ["Glucophage", "Diabetmin", "Glycomet"] },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const uniqueAliases = (aliases: string[]) => {
  const seen = new Set<string>();
  return aliases
    .map((alias) => alias.trim())
    .filter((alias) => {
      if (!alias) return false;
      const key = normalize(alias);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

function applyLocalMedicationPatches(records: MedRecord[]): MedRecord[] {
  const byRxcui = new Map(records.map((record) => [record.rxcui, { ...record, aliases: [...record.aliases] }]));
  let fallbackId = 8_000_000;

  LOCAL_MEDICATION_PATCHES.forEach((patch) => {
    const existing = byRxcui.get(patch.rxcui);
    if (existing) {
      existing.aliases = uniqueAliases([...existing.aliases, ...patch.aliases]);
      if (existing.genericName.length > patch.genericName.length) existing.genericName = patch.genericName;
      return;
    }

    byRxcui.set(patch.rxcui, {
      id: fallbackId++,
      rxcui: patch.rxcui,
      genericName: patch.genericName,
      aliases: uniqueAliases(patch.aliases),
    });
  });

  return Array.from(byRxcui.values()).sort((a, b) => a.genericName.localeCompare(b.genericName));
}

// In-memory cache — loaded once, reused on every keystroke
let cache: MedRecord[] | null = null;

async function loadCache(): Promise<MedRecord[]> {
  if (cache) return cache;
  try {
    const rows = await Medication.findAll({ order: [["genericName", "ASC"]] });
    cache = applyLocalMedicationPatches(
      rows.map((m) => ({ id: m.id, rxcui: m.rxcui, genericName: m.genericName, aliases: m.aliases }))
    );
  } catch {
    // DB unreachable — serve from bundled seed data so searches never fail
    cache = applyLocalMedicationPatches(
      medicationSeedData.map((m, i) => ({ id: i + 1, rxcui: m.rxcui, genericName: m.genericName, aliases: m.aliases }))
    );
  }
  return cache;
}

function scoreMatch(med: MedRecord, q: string): number {
  const name = normalize(med.genericName);
  const aliases = med.aliases.map(normalize);
  if (name === q) return 100;
  if (aliases.some((alias) => alias === q)) return 95;
  if (name.startsWith(q)) return 80;
  if (aliases.some((alias) => alias.startsWith(q))) return 75;
  if (name.includes(q)) return 50;
  if (aliases.some((alias) => alias.includes(q))) return 45;
  const tokens = q.split(" ").filter(Boolean);
  if (tokens.length > 1 && tokens.every((token) => name.includes(token))) return 35;
  if (tokens.length > 1 && aliases.some((alias) => tokens.every((token) => alias.includes(token)))) return 30;
  return 0;
}

function matchesMedication(med: MedRecord, q: string): boolean {
  return scoreMatch(med, q) > 0;
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

    const q = normalize(query.trim());
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
