# Screenlit

Population Health Screening to Care Coordination System
Future Health Digital Innovation Challenge: Closing the Screening to Care Loop

## Executive Summary

Screenlit is a mobile first web application and enterprise clinical coordination platform engineered to close the screening to care loop. Actionable screening results frequently fall through communication cracks before reaching clinical confirmation, physician referral, and sustained treatment. Screenlit ensures that every actionable screening result is communicated, confirmed, converted into care, and followed until documented closure, with a named owner at every step.

Post treatment monitoring continues using cellular home cuff readings and wearable signals. A case closes because care is working, not only because an appointment was attended.

## Primary and Secondary Clinical Pathways

* Primary Pathway: Hypertension screening with systolic blood pressure at or above 140 mmHg or diastolic blood pressure at or above 90 mmHg. Urgent threshold at or above 180 mmHg systolic or 110 mmHg diastolic routes immediately to physician review. Target control is below 140 over 90 mmHg across the surveillance window.
* Secondary Pathway: Colorectal cancer screening positive FIT result demonstrating condition agnostic architecture.
* Optional Maternal Scenario: Antenatal raised blood pressure screening at 32 weeks gestation.

## Hard Architectural Rules

* All cohort and clinical data is completely synthetic.
* Humans decide. AI only ranks, predicts, drafts, and summarizes. AI never closes a case, lowers an urgency set by a human, gives a diagnosis, or gives clinical advice.
* A case reaches Closed only through a server side check requiring attached clinical evidence and an electronic signature from an authorized clinician role. Clients can never write case state directly.
* Wearable flags are review prompts only, not clinical diagnoses. Blood pressure measurements come strictly from validated cuff readings entered by the patient or clinical team.
* Data structures conform to FHIR R4 shapes without claiming full compliance as an official FHIR server.
* In all user facing text, documentation, and code comments, punctuation never uses em dashes, en dashes, or hyphens.

## System Architecture and Data Flow

Screenlit couples a client application with a server authoritative state engine and FHIR R4 document store.

### End to End Architecture Flow

1. Screening Ingestion:
Community pop up clinics, laboratory feeds, or patient entries post actionable observations.

2. Server Authoritative State Engine:
Cloud Functions evaluate clinical thresholds, compute initial risk scores, initialize SLA timers, and create a FHIR Task.

3. Role Based Client Experience:
* Patient Portal (`/app`): Mobile first experience supporting English, Arabic with native right to left layout, and Swahili. Includes 1 question understanding checks, home reading logs, wearable status, care plans, and granular consent toggles.
* Command Centre (`/staff`): Desktop clinical coordination suite with prioritized queues, interactive SLA demo clock, case timeline with event citations, closure checklist modal, audit log, outbox inspector, and population health impact simulation.

4. Surveillance and Controlled Closure:
Patients log follow up readings via home cuffs. Closed status is unlocked only when evidence criteria (acknowledgement, treatment start, three consecutive controlled readings) and clinician signature are validated server side.

## Regional Middle East Data Sovereignty and Residency

Healthcare regulations across the Gulf Cooperation Council (including Qatar National Health Strategy, UAE Federal Law No. 2 of 2019, and Saudi Arabia Cloud Computing Regulatory Framework) mandate sovereign storage of patient health information within national borders.

Screenlit is architected for sovereign cloud hosting:
* Primary Cloud Region: Google Cloud region `me-central1` located in Doha, Qatar.
* Disaster Recovery Pairing: Google Cloud region `me-central2` located in Dammam, Saudi Arabia.
* Sovereign Enclave: All patient identifiers, observations, communications, and consent records reside strictly within this geographic perimeter.
* Zero Cross Border Egress: No identifiable clinical data traverses external endpoints. AI services operate in local template mode by default or communicate through regional in enclave models.

## Hardened Security and Threat Defense

Screenlit defends against the Dirty Dozen adversarial security payloads through layered zero trust controls:

1. Server Authoritative State Machine:
Case state transitions can only be invoked through the `transitionCase` Cloud Function. Firestore rules block all client side writes to `/tasks` and `/auditEvents`.

2. Consent Enforced Access:
Access to patient clinical records requires active consent linking the patient to the requesting organization.

3. Strict Input Sanitization and Role Verification:
Firebase Authentication custom claims determine user roles. All incoming payloads pass structural schema validation and bounds checks.

4. Tamper Evident Audit Logging:
Every state modification, referral, provider transfer, wearable ingestion, and clinician override generates an immutable `AuditEvent` recording actor, action, timestamp, and justification.

## Responsible AI Safeguards

Screenlit adheres to strict responsible AI guidelines for healthcare:

1. Deterministic Template Mode Default:
Operates out of the box with zero external API dependencies and zero third party network calls.

2. Transparent Logistic Case Ranking:
Ranks coordination queues using transparent logistic coefficients and displays the top 3 contributing risk factors directly in the staff UI.

3. Safe Patient Communication Drafting:
Message drafting algorithms enforce strict safety rules blocking any diagnostic claims, prescribing suggestions, or clinical advice.

4. Evidence Cited Consult Handoff Summaries:
Every generated consult handoff summary sentence cites an immutable event identifier such as `[EVT-01]`, providing instant verification back to primary clinical records.

5. Human Clinician Overrides:
Every AI generated score or draft can be overridden by clinical staff with mandatory clinical rationale logged in the `aiOutputs` collection.

## Demo Accounts for Every Role

Screenlit provides ready to use synthetic demo credentials covering all six system roles:

1. Patient:
* Name: Tariq Al Mahmoud
* Role: `patient`
* Language: Arabic (`ar`)
* Email: `tariq.patient@screenlit.health`
* Context: Stage 2 hypertension screening reading requiring confirmation and navigation.

2. Caregiver:
* Name: Zainab Al Mahmoud
* Role: `caregiver`
* Language: Arabic (`ar`)
* Email: `zainab.caregiver@screenlit.health`
* Context: Family caregiver with delegated access to Tariq Al Mahmoud.

3. Care Coordinator:
* Name: Fatima Noor, RN
* Role: `coordinator`
* Language: English (`en`)
* Email: `coordinator.fatima@screenlit.health`
* Context: Primary care coordinator managing queues, outreach tasks, and referrals.

4. Attending Physician:
* Name: Dr. Amina Al Mansoor
* Role: `physician`
* Language: English (`en`)
* Email: `dr.amina@screenlit.health`
* Context: Family medicine physician overseeing clinical plans and signing off case closures.

5. Consulting Specialist:
* Name: Dr. David Mwangi
* Role: `specialist`
* Language: Swahili (`sw`)
* Email: `dr.mwangi@screenlit.health`
* Context: Cardiologist receiving referrals, conducting consults, and adjusting complex therapies.

6. System Administrator:
* Name: Hassan Al Kuwari
* Role: `admin`
* Language: English (`en`)
* Email: `admin.hassan@screenlit.health`
* Context: Health system administrator auditing security logs and configuring clinical thresholds.

## Step by Step Demo Walkthrough Script for Judges

To evaluate Screenlit in the live preview environment, follow this test workflow:

### Step 1: Explore the Patient Mobile Application (`/app`)
1. Click the Patient button in the top navigation header.
2. Observe the next step action card instructing the patient to review their recent screening result.
3. Switch language to Arabic using the language selector. Observe full right to left layout transformation and bilingual clinical terminology.
4. Switch to Swahili to observe East African community accessibility. Switch back to English or Arabic.
5. Navigate to Result Explainer and proceed to Acknowledge. Note the mandatory 1 question comprehension check required before acknowledgement can be submitted.
6. Check the Home Reading Log, Wearable Status (noting the prominent non diagnostic disclaimer), Care Plan, and Privacy Consent view where organization data sharing can be revoked.

### Step 2: Explore the Clinical Command Centre (`/staff`)
1. Click the Command Centre button in the top navigation header.
2. Notice the live Demo Clock bar at the top displaying simulated clinic time.
3. Review the Active Cases queue. Observe transparent risk scores and the top 3 contributing factors displayed for each patient.
4. Click on Tariq Al Mahmoud to open the Case Timeline view. Notice chronological milestones, owner assignment, and the consult handoff summary with primary event citations like `[EVT-01]`.

### Step 3: Test Interactive Case Closure with Evidence Checklist
1. In the Case Timeline, click the Close Case button to open the Closure Modal.
2. Observe the four server enforced closure requirements: patient acknowledgement on record, treatment initiation documented, three consecutive controlled readings below 140 over 90, and clinician electronic signature.
3. Notice that the Submit Closure button remains disabled until all evidence requirements are met and a valid clinician signature note is entered.

### Step 4: Test Time Fast Forward and SLA Escalations
1. In the Demo Clock bar, click the +48h SLA Breach button.
2. Click Refresh SLA Status or navigate to Queues.
3. Switch to the Overdue queue. Observe that unacknowledged cases have automatically transitioned to Overdue status and triggered coordinator outreach alerts in the Outbox.

### Step 5: Execute 1 Click Clinical Scenarios
1. Click the Scenario Runner tab in the Command Centre.
2. Run Scenario 1 (Happy Path to Closure): Watch a case progress from screening to verified clinician sign off.
3. Run Scenario 2 (Overdue Escalation): Watch automated reminders escalate to phone outreach.
4. Run Scenario 3 (Referral Rejection and Transfer): Watch a specialist decline an out of network referral, followed by provider reassignment preserving full audit history.
5. Run Scenario 4 (Surveillance Lapse and Wearable Spike): Watch a closed case reopen when readings lapse, followed by a non diagnostic wearable heart rate review alert.
6. Run Scenario 5 (AI Fallback Mode): Verify that the system executes deterministically with zero external API dependencies.

### Step 6: Review the Population Health Impact Simulation Dashboard
1. Click the Population Health tab in the Command Centre.
2. Observe the permanent prominent notice: *Simulated results, not clinical evidence.*
3. Review the Recharts retention funnel comparing standard uncoordinated care drop offs against Screenlit navigation.
4. Review the Delay Comparison charts and 9 key performance indicator cards with 5th, 50th, and 95th percentiles.
5. Click View Model Assumptions to inspect the documented clinical literature citations underpinning each parameter.
6. Click Audit AI Outputs to view logged AI predictions and test the human clinician override modal.

## Judging Criteria Alignment Checklist

### 1. Health Impact
* Closes the critical screening to care loop for hypertension and secondary conditions.
* Extends monitoring beyond appointment attendance through home cuff readings and wearable prompts.
* Simulates population outcomes across 2,000 synthetic adults, demonstrating dramatic reductions in 90 day lost to follow up rates.

### 2. Technical Depth
* Full stack TypeScript architecture with React 19, Express, Vite, and Cloud Functions.
* FHIR R4 conformant document model across 19 collections.
* Zero trust Firestore security rules with client write blocking on sensitive collections.
* Mathematical Monte Carlo simulation engine computing empirical percentiles.

### 3. Working Demo
* Fully interactive mobile and desktop web application running in AI Studio preview.
* 1 click Scenario Runner executing 5 comprehensive clinical pathways.
* Live Demo Clock enabling real time SLA testing without waiting days for expirations.

### 4. Responsible AI and Data Governance
* Strict human in the loop governance: AI never diagnoses, prescribes, or closes cases.
* Safe drafting filters preventing diagnostic claims.
* Event cited consult summaries anchoring every sentence to immutable records.
* Sovereign Middle East data residency anchored in Google Cloud Doha, Qatar (`me-central1`).

### 5. Scalability
* Condition agnostic state engine readily accommodating hypertension, colorectal cancer, and maternal health.
* Modular Cloud Functions architecture with scale to zero serverless efficiency.
* Standardized FHIR resource structures facilitating interoperability with hospital electronic health records.

### 6. Commercial Viability
* Aligned with value based care payment models and health insurance loss ratio reduction.
* Fulfills clinical quality and patient follow up accreditation requirements (such as JCI and CBAHI).
* Multilingual support (English, Arabic RTL, Swahili) opening immediate deployment across GCC, Middle East, and East African healthcare markets.

## Test Suite Execution

Screenlit maintains 53 unit and integration tests covering all six development phases:

```bash
npx vitest run
```

Test coverage includes:
* `tests/phase0.test.ts`: Shared state machine transitions, FHIR builders, SLA configurations
* `tests/phase1.test.ts`: Data model security rules, Dirty Dozen threat defenses, invariant checks
* `tests/phase2.test.ts`: Server authoritative case engine, Cloud Functions, Scenarios 1 through 4
* `tests/phase3.test.ts`: Localization dictionaries, RTL layout rules, consent revocation logic
* `tests/phase4.test.ts`: Command centre queue filters, demo clock advancement, closure prerequisites
* `tests/phase5.test.ts`: Multi provider AI layer, safe drafting filters, Monte Carlo simulation
* `tests/phase6.test.ts`: Clinical seed bundle integrity, multi role demo accounts, sovereign region config

## Build and Compilation Verification

```bash
npm run build
```

The production bundle builds cleanly via Vite in under 2 seconds.
