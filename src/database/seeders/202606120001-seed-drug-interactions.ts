import { QueryInterface } from "sequelize";
import { Severity } from "../../constants/severity.js";

const now = new Date();

export const up = async (queryInterface: QueryInterface) => {
  await queryInterface.bulkInsert("drug_interactions", [
    {
      drugAName: "Ibuprofen",
      drugBName: "Aspirin",
      drugARxcui: "5640",
      drugBRxcui: "1191",
      severity: Severity.MODERATE,
      effect: "Combined use may increase the risk of gastrointestinal bleeding and may reduce aspirin's antiplatelet effect when taken at the same time.",
      recommendation: "Avoid routine combined use unless advised by a clinician. If both are needed, ask a clinician or pharmacist about timing and bleeding risk.",
      source: "Local verified seed data",
      createdAt: now,
      updatedAt: now,
    },
    {
      drugAName: "Warfarin",
      drugBName: "Aspirin",
      drugARxcui: "11289",
      drugBRxcui: "1191",
      severity: Severity.HIGH,
      effect: "Combined use may significantly increase bleeding risk.",
      recommendation: "Use together only under direct medical supervision with monitoring for bleeding and anticoagulation status.",
      source: "Local verified seed data",
      createdAt: now,
      updatedAt: now,
    },
    {
      drugAName: "Metformin",
      drugBName: "Alcohol",
      drugARxcui: "6809",
      drugBRxcui: "448",
      severity: Severity.MODERATE,
      effect: "Alcohol may increase the risk of metformin-associated lactic acidosis and can affect blood glucose control.",
      recommendation: "Limit alcohol and seek clinician guidance, especially with heavy drinking, liver disease, kidney disease, or acute illness.",
      source: "Local verified seed data",
      createdAt: now,
      updatedAt: now,
    },
    {
      drugAName: "Lisinopril",
      drugBName: "Potassium Supplement",
      drugARxcui: "29046",
      drugBRxcui: "8591",
      severity: Severity.HIGH,
      effect: "Combined use may raise potassium levels and increase the risk of hyperkalemia.",
      recommendation: "Use together only with clinician guidance and potassium monitoring.",
      source: "Local verified seed data",
      createdAt: now,
      updatedAt: now,
    },
    {
      drugAName: "Simvastatin",
      drugBName: "Clarithromycin",
      drugARxcui: "36567",
      drugBRxcui: "21212",
      severity: Severity.HIGH,
      effect: "Clarithromycin may increase simvastatin exposure and raise the risk of muscle toxicity, including rhabdomyolysis.",
      recommendation: "Avoid combining. A clinician may pause simvastatin or choose an alternative antibiotic.",
      source: "Local verified seed data",
      createdAt: now,
      updatedAt: now,
    },
    {
      drugAName: "Amoxicillin",
      drugBName: "Methotrexate",
      drugARxcui: "723",
      drugBRxcui: "6851",
      severity: Severity.MODERATE,
      effect: "Amoxicillin may reduce methotrexate clearance and increase methotrexate toxicity risk.",
      recommendation: "Use with clinician guidance and monitor for methotrexate toxicity symptoms or lab abnormalities.",
      source: "Local verified seed data",
      createdAt: now,
      updatedAt: now,
    },
    {
      drugAName: "Ciprofloxacin",
      drugBName: "Tizanidine",
      drugARxcui: "2551",
      drugBRxcui: "57258",
      severity: Severity.HIGH,
      effect: "Ciprofloxacin can greatly increase tizanidine exposure, which may cause severe hypotension, sedation, or psychomotor impairment.",
      recommendation: "Avoid combining these medications. Contact a clinician for an alternative therapy.",
      source: "Local verified seed data",
      createdAt: now,
      updatedAt: now,
    },
  ]);
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.bulkDelete("drug_interactions", {});
};
