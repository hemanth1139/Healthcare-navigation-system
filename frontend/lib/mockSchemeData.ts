// Phase 1: Updated scheme mock data with multi-document RAG eligibility reasoning,
// criterion-level PASS/FAIL/UNKNOWN results and evidence sources with page numbers

import {
  GovernmentScheme,
  SchemeQuery,
  MultiDocEligibilityResult,
  EligibilityCriterion,
  EvidenceSource,
} from "@/types/scheme";

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

// Build multi-doc eligibility result for senior citizen example
const SENIOR_EVIDENCE_SOURCES: EvidenceSource[] = [
  {
    chunk_id: "chk_vaya_1",
    document_title: "Ayushman Vaya Vandana Scheme Guidelines 2024",
    page_number: 4,
    excerpt:
      "Clause 2.1 Universal Coverage for Seniors: Every individual citizen who has attained 70 years of age shall be eligible for distinct health cover up to ₹5,00,000 per annum across empanelled hospitals.",
    official_url: "https://pmjay.gov.in/vaya-vandana",
    relevance_score: 0.97,
  },
  {
    chunk_id: "chk_vaya_2",
    document_title: "NHA Circular NHA/PMJAY/SENIOR/2024",
    page_number: 2,
    excerpt:
      "Income Exemption: Senior citizens 70+ from non-BPL families will receive a dedicated Ayushman Card upon e-KYC verification using Aadhaar. No income threshold applies.",
    official_url: "https://pmjay.gov.in",
    relevance_score: 0.94,
  },
];

const SENIOR_CRITERIA: EligibilityCriterion[] = [
  {
    criterion_id: "cr_age",
    criterion_name: "Age Requirement",
    criterion_result: "PASS",
    patient_value: "72 years old",
    required_value: "70 years and above",
    explanation: "Patient is 72 years old, which meets the minimum age requirement of 70 years.",
    supporting_evidence: [SENIOR_EVIDENCE_SOURCES[0]],
  },
  {
    criterion_id: "cr_nationality",
    criterion_name: "Indian Citizenship",
    criterion_result: "PASS",
    patient_value: "Indian citizen",
    required_value: "Indian citizen",
    explanation: "Patient is confirmed as an Indian citizen.",
    supporting_evidence: [SENIOR_EVIDENCE_SOURCES[0]],
  },
  {
    criterion_id: "cr_income",
    criterion_name: "Income Limit",
    criterion_result: "PASS",
    patient_value: "Any income",
    required_value: "No income limit applies for 70+",
    explanation:
      "The Ayushman Vaya Vandana Scheme has no income eligibility restriction for citizens aged 70 and above.",
    supporting_evidence: [SENIOR_EVIDENCE_SOURCES[1]],
  },
];

const PMJAY_EVIDENCE_SOURCES: EvidenceSource[] = [
  {
    chunk_id: "chk_pmjay_1",
    document_title: "Ayushman Bharat PM-JAY Master Operational Guidelines",
    page_number: 12,
    excerpt:
      "Chapter 3: Beneficiary Identification: Households identified through SECC 2011 data or active state health cards are automatically eligible for secondary and tertiary care hospitalization up to ₹5,00,000.",
    official_url: "https://pmjay.gov.in",
    relevance_score: 0.91,
  },
  {
    chunk_id: "chk_pmjay_2",
    document_title: "PM-JAY Scheme Beneficiary Categories – Revised 2025",
    page_number: 7,
    excerpt:
      "Urban Occupational Categories (Appendix B): Street vendors/hawkers, domestic workers, rag pickers, construction workers, and transport workers are categorized as PM-JAY eligible beneficiaries.",
    official_url: "https://pmjay.gov.in",
    relevance_score: 0.84,
  },
  {
    chunk_id: "chk_secc",
    document_title: "SECC 2011 Data — Eligibility Mapping (NHA Reference)",
    page_number: 3,
    excerpt:
      "Families not covered under SECC 2011 may apply via state-specific portals for manual verification. Additional categories may be included under state-level PM-JAY extensions.",
    official_url: "https://pmjay.gov.in",
    relevance_score: 0.78,
  },
];

const PMJAY_CRITERIA: EligibilityCriterion[] = [
  {
    criterion_id: "cr_bpl",
    criterion_name: "BPL / SECC 2011 Coverage",
    criterion_result: "UNKNOWN",
    patient_value: "Not confirmed in profile",
    required_value: "Must be in SECC 2011 BPL database",
    explanation:
      "Patient has not provided SECC 2011 beneficiary ID or BPL certificate. Eligibility under this criterion cannot be confirmed without this information.",
    supporting_evidence: [PMJAY_EVIDENCE_SOURCES[0], PMJAY_EVIDENCE_SOURCES[2]],
    is_missing_info: true,
  },
  {
    criterion_id: "cr_income_pmjay",
    criterion_name: "Family Income",
    criterion_result: "UNKNOWN",
    patient_value: "Not provided",
    required_value: "Below poverty line or SECC 2011 defined threshold",
    explanation:
      "Annual family income has not been provided in the patient profile. Income verification is needed via income certificate.",
    supporting_evidence: [PMJAY_EVIDENCE_SOURCES[1]],
    is_missing_info: true,
  },
];

// Build multi-doc eligibility results
const MOCK_ELIGIBILITY_RESULTS: Record<string, MultiDocEligibilityResult> = {
  senior: {
    query_id: "q_high_001",
    scheme_id: "sch_03",
    user_question: "Am I eligible for Ayushman Vaya Vandana if I am 72 years old?",
    overall_status: "ELIGIBLE",
    overall_explanation:
      "Based on official government documents, you are fully eligible for the Ayushman Vaya Vandana Scheme. All Indian citizens aged 70 years and above qualify automatically, regardless of income or BPL status. Your age of 72 years satisfies the primary eligibility criterion.",
    criteria_breakdown: SENIOR_CRITERIA,
    missing_information: [],
    all_evidence_sources: SENIOR_EVIDENCE_SOURCES,
    queried_at: new Date().toISOString(),
  },
  pmjay_general: {
    query_id: "q_gen_001",
    scheme_id: "sch_01",
    user_question: "Am I eligible for Ayushman Bharat PM-JAY?",
    overall_status: "INSUFFICIENT_INFORMATION",
    overall_explanation:
      "Based on the available patient information, your PM-JAY eligibility could not be fully determined. The key missing information is your SECC 2011 beneficiary status and annual family income. Please provide your BPL certificate or SECC 2011 ID to complete the assessment.",
    criteria_breakdown: PMJAY_CRITERIA,
    missing_information: [
      "SECC 2011 Beneficiary ID or BPL card number",
      "Annual family income (Income Certificate)",
      "State of residence (for state-specific PM-JAY extension eligibility)",
    ],
    all_evidence_sources: PMJAY_EVIDENCE_SOURCES,
    queried_at: new Date().toISOString(),
  },
  exclusion: {
    query_id: "q_low_001",
    scheme_id: undefined,
    user_question: "Is cosmetic surgery covered under PM-JAY?",
    overall_status: "NOT_ELIGIBLE",
    overall_explanation:
      "Cosmetic and aesthetic procedures are explicitly excluded from all major government healthcare schemes including PM-JAY, CGHS, and state health insurance schemes. Only medically necessary procedures are covered.",
    criteria_breakdown: [
      {
        criterion_id: "cr_medical_necessity",
        criterion_name: "Medical Necessity",
        criterion_result: "FAIL",
        patient_value: "Cosmetic procedure (elective aesthetic)",
        required_value: "Medically necessary procedure",
        explanation:
          "Section 4.2 of PM-JAY Operational Guidelines explicitly excludes cosmetic, aesthetic, and elective non-medical procedures from scheme coverage.",
        supporting_evidence: [
          {
            chunk_id: "chk_ex_1",
            document_title: "Ayushman Bharat PM-JAY Exclusion List",
            page_number: 18,
            excerpt:
              "Section 4.2 Exclusions: OPD care, cosmetic surgeries, organ transplant procedures not approved by Medical Board, and elective aesthetic treatments are excluded from PM-JAY coverage.",
            official_url: "https://pmjay.gov.in",
            relevance_score: 0.98,
          },
        ],
      },
    ],
    missing_information: [],
    all_evidence_sources: [],
    queried_at: new Date().toISOString(),
  },
};

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

  // Phase 1: RAG + Multi-document eligibility query handler
  querySchemeEligibility: async (
    userQuestion: string,
    schemeId?: string
  ): Promise<{ query: SchemeQuery; eligibilityResult: MultiDocEligibilityResult }> => {
    await delay(900); // Simulate RAG pipeline time

    const qLower = userQuestion.toLowerCase();

    let eligibilityResult: MultiDocEligibilityResult;
    let aiResponse: string;

    if (
      qLower.includes("cosmetic") ||
      qLower.includes("tattoo") ||
      qLower.includes("car insurance") ||
      qLower.includes("private gym")
    ) {
      eligibilityResult = MOCK_ELIGIBILITY_RESULTS.exclusion;
      aiResponse = eligibilityResult.overall_explanation;
    } else if (
      qLower.includes("70") ||
      qLower.includes("72") ||
      qLower.includes("senior") ||
      qLower.includes("elderly") ||
      qLower.includes("vaya vandana")
    ) {
      eligibilityResult = {
        ...MOCK_ELIGIBILITY_RESULTS.senior,
        query_id: `q_high_${Date.now()}`,
        user_question: userQuestion,
        queried_at: new Date().toISOString(),
      };
      aiResponse = eligibilityResult.overall_explanation;
    } else {
      eligibilityResult = {
        ...MOCK_ELIGIBILITY_RESULTS.pmjay_general,
        query_id: `q_gen_${Date.now()}`,
        user_question: userQuestion,
        queried_at: new Date().toISOString(),
      };
      aiResponse = eligibilityResult.overall_explanation;
    }

    const query: SchemeQuery = {
      query_id: eligibilityResult.query_id,
      scheme_id: schemeId || eligibilityResult.scheme_id,
      user_question: userQuestion,
      ai_response: aiResponse,
      retrieved_chunks: eligibilityResult.all_evidence_sources.map((e) => ({
        chunk_id: e.chunk_id,
        scheme_name: e.document_title,
        excerpt: e.excerpt,
        official_url: e.official_url,
      })),
      confidence_score:
        eligibilityResult.overall_status === "ELIGIBLE"
          ? 0.95
          : eligibilityResult.overall_status === "NOT_ELIGIBLE"
          ? 0.98
          : 0.72,
      is_low_confidence: eligibilityResult.overall_status === "INSUFFICIENT_INFORMATION",
      eligibility_result: eligibilityResult,
    };

    return { query, eligibilityResult };
  },
};
