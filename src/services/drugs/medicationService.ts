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
  { rxcui: "LOCAL-ARTEROLANE", genericName: "Arterolane", aliases: ["Synriam", "Arterolane Maleate", "Arterolane Piperaquine", "Arterolane Piperaquine Phosphate"] },
  { rxcui: "LOCAL-PIPERAQUINE", genericName: "Piperaquine", aliases: ["Synriam", "Piperaquine Phosphate", "Arterolane Piperaquine", "Arterolane Piperaquine Phosphate"] },
  { rxcui: "18346", genericName: "Artesunate", aliases: ["Camosunate", "Arinate", "Artesun", "Larinate", "Combisunate", "P-Alaxin"] },
  { rxcui: "9071", genericName: "Quinine", aliases: ["Quinimax", "Quinine Sulfate"] },
  { rxcui: "10173", genericName: "Sulfadoxine", aliases: ["Fansidar", "Maladox", "Sulfadoxine Pyrimethamine"] },
  { rxcui: "9010", genericName: "Pyrimethamine", aliases: ["Fansidar", "Maladox", "Sulfadoxine Pyrimethamine"] },
  { rxcui: "2382", genericName: "Proguanil", aliases: ["Paludrine"] },
  { rxcui: "5640", genericName: "Ibuprofen", aliases: ["Inbu", "Inbu-400", "Inbu 400", "Ibuprofen 400", "Brufen", "Nurofen", "Advil", "Motrin"] },
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
  { rxcui: "LOCAL-ACECLOFENAC", genericName: "Aceclofenac", aliases: ["Acylor", "Acylor Plus", "Acycor", "Acycor Plus"] },
  { rxcui: "4582", genericName: "Ferrous Sulfate", aliases: ["Feroglobin", "Feroglobin B12", "Iron", "Iron Supplement"] },
  { rxcui: "4614", genericName: "Folic Acid", aliases: ["Feroglobin", "Feroglobin B12", "Folate", "Vitamin B9"] },
  { rxcui: "9878", genericName: "Vitamin B12", aliases: ["Feroglobin", "Feroglobin B12", "Cyanocobalamin"] },
  { rxcui: "LOCAL-ALBENDAZOLE", genericName: "Albendazole", aliases: ["Albenza", "Zentel", "Wormin A", "Noworm", "Bendex"] },
  { rxcui: "LOCAL-MEBENDAZOLE", genericName: "Mebendazole", aliases: ["Vermox", "Wormin", "Ovex", "Mebendol"] },
  { rxcui: "LOCAL-PRAZIQUANTEL", genericName: "Praziquantel", aliases: ["Biltricide", "Prazitel", "Cesol"] },
  { rxcui: "LOCAL-IVERMECTIN", genericName: "Ivermectin", aliases: ["Mectizan", "Stromectol", "Iverjohn"] },
  { rxcui: "LOCAL-ARTESUNATE-AMODIAQUINE", genericName: "Artesunate + Amodiaquine", aliases: ["Camosunate", "Larimal", "Artesam", "Coarsucam", "Winthrop Artesunate Amodiaquine"] },
  { rxcui: "LOCAL-DIHYDROARTEMISININ-PIPERAQUINE", genericName: "Dihydroartemisinin + Piperaquine", aliases: ["P-Alaxin", "Duo-Cotecxin", "Artekin", "Dartepp"] },
  { rxcui: "LOCAL-ARTEMETHER-LUMEFANTRINE", genericName: "Artemether + Lumefantrine", aliases: ["Lumartem", "Lumether", "Gvither", "A-L", "Coatal Forte"] },
  { rxcui: "LOCAL-SULFADOXINE-PYRIMETHAMINE", genericName: "Sulfadoxine + Pyrimethamine", aliases: ["Fansidar", "Maladox", "Suldox", "Swidar"] },
  { rxcui: "LOCAL-AMODIAQUINE", genericName: "Amodiaquine", aliases: ["Camoquin", "Amodiaquine Hydrochloride"] },
  { rxcui: "LOCAL-ARTEMISININ-PIPERAQUINE", genericName: "Artemisinin + Piperaquine", aliases: ["Artequick", "Artequick Plus", "Arte Quick", "mally QUICK"] },
  { rxcui: "LOCAL-AMOXICILLIN-CLAVULANATE", genericName: "Amoxicillin + Clavulanic Acid", aliases: ["Augmentin", "Moxclav", "Clavam", "Klavox", "Curam", "Amoksiklav"] },
  { rxcui: "LOCAL-CEFUROXIME", genericName: "Cefuroxime", aliases: ["Zinnat", "Zinacef", "Cefurox", "Cefuzime", "Xorimax"] },
  { rxcui: "LOCAL-CEFIXIME", genericName: "Cefixime", aliases: ["Cefspan", "Suprax", "Oroken", "Cefix", "Fixime"] },
  { rxcui: "LOCAL-CEFTRIAXONE", genericName: "Ceftriaxone", aliases: ["Rocephin", "Triaxone", "Cefaxone", "Ceftriax"] },
  { rxcui: "LOCAL-CEFPODOXIME", genericName: "Cefpodoxime", aliases: ["Vantin", "Cepodem", "Cefpodox"] },
  { rxcui: "LOCAL-OFLOXACIN", genericName: "Ofloxacin", aliases: ["Tarivid", "Oflovid", "Zanocin", "Oflox"] },
  { rxcui: "LOCAL-NORFLOXACIN", genericName: "Norfloxacin", aliases: ["Noroxin", "Norilet", "Norflox"] },
  { rxcui: "LOCAL-AZITHROMYCIN", genericName: "Azithromycin", aliases: ["Zithromax", "Azi-Once", "Azimax", "Zetro", "Azee"] },
  { rxcui: "LOCAL-TINIDAZOLE", genericName: "Tinidazole", aliases: ["Tindamax", "Fasigyn", "Tiniba"] },
  { rxcui: "LOCAL-SECNIDAZOLE", genericName: "Secnidazole", aliases: ["Secnid", "Secnol", "Flagentyl"] },
  { rxcui: "LOCAL-NYSTATIN", genericName: "Nystatin", aliases: ["Mycostatin", "Nilstat", "Nystan"] },
  { rxcui: "LOCAL-CLOTRIMAZOLE", genericName: "Clotrimazole", aliases: ["Canesten", "Candid", "Clotrim"] },
  { rxcui: "LOCAL-GRISEOFULVIN", genericName: "Griseofulvin", aliases: ["Grisovin", "Fulcin", "Griseovin"] },
  { rxcui: "LOCAL-DICLOFENAC", genericName: "Diclofenac", aliases: ["Voveran", "Olfen", "Diclomol", "Diclogem", "Diclac"] },
  { rxcui: "LOCAL-KETOPROFEN", genericName: "Ketoprofen", aliases: ["Oruvail", "Fastum", "Ketonal", "Profenid"] },
  { rxcui: "LOCAL-ACEBROPHYLLINE", genericName: "Acebrophylline", aliases: ["AB Phylline", "Acebro", "Brophyle"] },
  { rxcui: "LOCAL-CHLORPHENIRAMINE", genericName: "Chlorpheniramine", aliases: ["Piriton", "Chlor-Trimeton", "Histafen"] },
  { rxcui: "LOCAL-BROMHEXINE", genericName: "Bromhexine", aliases: ["Bisolvon", "Bromex", "Mucolyte"] },
  { rxcui: "LOCAL-GUAIFENESIN", genericName: "Guaifenesin", aliases: ["Mucinex", "Benylin Expectorant", "Robitussin Expectorant"] },
  { rxcui: "LOCAL-PARACETAMOL-CAFFEINE", genericName: "Paracetamol + Caffeine", aliases: ["Boska", "Cafenol", "Panadol Extra", "Emzor Paracetamol Extra"] },
  { rxcui: "LOCAL-PARACETAMOL-CHLORPHENIRAMINE-PSEUDOEPHEDRINE", genericName: "Paracetamol + Chlorpheniramine + Pseudoephedrine", aliases: ["Procold", "Sudrex", "Coldcap", "Actifed Cold"] },
  { rxcui: "LOCAL-HYOSCINE-BUTYLBROMIDE", genericName: "Hyoscine Butylbromide", aliases: ["Buscopan", "Hyospan", "Scopinal"] },
  { rxcui: "LOCAL-ALUMINUM-MAGNESIUM-SIMETHICONE", genericName: "Aluminum Hydroxide + Magnesium Hydroxide + Simethicone", aliases: ["Gestid", "Maalox", "Moko Mist Mag", "Mist Mag"] },
  { rxcui: "LOCAL-SODIUM-ALGINATE", genericName: "Sodium Alginate + Sodium Bicarbonate + Calcium Carbonate", aliases: ["Gaviscon", "Gaviscon Advance"] },
  { rxcui: "LOCAL-ORS", genericName: "Oral Rehydration Salts", aliases: ["ORS", "Dioralyte", "ReSoMal", "Electrolade"] },
  { rxcui: "LOCAL-ZINC-SULFATE", genericName: "Zinc Sulfate", aliases: ["Zincomin", "Zincovit", "Zinc Supplement"] },
  { rxcui: "LOCAL-MULTIVITAMIN", genericName: "Multivitamin", aliases: ["Astymin", "Wellman", "Wellwoman", "Pregnacare", "Pharmaton", "Reload"] },
  { rxcui: "LOCAL-IRON-FOLATE-B12", genericName: "Iron + Folic Acid + Vitamin B12", aliases: ["Feroglobin", "Feroglobin B12", "Ferroglobin", "Fesulf"] },
  { rxcui: "LOCAL-METHYLDOPA", genericName: "Methyldopa", aliases: ["Aldomet", "Dopamet", "Methyldopa Mylan"] },
  { rxcui: "LOCAL-INDAPAMIDE", genericName: "Indapamide", aliases: ["Natrilix", "Lozol", "Indapen"] },
  { rxcui: "LOCAL-PERINDOPRIL-INDAPAMIDE", genericName: "Perindopril + Indapamide", aliases: ["Coversyl Plus", "Preterax", "Noliprel"] },
  { rxcui: "LOCAL-AMLODIPINE-VALSARTAN", genericName: "Amlodipine + Valsartan", aliases: ["Exforge", "Valodip", "Amlovas-V"] },
  { rxcui: "LOCAL-VALSARTAN-HCTZ", genericName: "Valsartan + Hydrochlorothiazide", aliases: ["Co-Diovan", "Diovan HCT", "Valzaar-H"] },
  { rxcui: "LOCAL-TELMISARTAN-HCTZ", genericName: "Telmisartan + Hydrochlorothiazide", aliases: ["Micardis Plus", "Telma-H", "Telmikind-H"] },
  { rxcui: "LOCAL-AMLODIPINE-ATORVASTATIN", genericName: "Amlodipine + Atorvastatin", aliases: ["Caduet", "Amlostat", "Avas-AM"] },
  { rxcui: "LOCAL-GLICLAZIDE", genericName: "Gliclazide", aliases: ["Diamicron", "Gliclazide MR", "Glyloc"] },
  { rxcui: "LOCAL-VILDAGLIPTIN", genericName: "Vildagliptin", aliases: ["Galvus", "Jalra", "Zomelis"] },
  { rxcui: "LOCAL-SITAGLIPTIN-METFORMIN", genericName: "Sitagliptin + Metformin", aliases: ["Janumet", "Velmetia", "Sita-Met"] },
  { rxcui: "LOCAL-VILDAGLIPTIN-METFORMIN", genericName: "Vildagliptin + Metformin", aliases: ["Galvus Met", "Eucreas", "Vilda-Met"] },
  { rxcui: "LOCAL-INSULIN-ISOPHANE", genericName: "Insulin Isophane", aliases: ["Insulatard", "Humulin N", "Novolin N"] },
  { rxcui: "LOCAL-BIPHASIC-INSULIN", genericName: "Biphasic Insulin Aspart", aliases: ["Mixtard", "NovoMix", "Humulin 70/30"] },
  { rxcui: "LOCAL-LEVONORGESTREL-ETHINYLESTRADIOL", genericName: "Levonorgestrel + Ethinylestradiol", aliases: ["Microgynon", "Postinor-2", "Postpill", "Levonelle"] },
  { rxcui: "LOCAL-MISOPROSTOL", genericName: "Misoprostol", aliases: ["Cytotec", "MisoFem", "Misoclear"] },
  { rxcui: "LOCAL-TRANEXAMIC-ACID", genericName: "Tranexamic Acid", aliases: ["Cyklokapron", "Transamin", "Trapic"] },
  { rxcui: "LOCAL-METOCLOPRAMIDE", genericName: "Metoclopramide", aliases: ["Maxolon", "Reglan", "Plasil"] },
  { rxcui: "LOCAL-PROMETHAZINE", genericName: "Promethazine", aliases: ["Phenergan", "Avomine", "Prometh"] },
  { rxcui: "LOCAL-BETAMETHASONE-CLOTRIMAZOLE-GENTAMICIN", genericName: "Betamethasone + Clotrimazole + Gentamicin", aliases: ["Skineal", "Funbact-A", "Candiderm"] },
  { rxcui: "LOCAL-MUPIROCIN", genericName: "Mupirocin", aliases: ["Bactroban", "T-Bact", "Supirocin"] },
  { rxcui: "LOCAL-ACICLOVIR-CREAM", genericName: "Acyclovir", aliases: ["Acyclovir Cream", "Zovirax Cream", "Aciclovir"] },
  { rxcui: "LOCAL-LIDOCAINE", genericName: "Lidocaine", aliases: ["Xylocaine", "Lignocaine", "Lidoderm"] },
  { rxcui: "LOCAL-POVIDONE-IODINE", genericName: "Povidone-Iodine", aliases: ["Betadine", "Wokadine", "Povidine"] },
  { rxcui: "LOCAL-CHLORHEXIDINE", genericName: "Chlorhexidine", aliases: ["Savlon", "Hibitane", "Corsodyl"] },
  { rxcui: "LOCAL-METHYL-SALICYLATE-MENTHOL", genericName: "Methyl Salicylate + Menthol", aliases: ["Robb", "Deep Heat", "Methylated Balm"] },
  { rxcui: "LOCAL-TETANUS-TOXOID", genericName: "Tetanus Toxoid Vaccine", aliases: ["TT Vaccine", "Tetanus Vaccine"] },
  { rxcui: "LOCAL-MMR", genericName: "Measles + Mumps + Rubella Vaccine", aliases: ["MMR Vaccine", "Priorix", "M-M-R II"] },
  { rxcui: "LOCAL-HEPATITIS-B-VACCINE", genericName: "Hepatitis B Vaccine", aliases: ["Engerix-B", "Euvax-B", "Shanvac-B"] },
  { rxcui: "LOCAL-BCG", genericName: "BCG Vaccine", aliases: ["BCG", "Bacillus Calmette Guerin Vaccine"] },
  { rxcui: "LOCAL-PYRONARIDINE-ARTESUNATE", genericName: "Pyronaridine + Artesunate", aliases: ["Pyramax", "Pymax", "Artecom"] },
  { rxcui: "LOCAL-ARTESUNATE-MEFLOQUINE", genericName: "Artesunate + Mefloquine", aliases: ["Artequin", "ASMQ", "Mefliam Plus"] },
  { rxcui: "LOCAL-MEFLOQUINE", genericName: "Mefloquine", aliases: ["Lariam", "Mefliam", "Mephaquin"] },
  { rxcui: "LOCAL-PRIMAQUINE", genericName: "Primaquine", aliases: ["Primaquine Phosphate", "Primaquin"] },
  { rxcui: "LOCAL-HALOFANTRINE", genericName: "Halofantrine", aliases: ["Halfan", "Halofan", "Haloftrin"] },
  { rxcui: "LOCAL-CLINDAMYCIN-PRIMAQUINE", genericName: "Clindamycin + Primaquine", aliases: ["Clindaquine", "Malaria Rescue Combo"] },
  { rxcui: "LOCAL-CEFACLOR", genericName: "Cefaclor", aliases: ["Ceclor", "Distaclor", "Cefaclor Denk"] },
  { rxcui: "LOCAL-CEFDINIR", genericName: "Cefdinir", aliases: ["Omnicef", "Cefdin", "Cefinir"] },
  { rxcui: "LOCAL-CEFOTAXIME", genericName: "Cefotaxime", aliases: ["Claforan", "Cefotax", "Taxim"] },
  { rxcui: "LOCAL-CEFTAZIDIME", genericName: "Ceftazidime", aliases: ["Fortum", "Tazicef", "Ceftaz"] },
  { rxcui: "LOCAL-CEFEPIME", genericName: "Cefepime", aliases: ["Maxipime", "Cepimax", "Cefep"] },
  { rxcui: "LOCAL-MEROPENEM", genericName: "Meropenem", aliases: ["Meronem", "Mepenem", "Merobax"] },
  { rxcui: "LOCAL-IMIPENEM-CILASTATIN", genericName: "Imipenem + Cilastatin", aliases: ["Tienam", "Primaxin", "Imiclast"] },
  { rxcui: "LOCAL-PIPERACILLIN-TAZOBACTAM", genericName: "Piperacillin + Tazobactam", aliases: ["Tazocin", "Zosyn", "Piptaz"] },
  { rxcui: "LOCAL-GENTAMICIN", genericName: "Gentamicin", aliases: ["Garamycin", "Genticin", "Gentalek"] },
  { rxcui: "LOCAL-AMIKACIN", genericName: "Amikacin", aliases: ["Amikin", "Amikacin Sulfate", "Mikacin"] },
  { rxcui: "LOCAL-FLUOROQUINOLONE-TINIDAZOLE", genericName: "Ciprofloxacin + Tinidazole", aliases: ["Ciprotab-TN", "Cifran CT", "Cipro-TZ"] },
  { rxcui: "LOCAL-OFLOXACIN-ORNIDAZOLE", genericName: "Ofloxacin + Ornidazole", aliases: ["Oflomac OZ", "Zanocin-OZ", "Oflox-OZ"] },
  { rxcui: "LOCAL-ORNIDAZOLE", genericName: "Ornidazole", aliases: ["Ornidyl", "Tiberal", "Orni"] },
  { rxcui: "LOCAL-LINEZOLID", genericName: "Linezolid", aliases: ["Zyvox", "Linospan", "Linzolid"] },
  { rxcui: "LOCAL-RIFAMPICIN", genericName: "Rifampicin", aliases: ["Rifampin", "Rifadin", "R-Cin"] },
  { rxcui: "LOCAL-ISONIAZID", genericName: "Isoniazid", aliases: ["INH", "Nydrazid", "Isonex"] },
  { rxcui: "LOCAL-PYRAZINAMIDE", genericName: "Pyrazinamide", aliases: ["PZA", "Pyrazinamid", "Tebrazid"] },
  { rxcui: "LOCAL-ETHAMBUTOL", genericName: "Ethambutol", aliases: ["Myambutol", "EMB", "Combutol"] },
  { rxcui: "LOCAL-RHZE", genericName: "Rifampicin + Isoniazid + Pyrazinamide + Ethambutol", aliases: ["RHZE", "4FDC", "Akurit-4", "Forecox"] },
  { rxcui: "LOCAL-RH", genericName: "Rifampicin + Isoniazid", aliases: ["RH", "2FDC", "Akurit-2", "Rifinah"] },
  { rxcui: "LOCAL-TENOFOVIR-LAMIVUDINE-DOLUTEGRAVIR", genericName: "Tenofovir + Lamivudine + Dolutegravir", aliases: ["TLD", "Acriptega", "Telado", "Teevir-D"] },
  { rxcui: "LOCAL-TENOFOVIR-LAMIVUDINE-EFAVIRENZ", genericName: "Tenofovir + Lamivudine + Efavirenz", aliases: ["TLE", "Atripla Equivalent", "Tenolam-E"] },
  { rxcui: "LOCAL-TENOFOVIR", genericName: "Tenofovir", aliases: ["Viread", "TDF", "Tenvir"] },
  { rxcui: "LOCAL-LAMIVUDINE", genericName: "Lamivudine", aliases: ["3TC", "Epivir", "Lamivir"] },
  { rxcui: "LOCAL-DOLUTEGRAVIR", genericName: "Dolutegravir", aliases: ["Tivicay", "DTG", "Dovato Component"] },
  { rxcui: "LOCAL-EFAVIRENZ", genericName: "Efavirenz", aliases: ["Sustiva", "Stocrin", "EFV"] },
  { rxcui: "LOCAL-ZIDOVUDINE", genericName: "Zidovudine", aliases: ["AZT", "Retrovir", "ZDV"] },
  { rxcui: "LOCAL-NEVIRAPINE", genericName: "Nevirapine", aliases: ["Viramune", "NVP", "Nevimune"] },
  { rxcui: "LOCAL-LOPINAVIR-RITONAVIR", genericName: "Lopinavir + Ritonavir", aliases: ["Kaletra", "Aluvia", "LPV/r"] },
  { rxcui: "LOCAL-ABACAVIR-LAMIVUDINE", genericName: "Abacavir + Lamivudine", aliases: ["Kivexa", "Epzicom", "ABC-3TC"] },
  { rxcui: "LOCAL-LEVOCETIRIZINE", genericName: "Levocetirizine", aliases: ["Xyzal", "Levocet", "Teczine"] },
  { rxcui: "LOCAL-DESLORATADINE", genericName: "Desloratadine", aliases: ["Aerius", "Clarinex", "Deslor"] },
  { rxcui: "LOCAL-KETOTIFEN", genericName: "Ketotifen", aliases: ["Zaditen", "Alaway", "Ketasma"] },
  { rxcui: "LOCAL-AMBROXOL", genericName: "Ambroxol", aliases: ["Mucosolvan", "Ambrodil", "Mucoangin"] },
  { rxcui: "LOCAL-CARBOCISTEINE", genericName: "Carbocisteine", aliases: ["Mucodyne", "Rhinathiol", "Carbocough"] },
  { rxcui: "LOCAL-PHENYLEPHRINE", genericName: "Phenylephrine", aliases: ["Sudafed PE", "Neo-Synephrine", "Nasop"] },
  { rxcui: "LOCAL-OXYMETAZOLINE", genericName: "Oxymetazoline", aliases: ["Afrin", "Drixine", "Iliadin"] },
  { rxcui: "LOCAL-XYLOMETAZOLINE", genericName: "Xylometazoline", aliases: ["Otrivin", "Xylomet", "Xynosine"] },
  { rxcui: "LOCAL-BECLOMETHASONE", genericName: "Beclomethasone", aliases: ["Beconase", "Qvar", "Clenil"] },
  { rxcui: "LOCAL-FORMOTEROL", genericName: "Formoterol", aliases: ["Foradil", "Oxis", "Atimos"] },
  { rxcui: "LOCAL-BUDESONIDE-FORMOTEROL", genericName: "Budesonide + Formoterol", aliases: ["Symbicort", "Budamate", "Foracort"] },
  { rxcui: "LOCAL-SALMETEROL-FLUTICASONE", genericName: "Salmeterol + Fluticasone", aliases: ["Seretide", "Advair", "AirFluSal"] },
  { rxcui: "LOCAL-ETORICOXIB", genericName: "Etoricoxib", aliases: ["Arcoxia", "Etorix", "Nucoxia"] },
  { rxcui: "LOCAL-LORNOXICAM", genericName: "Lornoxicam", aliases: ["Xefo", "Lornoxi", "Lorcam"] },
  { rxcui: "LOCAL-NIMESULIDE", genericName: "Nimesulide", aliases: ["Nise", "Nimulid", "Mesulid"] },
  { rxcui: "LOCAL-PENTAZOCINE", genericName: "Pentazocine", aliases: ["Fortwin", "Talwin", "Pentaz"] },
  { rxcui: "LOCAL-NALBUPHINE", genericName: "Nalbuphine", aliases: ["Nubain", "Nalbuphine HCl"] },
  { rxcui: "LOCAL-TAPENTADOL", genericName: "Tapentadol", aliases: ["Palexia", "Nucynta", "Tapal"] },
  { rxcui: "LOCAL-DROTAVERINE", genericName: "Drotaverine", aliases: ["No-Spa", "Drotin", "Doverin"] },
  { rxcui: "LOCAL-MAGNESIUM-TRISILICATE", genericName: "Magnesium Trisilicate", aliases: ["Mag Trisilicate", "Moko Mist Mag", "Antacid Mixture"] },
  { rxcui: "LOCAL-RABEPRAZOLE", genericName: "Rabeprazole", aliases: ["Pariet", "Razo", "Rabecid"] },
  { rxcui: "LOCAL-DEXLANSOPRAZOLE", genericName: "Dexlansoprazole", aliases: ["Dexilant", "Dexilanz", "Kapidex"] },
  { rxcui: "LOCAL-ITOPRIDE", genericName: "Itopride", aliases: ["Ganaton", "Itomed", "Itopra"] },
  { rxcui: "LOCAL-MOSAPRIDE", genericName: "Mosapride", aliases: ["Gasmotin", "Mosid", "Mozax"] },
  { rxcui: "LOCAL-RIFAXIMIN", genericName: "Rifaximin", aliases: ["Xifaxan", "Rifagut", "Rifax"] },
  { rxcui: "LOCAL-DIOSMECTITE", genericName: "Diosmectite", aliases: ["Smecta", "Smectalia"] },
  { rxcui: "LOCAL-LACTOBACILLUS", genericName: "Lactobacillus Probiotic", aliases: ["Enterogermina", "Lacteol", "Protexin"] },
  { rxcui: "LOCAL-TOBRAMYCIN-EYE", genericName: "Tobramycin", aliases: ["Tobrex", "Tobradex", "Tobrin"] },
  { rxcui: "LOCAL-CIPROFLOXACIN-EYE", genericName: "Ciprofloxacin Eye/Ear Drops", aliases: ["Ciloxan", "Ciprocin Eye", "Ciplox-D"] },
  { rxcui: "LOCAL-OFLOXACIN-EYE", genericName: "Ofloxacin Eye/Ear Drops", aliases: ["Ocuflox", "Exocin", "Oflox Eye"] },
  { rxcui: "LOCAL-CHLORAMPHENICOL-EYE", genericName: "Chloramphenicol Eye Drops", aliases: ["Chloramphenicol Eye", "Optrex Infected Eye", "Chloroptic"] },
  { rxcui: "LOCAL-PREDNISOLONE-EYE", genericName: "Prednisolone Eye Drops", aliases: ["Pred Forte", "Predsol", "Prednisolone Acetate Eye"] },
  { rxcui: "LOCAL-TIMOLOL-DORZOLAMIDE", genericName: "Timolol + Dorzolamide", aliases: ["Cosopt", "Dorzox-T", "Dortas-T"] },
  { rxcui: "LOCAL-BRIMONIDINE", genericName: "Brimonidine", aliases: ["Alphagan", "Brimodin", "Brimo"] },
  { rxcui: "LOCAL-TRAVOPROST", genericName: "Travoprost", aliases: ["Travatan", "Travatan Z", "Travoprost Eye"] },
  { rxcui: "LOCAL-FUSIDIC-ACID", genericName: "Fusidic Acid", aliases: ["Fucidin", "Fucibet", "Fusidin"] },
  { rxcui: "LOCAL-SILVER-SULFADIAZINE", genericName: "Silver Sulfadiazine", aliases: ["Flamazine", "Silvadene", "Dermazin"] },
  { rxcui: "LOCAL-HYDROQUINONE", genericName: "Hydroquinone", aliases: ["Eldoquin", "Melalite", "Clear Essence Medicated Fade"] },
  { rxcui: "LOCAL-TRETINOIN", genericName: "Tretinoin", aliases: ["Retin-A", "A-Ret", "Retino-A"] },
  { rxcui: "LOCAL-BENZOYL-PEROXIDE", genericName: "Benzoyl Peroxide", aliases: ["Benzac", "PanOxyl", "Brevoxyl"] },
  { rxcui: "LOCAL-MOMETASONE", genericName: "Mometasone", aliases: ["Elocon", "Nasonex", "Momesone"] },
  { rxcui: "LOCAL-BETAMETHASONE", genericName: "Betamethasone", aliases: ["Betnovate", "Diprosone", "Celestamine"] },
  { rxcui: "LOCAL-CLOTRIMAZOLE-BETAMETHASONE", genericName: "Clotrimazole + Betamethasone", aliases: ["Lotrisone", "Candid-B", "Cloben-G"] },
  { rxcui: "LOCAL-CLOTRIMAZOLE-BECLOMETHASONE-GENTAMICIN", genericName: "Clotrimazole + Beclomethasone + Gentamicin", aliases: ["Quadriderm", "Panderm Plus", "Candid-BG"] },
  { rxcui: "LOCAL-TERBINAFINE", genericName: "Terbinafine", aliases: ["Lamisil", "Terbifin", "Terbicip"] },
  { rxcui: "LOCAL-SERTACONAZOLE", genericName: "Sertaconazole", aliases: ["Onabet", "Sertacide", "Ertaczo"] },
  { rxcui: "LOCAL-CLOMIPHENE", genericName: "Clomifene", aliases: ["Clomid", "Fertomid", "Ovulet"] },
  { rxcui: "LOCAL-LETROZOLE-FERTILITY", genericName: "Letrozole", aliases: ["Femara", "Letoval", "Letroz"] },
  { rxcui: "LOCAL-CABERGOLINE", genericName: "Cabergoline", aliases: ["Dostinex", "Cabgolin", "Caberlin"] },
  { rxcui: "LOCAL-BROMOCRIPTINE", genericName: "Bromocriptine", aliases: ["Parlodel", "Bromergon", "Lactodel"] },
  { rxcui: "LOCAL-OXYTOCIN", genericName: "Oxytocin", aliases: ["Pitocin", "Syntocinon", "Oxytocin Injection"] },
  { rxcui: "LOCAL-ERGOMETRINE", genericName: "Ergometrine", aliases: ["Ergometrine Maleate", "Methergine", "Ergotrate"] },
  { rxcui: "LOCAL-NORETHISTERONE", genericName: "Norethisterone", aliases: ["Primolut N", "Noristerat", "Norlutate"] },
  { rxcui: "LOCAL-DYDROGESTERONE", genericName: "Dydrogesterone", aliases: ["Duphaston", "Dydroboon", "Dydrofem"] },
  { rxcui: "LOCAL-EPINEPHRINE", genericName: "Epinephrine", aliases: ["Adrenaline", "EpiPen", "Adrenaline Injection"] },
  { rxcui: "LOCAL-ATROPINE", genericName: "Atropine", aliases: ["Atropen", "Atropine Sulfate", "Atropine Injection"] },
  { rxcui: "LOCAL-DOPAMINE", genericName: "Dopamine", aliases: ["Intropin", "Dopamine Injection", "Dopacard"] },
  { rxcui: "LOCAL-DOBUTAMINE", genericName: "Dobutamine", aliases: ["Dobutrex", "Dobutamine Injection"] },
  { rxcui: "LOCAL-NOREPINEPHRINE", genericName: "Norepinephrine", aliases: ["Noradrenaline", "Levophed", "Norepinephrine Injection"] },
  { rxcui: "LOCAL-DEXTROSE", genericName: "Dextrose", aliases: ["Glucose Infusion", "D5W", "D50", "Dextrose Injection"] },
  { rxcui: "LOCAL-NORMAL-SALINE", genericName: "Sodium Chloride Infusion", aliases: ["Normal Saline", "NS Infusion", "0.9% Saline"] },
  { rxcui: "LOCAL-RINGERS-LACTATE", genericName: "Ringer's Lactate", aliases: ["Lactated Ringer's", "Hartmann's Solution", "RL Infusion"] },
  { rxcui: "LOCAL-MANNITOL", genericName: "Mannitol", aliases: ["Osmitrol", "Mannitol Infusion"] },
  { rxcui: "LOCAL-SODIUM-BICARBONATE", genericName: "Sodium Bicarbonate", aliases: ["Bicarbonate Injection", "NaHCO3", "Bicarb"] },
  { rxcui: "LOCAL-CALCIUM-GLUCONATE", genericName: "Calcium Gluconate", aliases: ["Calcium Gluconate Injection", "Calglucon"] },
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
  if (q.length < 4) return 0;
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
