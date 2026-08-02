import { GovernmentScheme, SchemeQuery } from "@/types/scheme";

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export const MOCK_SCHEMES: GovernmentScheme[] = [
  {
    scheme_id: "sch_01",
    scheme_name: "Ayushman Bharat PM-JAY (Pradhan Mantri Jan Arogya Yojana)",
    department: "National Health Authority, Ministry of Health & Family Welfare",
    category: "Central Government",
    coverage_amount: "₹5,00,000 per family per year",
    eligibility:
      "Eligible for BPL families identified in the SECC 2011 database. Includes households living in single-room kucha houses, landless manual casual labor families, and specific occupational categories in urban areas (e.g. ragpickers, domestic workers, street vendors). No cap on family size or age.",
    benefits:
      "Provides secondary and tertiary hospitalization coverage up to ₹5 Lakhs per family annually. Covers pre-hospitalization (up to 3 days) and post-hospitalization (up to 15 days) diagnostics, medicines, ICU care, surgeries, and cash-less treatment across 27,000+ empanelled public and private hospitals.",
    official_url: "https://pmjay.gov.in",
    last_updated: "March 2026",
  },
  {
    scheme_id: "sch_02",
    scheme_name: "Pradhan Mantri Surakshit Matritva Abhiyan (PMSMA)",
    department: "Ministry of Health & Family Welfare",
    category: "Maternal Health",
    coverage_amount: "Free ANC Diagnostics & Nutrition Support",
    eligibility:
      "All pregnant women in their 2nd and 3rd trimesters (between 3rd and 6th months of pregnancy) attending government health facilities across urban and rural areas.",
    benefits:
      "Guarantees free, comprehensive, and quality antenatal care (ANC) services on the 9th of every month. Includes blood pressure checks, ultrasound imaging, blood/urine tests, iron-folic acid supplements, and specialist consultation by OBGYN physicians.",
    official_url: "https://pmsma.nhp.gov.in",
    last_updated: "February 2026",
  },
  {
    scheme_id: "sch_03",
    scheme_name: "Ayushman Vaya Vandana Scheme (Senior Citizen Care)",
    department: "Ministry of Health & Family Welfare",
    category: "Senior Care",
    coverage_amount: "₹5,00,000 per senior citizen per year",
    eligibility:
      "All Indian citizens aged 70 years and above, regardless of income status or socio-economic background. Distinct top-up cover provided for senior citizens in families already covered under PM-JAY.",
    benefits:
      "Provides dedicated health insurance coverage up to ₹5 Lakhs per year specifically for senior citizens 70+. Covers age-related surgeries, joint replacements, cardiac procedures, and chronic inpatient care without co-payments.",
    official_url: "https://pmjay.gov.in/vaya-vandana",
    last_updated: "January 2026",
  },
  {
    scheme_id: "sch_04",
    scheme_name: "Central Government Health Scheme (CGHS)",
    department: "Department of Health & Family Welfare",
    category: "Central Government",
    coverage_amount: "Comprehensive Outpatient & Inpatient Medical Cover",
    eligibility:
      "Serving central government employees, pensioners, freedom fighters, ex-Governors, sitting & former MPs, and dependent family members residing in CGHS-covered cities.",
    benefits:
      "Provides comprehensive medical care including OPD consultation at wellness centers, indoor treatment at government & empanelled private hospitals, cashless facility for pensioners, and reimbursement for emergency treatment.",
    official_url: "https://cghs.nic.in",
    last_updated: "March 2026",
  },
  {
    scheme_id: "sch_05",
    scheme_name: "Chief Minister Comprehensive Health Insurance Scheme (CMCHIS)",
    department: "State Health Society, Government of Tamil Nadu",
    category: "State Government",
    coverage_amount: "₹5,00,000 per family per year",
    eligibility:
      "Resident families of Tamil Nadu with annual family income below ₹1,20,000 as certified by Revenue authorities, as well as Sri Lankan refugees residing in camps and registered orphans.",
    benefits:
      "Cashless medical treatment for 1,090 surgical and medical procedures, 8 specialized procedures (e.g. kidney transplant, bone marrow transplant), and 52 diagnostic tests across accredited hospitals in Tamil Nadu.",
    official_url: "https://www.cmchistn.com",
    last_updated: "January 2026",
  },
  {
    scheme_id: "sch_06",
    scheme_name: "West Bengal Swasthya Sathi Scheme",
    department: "Department of Health & Family Welfare, West Bengal",
    category: "State Government",
    coverage_amount: "₹5,00,000 per family per year",
    eligibility:
      "All resident families of West Bengal. The Swasthya Sathi smart card is issued in the name of the eldest female member of the family as guardian. No income limit.",
    benefits:
      "Basic health cover up to ₹5 Lakhs per family per annum for secondary and tertiary care. Fully cashless, paperless IT-driven smart card system valid in all government and empanelled private hospitals.",
    official_url: "https://swasthyasathi.gov.in",
    last_updated: "February 2026",
  },
  {
    scheme_id: "sch_07",
    scheme_name: "National Dialysis Program (Pradhan Mantri National Dialysis Program)",
    department: "National Health Mission (NHM)",
    category: "Health Ministry",
    coverage_amount: "100% Free Hemodialysis Services",
    eligibility:
      "All BPL (Below Poverty Line) patients suffering from End-Stage Renal Disease (ESRD) requiring regular dialysis sessions.",
    benefits:
      "100% free hemodialysis sessions at District Hospitals and public-private partnership (PPP) dialysis centers. Non-BPL patients are charged nominal government rates.",
    official_url: "https://nhm.gov.in",
    last_updated: "January 2026",
  },
  {
    scheme_id: "sch_08",
    scheme_name: "Janani Suraksha Yojana (JSY)",
    department: "National Health Mission (NHM)",
    category: "Maternal Health",
    coverage_amount: "Cash Incentive up to ₹1,400 per delivery",
    eligibility:
      "Pregnant women belonging to BPL/SC/ST categories delivering in public health institutions or accredited private hospitals.",
    benefits:
      "Direct Cash Transfer (DBT) incentive of ₹1,400 for rural mothers and ₹1,000 for urban mothers upon institutional delivery, along with free transport via 102/108 ambulances.",
    official_url: "https://nhm.gov.in/index1.php?lang=1&level=2&sublinkid=841",
    last_updated: "February 2026",
  },
];

export const schemeApi = {
  getSchemes: async (
    categoryFilter?: string,
    searchQuery?: string
  ): Promise<GovernmentScheme[]> => {
    await delay(250);
    let results = [...MOCK_SCHEMES];

    if (categoryFilter && categoryFilter !== "All") {
      results = results.filter((s) => s.category === categoryFilter);
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (s) =>
          s.scheme_name.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q) ||
          s.benefits.toLowerCase().includes(q) ||
          s.eligibility.toLowerCase().includes(q)
      );
    }

    return results;
  },

  getSchemeById: async (schemeId: string): Promise<GovernmentScheme | null> => {
    await delay(200);
    return MOCK_SCHEMES.find((s) => s.scheme_id === schemeId) || null;
  },

  // RAG Query Handler Simulation
  querySchemeEligibility: async (
    userQuestion: string,
    schemeId?: string
  ): Promise<SchemeQuery> => {
    await delay(700);

    const qLower = userQuestion.toLowerCase();

    // Check for Low Confidence trigger
    if (
      qLower.includes("cosmetic") ||
      qLower.includes("tattoo") ||
      qLower.includes("car insurance") ||
      qLower.includes("private gym")
    ) {
      return {
        query_id: `q_low_${Date.now()}`,
        scheme_id: schemeId,
        user_question: userQuestion,
        confidence_score: 0.42,
        is_low_confidence: true,
        ai_response:
          "We couldn't find a strong match for this specific query in official government scheme documentation. Most government healthcare schemes (such as Ayushman Bharat PM-JAY and CGHS) strictly exclude cosmetic procedures, aesthetic treatments, and non-medical wellness facilities.",
        retrieved_chunks: [
          {
            chunk_id: "chk_ex_1",
            scheme_name: "Ayushman Bharat PM-JAY Exclusion List",
            excerpt:
              "Section 4.2 Exclusions: OPD care, cosmetic surgeries, organ transplant procedures not approved by Medical Board, and elective aesthetic treatments are excluded from PM-JAY coverage.",
            official_url: "https://pmjay.gov.in",
          },
        ],
      };
    }

    // High Confidence Match for Senior Care / Ayushman / Maternal
    if (qLower.includes("70") || qLower.includes("senior") || qLower.includes("elderly")) {
      return {
        query_id: `q_high_${Date.now()}`,
        scheme_id: schemeId || "sch_03",
        user_question: userQuestion,
        confidence_score: 0.92,
        is_low_confidence: false,
        ai_response:
          "Yes! Under the newly expanded Ayushman Vaya Vandana Scheme (October 2024 onwards), all Indian citizens aged 70 years and above are eligible for free health cover up to ₹5 Lakhs per year, regardless of family income status. You do not need to fall below the poverty line (BPL).",
        retrieved_chunks: [
          {
            chunk_id: "chk_vaya_1",
            scheme_name: "Ayushman Vaya Vandana Scheme Guidelines 2024",
            excerpt:
              "Clause 2.1 Universal Coverage for Seniors: Every individual citizen who has attained 70 years of age shall be eligible for distinct health cover up to ₹5,00,000 per annum across empanelled hospitals.",
            official_url: "https://pmjay.gov.in/vaya-vandana",
          },
          {
            chunk_id: "chk_vaya_2",
            scheme_name: "NHA Circular NHA/PMJAY/SENIOR/2024",
            excerpt:
              "Income Exemption: Senior citizens 70+ from non-BPL families will receive a dedicated Ayushman Card upon e-KYC verification using Aadhaar.",
            official_url: "https://pmjay.gov.in",
          },
        ],
      };
    }

    // Default High Confidence Ayushman/General Match
    return {
      query_id: `q_gen_${Date.now()}`,
      scheme_id: schemeId || "sch_01",
      user_question: userQuestion,
      confidence_score: 0.84,
      is_low_confidence: false,
      ai_response:
        "Based on official government guidelines for Ayushman Bharat PM-JAY, BPL families and low-income households (income under ₹1.2L–₹2L per annum depending on state norms or SECC 2011 criteria) qualify for ₹5 Lakhs annual cashless hospitalization cover. Surgeries, ICU care, and diagnostics are fully covered.",
      retrieved_chunks: [
        {
          chunk_id: "chk_pmjay_1",
          scheme_name: "Ayushman Bharat PM-JAY Master Operational Guidelines",
          excerpt:
            "Chapter 3: Beneficiary Identification: Households identified through SECC 2011 data or active state health cards are automatically eligible for secondary and tertiary care hospitalization up to ₹5,00,000.",
          official_url: "https://pmjay.gov.in",
        },
      ],
    };
  },
};
