# Screenlit Security Specification and Threat Defense

## 1. System Invariants

* Invariant 1: Case State Authority. Clients cannot directly modify case documents in the `tasks` collection. Only server side Cloud Functions can transition case states.
* Invariant 2: Audit Immutability. The `auditEvents` collection is append only and strictly writable by authorized Cloud Functions or system coordinators. Once recorded, an audit event cannot be updated or deleted.
* Invariant 3: Consent Governed Staff Access. Clinical staff can only access a patient demographic or clinical record if the patient has granted an active FHIR Consent for their organization.
* Invariant 4: Patient Boundary. Patients and designated caregivers can only read their own records, observations, tasks, and communications.
* Invariant 5: Role Escalation Prevention. Users cannot alter their own `role` or `organizationId` in `/users/{userId}`.
* Invariant 6: AI Separation. AI generated outputs stored in `aiOutputs` are informational only. AI suggestions can be reviewed or overridden by human staff, and never directly mutate case state or lower risk levels.

## 2. The Dirty Dozen Adversarial Payloads

1. Ghost Field Injection: An attacker attempts to write an unexpected administrative field `isAdmin: true` into their user profile.
2. Self Assigned Physician Role: A patient attempts to update `/users/{uid}` with `role: "physician"`.
3. Client Side Case Closure: A client attempts to patch `/tasks/{caseId}` directly with `state: "Closed"` to bypass clinician verification.
4. Audit Log Deletion: An attacker attempts to delete `/auditEvents/{auditId}` to hide an unauthorized action.
5. Cross Patient Snoop: Patient A attempts to read `/observations/{obsId}` belonging to Patient B.
6. Unconsented Staff Access: A clinician from Organization X attempts to query patient records without an active consent linking Organization X to that patient.
7. Path Traversal ID Poisoning: An attacker attempts to create a document with an ID containing malicious path traversal strings or 2KB junk characters.
8. State Step Skipping: A user attempts to transition directly from `ResultIssued` to `Closed` bypassing intermediate confirmation and treatment.
9. Artificial Urgency Downgrade: A malicious client attempts to lower `isUrgent: true` to `false` on an active case.
10. Wearable Blood Pressure Spoof: An attacker attempts to submit a wristband reading as an official cuff blood pressure measurement.
11. PII Scraping Query: An unauthenticated actor attempts to execute an open query against `/patients` or `/users`.
12. Notification Outbox Tampering: An unauthorized user attempts to inject spam messages into `/outbox`.

## 3. Security Assertions

* Every read and write defaults to denied unless explicitly permitted.
* All document ID path variables are verified against length and regex guards.
* Role lookups verify the caller identity against `/users/$(request.auth.uid)`.
* Every state transition creates an audit event documenting the actor, timestamp, and clinical justification.
