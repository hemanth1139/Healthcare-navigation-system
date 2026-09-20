AI-Driven Healthcare Navigation and Eligibility Reasoning: A Survey of Clinical Assessment, Retrieval-Augmented Intelligence, and Policy-Aware Systems

Abstract

Artificial intelligence (AI) is now being used in several parts of the healthcare navigation process. The research, however, is divided across areas such as symptom assessment, clinical triage, referral, conversational agents, large language models (LLMs), retrieval-augmented generation (RAG), and eligibility determination. These systems do not solve the same problem. They use different datasets and evaluation methods, and the amount of clinical validation also differs.

This review examines 64 verified records and also considers one relevant 2026 study that appeared after the main corpus was completed. Here, the review looks at a practical set of questions: how patient information is interpreted, how urgency is judged, how suitable services are located, how supporting evidence is retrieved, and how eligibility criteria are checked. The analysis also considers clinical-trial matching, insurance and Medicaid eligibility, public-benefit programs, PM-JAY, provenance, uncertainty, policy versioning, jurisdiction, fairness, multilingualism, and real-world validation.

Some parts of this process already have a substantial research base, particularly clinical assessment, triage, and trial matching. Clinical-trial matching has made particularly clear progress in retrieving trials and checking individual eligibility criteria. LLM and RAG systems can also connect generated answers to information retrieved from external sources. Far less independent validation is available for systems that combine jurisdiction-specific benefit or insurance navigation, clinical context, urgency estimation, provenance, policy versioning, and fairness within a single workflow.

The main issue is therefore not whether individual AI components can be built. The harder question is whether they can work together reliably from the patient's first query to the final recommendation. The survey compares the literature by patient-journey stage and by system architecture. It then examines where current validation is weak and what would be needed for a system that can be checked, updated, and used safely.

Keywords— healthcare navigation, eligibility reasoning, clinical triage, large language models, retrieval-augmented generation, clinical trial matching, public benefits, PM-JAY, fairness, policy reasoning.

I. Introduction

For a patient, reaching the right healthcare service usually involves several decisions in succession rather than one prediction. The first step may be describing the symptoms. From there, the patient may need to judge urgency, choose the appropriate type of care, locate a service, check referral requirements, and confirm whether the patient or provider satisfies the relevant eligibility rules. Information collected at one step may not be enough for the next step. The task becomes harder when information is scattered across records and services have different rules or availability in different jurisdictions.

Much of the published work concentrates on one of these steps at a time. Symptom checkers can assess symptoms and estimate urgency, triage systems can estimate the likelihood of particular conditions, referral systems can prioritize specialties, conversational agents can interact with patients, LLMs can process clinical text, RAG systems can retrieve external information, and eligibility systems can evaluate whether a patient satisfies defined criteria [1]–[22]. Viewed together, these studies provide evidence that AI can assist with particular navigation tasks. The harder task is to combine them without losing reliability or making it impossible to check how a decision was reached.

Eligibility is a different kind of problem because the system has to connect the facts available about a patient with a fixed set of requirements. For an ordinary medical question, more than one answer may be reasonable. An eligibility decision is stricter: every relevant criterion needs supporting evidence, a reason for rejection, or a clear indication that the information is not available. For a public-benefit program, for instance, the answer may depend on the person's jurisdiction, the version of the policy that applies on that date, specific exemptions, and administrative definitions. A useful system should go one step further than producing a plausible answer. It should make clear which patient facts support each requirement and where additional information is still needed.

In this review, healthcare navigation is treated as a sequence of related processes:

patient context understanding → symptom assessment and urgency estimation → referral and service navigation → eligibility and policy reasoning → recommendation or action.

The discussion is therefore centered on the main components, the role each component plays, and the evidence used to evaluate it.

II. Review Methodology and Scope

This manuscript is primarily based on a verified corpus of 64 records assembled and checked during the earlier stages of the research. The corpus contains systematic and scoping reviews, empirical studies, methodological papers, benchmarks, policy and government sources, and papers describing data resources. The records were deduplicated and grouped into several areas: symptom assessment and triage, referral and navigation, conversational AI, healthcare LLMs, RAG, agentic AI, clinical-trial eligibility, insurance and public-benefit eligibility, PM-JAY, fairness and equity, and data resources.

The sources do not all provide the same kind of evidence, so their roles in the review are different. Peer-reviewed reviews and empirical studies provide the main scientific evidence. Official government and organizational sources are used when discussing program scope, deployment, or policy-related facts. Preprints and early technical studies are included to reflect emerging research directions, but they are not treated as equivalent to prospective clinical validation. The maturity labels used later are judgments from the synthesis; they are not formal risk-of-bias scores.

Before settling on the research gap, the proposed claim was checked against studies and deployments that could directly contradict it. That check ruled out three overly broad claims: that AI navigation is absent, that LLMs have not been used for eligibility reasoning, and that PM-JAY has no AI or conversational service. The focus was consequently shifted to a narrower problem: the lack of strong validation for systems that combine these functions. The earlier verification work established bibliographic identities and extracted relevant study information, but it did not provide a complete risk-of-bias assessment or full-text evaluation for every record.

III. Healthcare Navigation Problem Formulation

One way to compare the studies is to view navigation as a chain of linked decisions. Let x represent the patient information available to the system, including symptoms, demographic information, location, clinical history, documents, preferences, and administrative data. The system then needs to derive several intermediate states: a clinical interpretation c, an urgency state u, a service or referral set s, and an eligibility state e. The final recommendation r should depend not only on the predicted clinical state but also on retrieved service information and the policy rules that apply to the case.

This distinction is useful because success on one navigation task does not make a system a complete healthcare navigator. A triage model may estimate urgency without knowing which services are actually available or appropriate. An eligibility system may apply benefit rules without understanding the patient's clinical urgency. A trial-matching system may compare a patient with trial criteria without addressing provider availability or public-benefit eligibility. Similarly, a chatbot may successfully collect information without ensuring that its final recommendation reflects the current policy.

A practical architecture should keep four things separate:

1. Clinical inference

2. Retrieved facts

3. Policy rules

4. Recommendations

Separating these elements also makes a decision easier to inspect. A reviewer can tell what was inferred by the model, what was retrieved from a source, which rule was applied, and how the final recommendation followed from them.

IV. Symptom Assessment and Clinical Triage

A. Digital Symptom Assessment

Digital symptom assessment has been studied extensively, although the reported results differ markedly from one system to another. Wallace and colleagues reviewed 177 records and included 10 studies. They reported primary-diagnosis accuracy between 19% and 37.9%, whereas triage accuracy ranged from 48.8% to 90.1% [1]. Earlier systematic evidence had also reported substantial variation among digital and online symptom-checking services [2]. In a vignette-based comparison, the symptom-assessment applications studied did not consistently outperform general practitioners in identifying possible conditions or determining urgency [3].

More recent research has expanded this area to include LLM-based assessment. A 2025 systematic review reported accuracy ranging from 11.5% to 90.0% for applications and from 57.8% to 76.0% for LLMs [4]. A real-world evaluation in Finland reported 97.6% safe recommendations, 53.7% exact triage, and 62.6% sensitivity [5]. These figures also explain why overall accuracy alone can be misleading. A system may perform well on average and still fail to recognize a small number of serious cases.

B. Emergency Triage

Emergency-department triage studies are generally closer to real clinical workflows than consumer symptom checkers. A review of prospective studies identified seven studies and reported predictive accuracy between 80.5% and 99.1% for AI-based triage. The studies also considered factors such as time reduction, over-triage, under-triage, mistriage, and patient outcomes [8].

However, the evidence is not uniformly mature. A 2026 scoping review of 27 studies reported continuing limitations in prospective validation, explainability, and fairness assessment [9]. A model that works well in one hospital or dataset still needs to be tested before its performance is assumed to transfer to another setting.

V. Referral, Service Navigation, and Conversational Systems

Referral is the point where clinical assessment begins to turn into a decision about where the patient should receive care. The reviewed studies cover workup-advisement technologies, referral prioritization, topic modeling, and text-processing approaches [12]–[17]. One workup-advisement system reported an AUROC of 0.95 and improvements in precision and recall when identifying appropriate referrals, although the evaluation was retrospective and limited to a specific specialty [12]. Other research suggests that electronic referrals can improve coordination, although implementation varies substantially between settings [17].

Patient navigation covers more than ranking referrals. Its purpose is to help people find an appropriate service and deal with the practical barriers that can prevent access. Online navigation approaches have been studied across different populations and settings [10]. Recent reviews suggest that digital navigators may help address equity-related barriers, although their roles, training requirements, and measured equity outcomes are not consistent across studies [11]. For that reason, a useful navigator must answer more than “Where should this patient be referred?” It also needs to consider whether the service is available, what restrictions the user faces, whether eligibility conditions apply, and what action should come next.

A. Conversational Agents

Conversational agents are used to collect information, conduct health histories, support people with chronic conditions, and facilitate communication with patients [18]–[22]. Reviews in this area show substantial experimentation and continued interest, but the evidence remains heterogeneous and is often based on short-term or controlled studies. A smooth conversation is useful, but it does not by itself establish that the advice or recommendation is safe.

VI. Large Language Models for Healthcare Navigation

LLMs are useful for navigation because patients and clinicians rarely describe their needs in a fixed format. These models can work with free-form clinical language and extract information needed by different tasks. The literature reviewed includes numerous studies of clinical LLMs, medical applications, patient-care applications, evaluation methods, and emerging clinical trials [23]–[28]. Their main strengths include flexible information extraction, summarization, question answering, dialogue, and conversion of clinical language into structured information.

Answering general medical questions well is not the same as handling a patient's individual case safely. A systematic review covering 519 healthcare LLM studies shows how these systems are currently being evaluated. Only 5% of the studies used real patient-care data. Accuracy was the primary evaluation measure in 95.4% of studies, while fairness, bias, or toxicity were assessed in 15.8%, and calibration or uncertainty was assessed in only 1.2% [26].

This limitation is particularly relevant to navigation and eligibility. An answer may sound reasonable even when a required fact is missing or the supporting information is no longer current. For policy-related decisions, the LLM should interpret and explain the available rules rather than act as the source of those rules. Such systems therefore need external evidence, explicit constraints, and a way to stop or ask for more information when the available evidence is insufficient.

VII. Retrieval-Augmented Generation and Evidence-Grounded Reasoning

RAG changes the process by giving the language model relevant external documents before it produces an answer. Clinical RAG systems have been developed to connect language models with medical literature, guidelines, and other external knowledge sources [29]. MIRAGE, for example, provides a benchmark containing 7,663 medical question-answering questions [30]. A 2025 systematic review and meta-analysis examined 335 records and 20 comparative studies and found that RAG generally improved performance compared with baseline models, although considerable variation remained between studies [31]. Guideline-focused RAG systems similarly suggest that retrieval grounding can improve question answering while still leaving some errors unresolved [32].

In an eligibility task, finding the right document is only the beginning. The retrieved material must also be authoritative, relevant to the user's jurisdiction, valid on the date in question, and correctly interpreted. Even an official document can produce a wrong decision if it has been superseded, belongs to another jurisdiction, contains an exception, or does not provide evidence for the patient fact being checked. For this reason, the decision record should include the source used, its authority, effective date, jurisdiction, and policy version.

VIII. Eligibility Reasoning for Clinical Trials

Within the present corpus, clinical-trial matching has the clearest and most developed evidence base. Research on eligibility prescreening has used natural-language processing to identify relevant criteria and reduce the workload involved in screening [35]. TrialGPT demonstrated retrieval and criterion-level matching using 183 synthetic patients and more than 75,000 trial annotations. It reported more than 90% retrieval recall while considering less than 6% of the original trial collection, 87.3% criterion-level accuracy, and a 42.6% reduction in screening time [36]. Other systems have focused on criteria extraction, automated screening, explainable matching, and evaluation within specific clinical populations [37]–[41].

The structure of these systems also suggests how other eligibility problems could be handled. In practical terms, the process is straightforward: find possible candidates, turn their criteria into individual checks, compare each check with the available patient evidence, record what is missing, and present the results for review. This approach is more constrained than open-ended medical question answering and provides a useful foundation for policy-based benefit reasoning.

A. Recent Post-Corpus Evidence: TrialMatchAI

A 2026 study published in Nature Communications, TrialMatchAI, provides an important update to the evidence base [65]. The system combines fine-tuned open-source LLMs with RAG, hybrid BM25 and vector retrieval, LLM-based re-ranking, and criterion-level eligibility classification. In a real-world cohort of 52 oncology patients, it achieved 92.3% recall at Top-20, while expert evaluation reported more than 90% accuracy for criterion-level classification [65].

TrialMatchAI adds real-world evidence to the growing body of work on LLM/RAG-based eligibility matching. Its evaluation, however, was limited to oncology, and the system focuses on clinical-trial recommendations rather than general healthcare navigation or public-benefit eligibility. It therefore challenges the idea that this type of technology is absent, but it does not remove the broader integration and validation gap identified in this review.

IX. Insurance, Medicaid, and Public-Benefit Eligibility Reasoning

Insurance and public-benefit decisions add a further requirement: the system must follow the policy rules that govern the particular case. The reviewed literature includes Medicaid redetermination methods, administrative automation, dialogue-based insurance assessment, and LLM-based insurance reimbursement eligibility [42]–[46]. Ratna et al. presented a GPT-4o-based method for extracting Medicaid rules from public policy materials in Washington, South Carolina, and North Dakota and converting those rules into application logic [42]. A study covering six states also described how rules engines, electronic data verification, online applications, and human workers contribute to operational eligibility processes [43].

A 2026 study of health-insurance reimbursement for anticancer drugs evaluated 222 cases across 74 treatment regimens and reported accuracy between 77.9% and 88.7% [46]. One result is especially relevant here: missing information was a major source of error. In several cases, the system went beyond the evidence available and tried to fill the gaps itself. This suggests a simple but important design choice. The system should be able to return three states—eligible, not eligible, or undetermined when required evidence is missing—instead of forcing every case into a yes-or-no answer.

Policy-based decisions are also more likely to change over time than clinical-trial criteria. Eligibility requirements can change because of amendments, state-level modifications, transitional rules, or administrative interpretations. As a result, improving generalization is not simply a matter of increasing the language model's capabilities. It therefore needs to know which policy version applies and which jurisdiction the case belongs to.

X. PM-JAY and the Indian Healthcare Context

Ayushman Bharat–Pradhan Mantri Jan Arogya Yojana (AB-PMJAY) provides an important setting for studying healthcare navigation and public-benefit eligibility. Official National Health Authority sources describe the program's scope and beneficiary information, while PM-JAY service documentation covers beneficiary support and call-centre functions [47], [48]. Research has also examined barriers faced by beneficiaries and challenges in implementation at the hospital level [50], [51].

PM-JAY likewise should not be treated as a program without digital or conversational services. Official deployment evidence identifies Ayushman Sarathi as a WhatsApp-based beneficiary service for PM-JAY [49]. The more specific research question is whether peer-reviewed studies have independently validated an end-to-end system that combines patient clinical information, urgency assessment, service navigation, and current PM-JAY or related eligibility rules while also providing verifiable provenance and explicit handling of uncertainty. No such evidence was identified in the reviewed corpus/search.

The distinction matters because The presence of a deployed chatbot shows that a digital service exists, but deployment alone does not establish the accuracy, safety, fairness, policy correctness over time, or end-to-end navigation performance of an AI eligibility reasoner.

XI. Agentic, Hybrid, and Neuro-Symbolic Architectures

Agentic systems allow an LLM to work through several connected steps rather than giving one response and stopping. For example, the system may plan a task, retrieve information, call an external tool, and divide a larger task into smaller parts. Reviews of clinical and healthcare agents show rapid growth in this area, although many studies are still simulated or retrospective [33], [34]. In principle, an agentic navigator could collect symptoms, estimate urgency, search for services, retrieve relevant policies, identify missing evidence, verify service constraints, and generate a recommendation with supporting citations.

Giving the system more freedom also creates more points at which an error can occur. A tool call may retrieve the wrong source, an error in one intermediate state may carry over into later decisions, and an agent may continue reasoning even after the available evidence is no longer sufficient. For a high-stakes setting, the agent needs to keep track of its intermediate state, use tested tools, know when to stop, expose uncertainty, and hand difficult cases to a human reviewer.

Hybrid and neuro-symbolic designs are well suited to eligibility because many policy requirements can be expressed as explicit conditions. An LLM can interpret unstructured information and identify potentially relevant facts, while rules, knowledge graphs, or executable policy representations can enforce explicit conditions. Keeping these roles separate also limits the amount of policy logic left to free-form generation and makes the final decision easier to inspect.

XII. Fairness, Uncertainty, Provenance, and Policy Versioning

A. Fairness and Equity

Fairness matters here because a navigation or eligibility decision can change a person's access to care or financial support. The reviewed literature includes studies of algorithmic racial bias, unequal clinical prediction, algorithmic-fairness methods, demographic bias in medical LLMs, and health-equity evaluation tools [52]–[57]. A systematic review of demographic disparities in medical LLMs found evidence of bias in 22 of 24 studies (91.7%). Gender bias was reported in 15 of 16 studies, while racial or ethnic bias was found in 10 of 11 studies [55]. These findings do not establish that every navigation system is biased. They do show that systems should be evaluated separately across relevant demographic groups.

B. Uncertainty and Abstention

Eligibility decisions often have to be made with incomplete information. When the evidence is incomplete, guessing may be worse than asking for one more piece of information. The system should be able to say that the case cannot yet be determined, identify the missing criterion, and ask only for the information needed to continue. The very low level of calibration and uncertainty evaluation reported in healthcare LLM research [26] highlights a significant mismatch between the requirements of high-stakes navigation and current evaluation practices.

C. Provenance and Auditability

For every rule that affects a decision, a policy-aware system should keep a record of the source document, the relevant passage, when it was retrieved, the jurisdiction, the effective date, and the policy version. Whether a citation actually supports the answer should be tested separately from how fluent the answer sounds. RAG can improve grounding, but the retrieval process itself also needs to be validated.

D. Temporal and Jurisdiction-Aware Reasoning

Eligibility rules can change over time. The same patient information may produce different results depending on the country, state, district, place of residence, provider location, hospital empanelment, income requirements, or policy date. Jurisdiction and policy version should be stored as explicit inputs rather than left for the LLM to guess.

E. Multilingual and Accessibility Considerations

Most of the available evidence is still based on English-language systems; much less is known about multilingual navigation and benefit reasoning. In an Indian deployment, systems would need to support major regional languages and should be evaluated at the individual criterion level. Important evaluation areas include translation-related policy errors, language-specific triage sensitivity, dialect differences, literacy levels, and the reliability of voice input. These areas remain insufficiently studied.

F. Human Oversight

Human review is still needed when triage is high risk, eligibility is uncertain, coverage decisions have legal consequences, or the available evidence conflicts. The purpose of an AI navigator does not have to be replacing the human decision maker. Instead, it can organize evidence, retrieve relevant information, make uncertainty visible, and reduce avoidable barriers in the navigation process.

XIII. Cross-Domain Comparative Analysis

Looking across the domains, the amount and quality of evidence are clearly uneven. Clinical assessment and triage have relatively established evaluation practices, although their results remain dependent on context. Referral and conversational systems can be useful operationally, but the evidence is heterogeneous. LLM and RAG research is developing quickly, yet accuracy remains the dominant evaluation measure. Clinical-trial eligibility provides the clearest example of criterion-level AI reasoning, while insurance and public-benefit systems introduce more demanding requirements related to time and jurisdiction. The combination of all these requirements has received much less independent validation.

XIV. Research Gaps and Open Problems

The proposed gap was first checked to see whether it depended on claims that were too broad. The claim that AI healthcare navigation does not exist is contradicted by symptom checkers, referral systems, conversational agents, digital navigators, and official digital services. Likewise, the claim that LLM-based eligibility reasoning does not exist is contradicted by clinical-trial matching, Medicaid research, and insurance eligibility studies. The claim that PM-JAY has no AI system is also contradicted by official evidence of conversational services.

The problem identified by the literature is not that the necessary technologies are missing. It is the limited independent validation of systems that integrate several parts of the navigation workflow. Existing systems tend to perform best when the task is narrowly defined—for example, triage, referral prioritization, clinical-trial matching, or policy extraction. What is still insufficiently established is a system that can jointly reason about patient clinical context, urgency, service availability, and changing jurisdiction-specific insurance or public-benefit rules while maintaining provenance, handling uncertainty, tracking policy versions, and evaluating equity.

This gap can be divided into six major open problems:

1. Cross-stage state representation

2. Policy-aware retrieval and versioning

3. Criterion-level uncertainty and abstention

4. Jurisdiction and service-availability reasoning

5. Fairness and multilingual validation

6. Prospective, external, multicenter evaluation using patient and operational outcomes

XV. Research Opportunities and Proposed Framework

The following design directions are proposed based on the literature synthesis and should not be interpreted as empirical findings.

One practical starting point is to separate clinical interpretation from policy reasoning. A clinical module can extract symptoms and facts related to urgency, while a separate policy module works with authoritative documents and structured eligibility rules.

A second step is to use RAG together with deterministic rules whenever a policy requirement can be written explicitly. Each retrieved rule should carry its jurisdiction, effective date, source authority, and policy version. A policy engine can then evaluate whether individual criteria are satisfied, while the LLM handles language interpretation and explanation.

Eligibility can then be checked one criterion at a time, with three possible outcomes: satisfied, not satisfied, or undetermined. When the result is undetermined, the system should ask for the missing evidence instead of guessing and completing the decision on its own. This approach is directly motivated by the information-gap errors reported in insurance eligibility research.

Evaluation should also move beyond a single overall accuracy score. A complete benchmark should consider retrieval recall, criterion-level classification, ranking quality, calibration, abstention quality, citation correctness, temporal correctness, jurisdiction correctness, subgroup performance, task completion, workload, and downstream access outcomes.

For high-risk cases, the workflow should include a clear point at which the case is transferred to a human. The proposed design is better viewed as an auditable decision-support workflow. It assists with navigation and evidence handling but does not act as an unrestricted autonomous medical or legal decision maker.

XVI. Discussion

Several research areas that were once evaluated separately are now beginning to overlap. Symptom assessment provides the clinical starting point, referral systems handle routing, conversational systems provide interaction, LLMs support flexible language processing, RAG connects models to external evidence, and eligibility systems provide criterion-level decision logic. The difficult part is combining them without allowing the flexibility of one component to weaken the reliability expected from the whole system.

Clinical-trial matching has the strongest eligibility evidence among the areas covered by this corpus. One reason is that trial registries provide a relatively standardized set of candidates and their eligibility requirements can often be broken down into explicit conditions. Insurance and public-benefit eligibility are more difficult because policies vary by jurisdiction, change over time, include exceptions, and may depend on administrative information that is not present in clinical records.

The evaluation literature also reveals a recurring difference between model-focused and workflow-focused assessment. Accuracy is easy to calculate and report. Showing that a navigation system actually improves access, reduces delays, prevents inappropriate routing, and works fairly across groups requires prospective studies in real settings. This distinction should be reflected in the design of future benchmarks and evaluations.

XVII. Limitations

The review is built mainly from a verified set of 64 records, with one additional study identified after the main corpus was completed. It should therefore not be interpreted as an exhaustive review of every publication in the field.

The earlier verification process established bibliographic identities and selected study-level facts, but it did not constitute a complete risk-of-bias assessment for every included record.

The studies also differ in setting, dataset, country, model, and evaluation method. Their reported numbers should therefore not be compared as if they came from the same experiment.

Several recent studies involving agentic systems and LLMs are simulated, retrospective, or based on preprints. These studies are useful for identifying research directions, but they do not necessarily represent mature clinical validation.

TrialMatchAI provides useful real-world evidence, but its validation was conducted in an oncology-specific setting and should not be generalized to healthcare navigation as a whole.

Commercial healthcare navigation systems may also contain capabilities relevant to this survey, but independent evaluation can be difficult because implementation details and outcome data may be proprietary.

Finally, the PM-JAY deployment claims in this review are based on official program sources. These sources establish the availability and scope of the service, but they do not independently demonstrate the effectiveness of an end-to-end AI reasoning system.

XVIII. Conclusion

AI-based healthcare navigation is now a recognized research area, although the work remains divided across several tasks. Digital symptom assessment, clinical triage, referral prioritization, conversational agents, healthcare LLMs, RAG, and agentic systems have all been demonstrated in different settings. Eligibility reasoning is also being actively studied. The clearest progress is in clinical-trial matching, while insurance, Medicaid, and public-benefit applications are developing more gradually.

The remaining problem is making these capabilities work together reliably in actual use. A reliable healthcare navigator needs to understand patient context, recognize urgency, identify suitable services, apply current eligibility rules, distinguish evidence from assumptions, recognize missing information, preserve source provenance, account for jurisdiction and policy version, and evaluate performance across different groups. Current research does not yet provide strong independent validation for all of these capabilities within one general end-to-end workflow.

The clearest gap identified by this review is therefore one of integration and validation. Future work should focus on auditable hybrid architectures, criterion-level uncertainty, authoritative policy retrieval, temporal and jurisdiction-aware reasoning, fairness and multilingual evaluation, and prospective validation in real-world settings. This approach recognizes the substantial progress already made while identifying a research direction that can be tested and evaluated systematically.

References — Working IEEE Draft

[1] B. Wallace et al., “The diagnostic and triage accuracy of digital and online symptom checker tools: a systematic review,” npj Digital Medicine, 2022, doi: 10.1038/s41746-022-00667-w.

[2] “Digital and online symptom checkers and health assessment/triage services for urgent health problems: systematic review,” BMJ Open, 2019, doi: 10.1136/bmjopen-2018-027743.

[3] “How accurate are digital symptom assessment apps for suggesting conditions and urgency of care?” BMJ, 2020, doi: 10.1136/bmjopen-2020-040269.

[4] “Accuracy of online symptom assessment applications, large language models, and laypeople for self-triage decisions,” npj Digital Medicine, 2025, doi: 10.1038/s41746-025-01566-6.

[5] V. Liu, M. Kaila, and T. Koskela, “Triage Accuracy and the Safety of User-Initiated Symptom Assessment With an Electronic Symptom Checker in a Real-Life Setting: Instrument Validation Study,” JMIR Human Factors, vol. 11, 2024, Art. no. e55099, doi: 10.2196/55099.

[6] Q. A. Almulihi, A. A. Alquraini, F. A. A. Almulihi, et al., “Applications of Artificial Intelligence and Machine Learning in Emergency Medicine Triage—A Systematic Review,” Medical Archives, vol. 78, no. 3, pp. 198–206, 2024, doi: 10.5455/medarh.2024.78.198-206.

[7] B. M. Porto, “Improving triage performance in emergency departments using machine learning and natural language processing: a systematic review,” BMC Emergency Medicine, vol. 24, Art. no. 219, 2024, doi: 10.1186/s12873-024-01135-2.

[8] Y. Yi, S. Baik, and S. Baek, “The effects of applying artificial intelligence to triage in healthcare,” Journal of Nursing Scholarship, 2025, doi: 10.1111/jnu.13024.

[9] R. Hikmat, Y. Supriyadi, F. Noor, et al., “Artificial Intelligence-Assisted Triage in Emergency Departments: A Scoping Review of Clinical Applications, Outcomes, and Implementation Challenges,” Clinical and Experimental Emergency Medicine, 2026, doi: 10.15441/ceem.26.283.

[10] “Characteristics of Existing Online Patient Navigation Interventions,” JMIR, 2024, doi: 10.2196/50307.

[11] G. Ornellas, M. V. de Albuquerque, and S. de Camargo Catapan, “Can digital navigators help reduce inequities in healthcare? A systematic review,” Journal of Telemedicine and Telecare, 2026, doi: 10.1177/1357633X261457758.

[12] “A Data-Driven Algorithm to Recommend Initial Clinical Workup for Outpatient Specialty Referral,” JMIR Medical Informatics, 2022, doi: 10.2196/30104.

[13] “Artificial intelligence in medical referrals triage based on Clinical Prioritization Criteria,” BMC Medical Informatics and Decision Making, 2023, doi: 10.3389/fdgth.2023.1192975.

[14] “Improving musculoskeletal care with AI enhanced triage through data-driven screening of referral letters,” npj Digital Medicine, 2025, doi: 10.1038/s41746-025-01495-4.

[15] “Patient Triage by Topic Modeling of Referral Letters: Feasibility Study,” JMIR Medical Informatics, 2020, doi: 10.2196/21252.

[16] “Text Mining and Automation for Processing of Patient Referrals,” 2018, doi: 10.1055/s-0038-1639482.

[17] “Electronic referral systems in health care: a scoping review,” 2019, doi: 10.2147/CEOR.S195597.

[18] “The Effectiveness of Artificial Intelligence Conversational Agents in Health Care: Systematic Review,” Journal of Medical Internet Research, 2020, doi: 10.2196/20346.

[19] “Conversational Agents in Health Care: Scoping Review,” Journal of Medical Internet Research, 2020, doi: 10.2196/17158.

[20] “Artificial Intelligence-Based Conversational Agents for Chronic Conditions: Systematic Literature Review,” Journal of Medical Internet Research, 2020, doi: 10.2196/20701.

[21] “Roles, Users, Benefits, and Limitations of Chatbots in Health Care: Rapid Review,” Journal of Medical Internet Research, 2024, doi: 10.2196/56930.

[22] “Transforming Health Care Through Chatbots for Medical History-Taking,” JMIR Medical Informatics, 2024, doi: 10.2196/56628.

[23] Y.-J. Park et al., “Assessing the research landscape and clinical utility of large language models: a scoping review,” BMC Medical Informatics and Decision Making, 2024, doi: 10.1186/s12911-024-02459-6.

[24] “The application of large language models in medicine,” iScience, 2024, doi: 10.1016/j.isci.2024.109713.

[25] “Systematic Review of Large Language Models for Patient Care: Current Applications and Challenges,” medRxiv, 2024, doi: 10.1101/2024.03.04.24303733.

[26] S. Bedi, Y. Liu, L. Orr-Ewing, et al., “Testing and Evaluation of Health Care Applications of Large Language Models: A Systematic Review,” JAMA, vol. 333, no. 4, pp. 319–328, 2025, doi: 10.1001/jama.2024.21700.

[27] “Large language models encode clinical knowledge,” Nature, 2023, doi: 10.1038/s41586-023-06291-2.

[28] “Large language models in medicine: a review of current clinical trials across healthcare applications,” 2024, doi: 10.1371/journal.pdig.0000662.

[29] “Almanac: Retrieval-Augmented Language Models for Clinical Medicine,” arXiv:2303.01229, 2023.

[30] “Benchmarking Retrieval-Augmented Generation for Medicine,” arXiv:2402.13178, 2024.

[31] S. Liu, A. B. McCoy, and A. Wright, “Improving large language model applications in biomedicine with retrieval-augmented generation: a systematic review, meta-analysis, and clinical development guidelines,” JAMIA, 2025, doi: 10.1093/jamia/ocaf008.

[32] “Evaluating Retrieval Augmented Generation-enhanced Large Language Models for Medical Guideline Question Answering,” 2026, doi: 10.1007/s00062-025-01562-z.

[33] “AI Agents in Clinical Medicine: A Systematic Review,” 2025, doi: 10.1101/2025.08.22.25334232.

[34] B. Njei, Y. A. Al-Ajlouni, S. K. U., et al., “Artificial intelligence agents in healthcare research: a scoping review,” PLOS ONE, 2026, doi: 10.1371/journal.pone.0342182.

[35] “A systematic review on natural language processing systems for eligibility prescreening,” JAMIA, 2022, doi: 10.1093/jamia/ocab228.

[36] Q. Jin, Z. Wang, C. S. Floudas, et al., “Matching Patients to Clinical Trials with Large Language Models,” Nature Communications, 2024, doi: 10.1038/s41467-024-53081-z.

[37] “AutoCriteria: a generalizable clinical trial eligibility criteria extraction system,” 2023, doi: 10.1093/jamia/ocad218.

[38] “Utilizing Large Language Models for Enhanced Clinical Trial Matching: A Study on Automation in Patient Screening,” Cureus, 2024, doi: 10.7759/cureus.60044.

[39] “Harnessing explainable artificial intelligence for patient-to-clinical-trial matching,” PLOS ONE, 2024, doi: 10.1371/journal.pone.0311510.

[40] “Evaluation of an artificial intelligence clinical trial matching system in Australian lung cancer patients,” JAMIA Open, 2020, doi: 10.1093/jamiaopen/ooaa002.

[41] “Large language models for automating clinical trial matching,” 2025, doi: 10.1097/MOU.0000000000001281.

[42] “A Methodology for Using Large Language Models to Create User-Friendly Applications for Medicaid Redetermination and Other Social Services,” International Journal of Public Health, 2024, doi: 10.3389/ijph.2024.1607317.

[43] “Assessment and Synthesis of Selected Medicaid Eligibility, Enrollment, and Renewal Processes and Systems in Six States,” MACPAC/SHADAC, 2018.

[44] “Using artificial intelligence to improve administrative process in Medicaid,” 2024, doi: 10.1093/haschl/qxae008.

[45] “A Dialogue-based Information Extraction System for Medical Insurance Assessment,” Findings of ACL, 2021, doi: 10.18653/v1/2021.findings-acl.58.

[46] “Assessing Eligibility for Anticancer Drug Health Insurance Reimbursement Using Large Language Models: Benchmark Development and Comparative Study,” JMIR AI, 2026, doi: 10.2196/95877.

[47] National Health Authority, Government of India, “About PM-JAY,” 2026.

[48] National Health Authority, Government of India, “PM-JAY Call Centre and Beneficiary FAQ,” 2024.

[49] Press Information Bureau, Government of India, “Union Health Minister launches Ayushman Sarathi,” 2026.

[50] M. Trivedi, A. Saxena, Z. Shroff, and M. Sharma, “Experiences and challenges in accessing hospitalization in PM-JAY,” PLOS ONE, 2022, doi: 10.1371/journal.pone.0266798.

[51] “Improving hospital-based processes for effective implementation of PM-JAY,” BMC Health Services Research, 2022, doi: 10.1186/s12913-021-07448-3.

[52] “Dissecting racial bias in an algorithm used to manage the health of populations,” Science, 2019, doi: 10.1126/science.aax2342.

[53] “Predictably unequal: understanding and addressing concerns that algorithmic clinical prediction may increase health disparities,” npj Digital Medicine, 2020, doi: 10.1038/s41746-020-0304-9.

[54] “Algorithmic fairness in artificial intelligence for medicine and healthcare,” Nature Biomedical Engineering, 2023, doi: 10.1038/s41551-023-01056-8.

[55] “Evaluating and addressing demographic disparities in medical large language models,” International Journal for Equity in Health, 2025, doi: 10.1186/s12939-025-02419-0.

[56] “Sociodemographic biases in medical decision making by large language models,” Nature Medicine, 2025, doi: 10.1038/s41591-025-03626-6.

[57] “A Toolbox for Surfacing Health Equity Harms and Biases in Large Language Models,” Nature Medicine, 2024, doi: 10.1038/s41591-024-03258-2.

[58] World Health Organization, “Ethics and Governance of Artificial Intelligence for Health,” 2021.

[59] A. E. W. Johnson, L. Bulgarelli, L. Shen, et al., “MIMIC-IV, a freely accessible electronic health record dataset,” Scientific Data, 2023, doi: 10.1038/s41597-022-01899-x.

[60] PhysioNet, “MIMIC-IV v3.0,” 2024, doi: 10.13026/hxp0-hg59.

[61] National Library of Medicine, “ClinicalTrials.gov: Trends and Charts on Registered Studies,” current.

[62] “Artificial Intelligence Applications in Health Care Practice: Scoping Review,” JMIR, 2022, doi: 10.2196/40238.

[63] “A Systematic Review and Meta-Analysis of Artificial Intelligence Tools in Medicine and Healthcare,” Diagnostics, 2024, doi: 10.3390/diagnostics14010109.

[64] “Artificial intelligence and decision-making in healthcare,” Health Services Research and Managerial Epidemiology, 2024, doi: 10.1177/23333928241234863.

[65] M. Abdallah, S. Nakken, M. Georges, et al., “TrialMatchAI: an end-to-end AI-powered clinical trial recommendation system to streamline patient-to-trial matching,” Nature Communications, 2026, vol. 17, p. 4472, doi: 10.1038/s41467-026-70509-w.
