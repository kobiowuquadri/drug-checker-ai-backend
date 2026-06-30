import Medication from "../../schemas/medications/medicationSchema.js";
import { medicationSeedData } from "./medicationSeedData.js";

export const seedMedications = async () => {
  // Deduplicate within the seed array itself by rxcui (keep first occurrence)
  const seen = new Set<string>();
  const unique = medicationSeedData.filter((entry) => {
    if (seen.has(entry.rxcui)) return false;
    seen.add(entry.rxcui);
    return true;
  });

  for (const entry of unique) {
    try {
      await Medication.findOrCreate({
        where: { rxcui: entry.rxcui },
        defaults: {
          rxcui: entry.rxcui,
          genericName: entry.genericName,
          aliases: entry.aliases,
        },
      });
    } catch {
      // Skip silently on unique-constraint or other insert errors
    }
  }

  console.log(`Medications seeded: ${unique.length} entries processed.`);
};
