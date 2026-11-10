/**
 * Screenlit Express Full Stack Server Entrypoint
 * Mounts server authoritative API routes and integrates Vite middleware in dev mode
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { CaseEngine } from './functions/caseEngine';
import { ScreenlitDatabase } from './functions/storage';
import { AILayer } from './functions/aiLayer';
import {
  ImpactSimulationEngine,
  SIMULATION_ASSUMPTIONS,
} from './functions/impactSimulation';
import { PatientFeelingLog } from './shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '20mb' }));

const db = ScreenlitDatabase.getInstance();

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    simulatedNow: db.getNow().toISOString(),
    demoClockOffsetHours: db.getDemoClockOffsetHours(),
  });
});

app.get('/api/cases', (req: Request, res: Response) => {
  const patientId = req.query.patientId as string | undefined;
  const cases = Array.from(db.collections.tasks.values()).filter((c) => {
    if (patientId && c.patientId !== patientId) {
      return false;
    }
    return true;
  });
  res.json({ cases });
});

app.get('/api/cases/:id', (req: Request, res: Response) => {
  const caseDoc = db.collections.tasks.get(req.params.id);
  if (!caseDoc) {
    res.status(404).json({ error: 'Case not found' });
    return;
  }
  const audits = Array.from(db.collections.auditEvents.values()).filter(
    (a) => a.entity?.[0]?.what?.reference === `Task/${caseDoc.id}`
  );
  res.json({ caseDoc, audits });
});

app.post('/api/cases/transition', (req: Request, res: Response) => {
  const result = CaseEngine.transitionCase(req.body, db);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

app.post('/api/cases/refer', (req: Request, res: Response) => {
  const result = CaseEngine.createReferral(req.body, db);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

app.post('/api/cases/reject-and-transfer', (req: Request, res: Response) => {
  const result = CaseEngine.rejectReferralAndTransfer(req.body, db);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

app.post('/api/cases/reopen', (req: Request, res: Response) => {
  const result = CaseEngine.reopenCaseForSurveillanceLapse(req.body, db);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

app.get('/api/observations', (req: Request, res: Response) => {
  const patientId = req.query.patientId as string | undefined;
  const observations = Array.from(db.collections.observations.values()).filter(
    (obs) => {
      if (patientId && obs.subject.reference !== `Patient/${patientId}`) {
        return false;
      }
      return true;
    }
  );
  res.json({ observations });
});

app.post('/api/observations', (req: Request, res: Response) => {
  const result = CaseEngine.ingestObservation(req.body, db);
  res.json(result);
});

app.post('/api/wearable/ingest', (req: Request, res: Response) => {
  const result = CaseEngine.ingestWearable(req.body, db);
  if (!result.success) {
    res.status(401).json(result);
    return;
  }
  res.json(result);
});

app.get('/api/patient/feelings', (req: Request, res: Response) => {
  const patientId = req.query.patientId as string | undefined;
  const feelings = Array.from(db.collections.patientFeelings.values())
    .filter((f) => !patientId || f.patientId === patientId)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  res.json({ feelings });
});

app.post('/api/patient/feelings', async (req: Request, res: Response) => {
  const {
    patientId = 'pat_tariq_001',
    caseId,
    feelingScore = 'good',
    feelingNote = '',
    tags = [],
    transcribedFromVoice = false,
    audioDurationSeconds = 0,
    voiceAudioUrl,
  } = req.body;

  const id = `feel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const record: PatientFeelingLog = {
    id,
    patientId,
    caseId,
    recordedAt: db.getNow().toISOString(),
    feelingScore,
    feelingNote,
    tags,
    transcribedFromVoice,
    audioDurationSeconds,
    voiceAudioUrl,
  };

  db.collections.patientFeelings.set(id, record);

  const auditId = `aud_feel_${Date.now()}`;
  db.collections.auditEvents.set(auditId, {
    resourceType: 'AuditEvent',
    id: auditId,
    type: {
      coding: [
        {
          system: 'http://dicom.nema.org/resources/ontology/DCM',
          code: '110106',
          display: 'Export',
        },
      ],
      text: 'Patient Symptom Checkin Recorded',
    },
    action: 'C',
    recorded: record.recordedAt,
    outcome: '0',
    outcomeDesc: `Patient well being check in logged: ${feelingScore.toUpperCase()}. ${feelingNote.slice(0, 70)}`,
    agent: [
      {
        who: { reference: `Patient/${patientId}`, display: 'Patient Self Log' },
        requestor: true,
      },
    ],
    source: { observer: { reference: 'Device/mobile_client' } },
    entity: caseId
      ? [{ what: { reference: `Task/${caseId}` }, description: 'Patient Well being Log' }]
      : undefined,
  });

  // Run AI multimodal symptom analysis
  const analysis = await AILayer.analyzeSymptomsAndVoice(
    {
      patientId,
      caseId,
      feelingScore,
      noteText: feelingNote,
      tags,
      transcribedFromVoice,
    },
    db
  );

  res.json({ success: true, feeling: record, analysis });
});

app.post('/api/ai/transcribe', async (req: Request, res: Response) => {
  const { audioBase64, mimeType = 'audio/webm' } = req.body;
  if (!audioBase64) {
    res.status(400).json({ error: 'Missing audio data' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI();
      const transcribePromise = ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: audioBase64,
            },
          },
          {
            text: 'Transcribe the patient spoken symptoms and check in note accurately into clear text. Do not provide diagnosis or clinical advice. Return only the transcription.',
          },
        ],
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Transcription timeout')), 3500)
      );

      const response: any = await Promise.race([transcribePromise, timeoutPromise]);
      const transcript = response.text || '';
      res.json({ transcript: transcript.trim() });
      return;
    } catch (err) {
      console.warn('Gemini audio transcription fallback engaged:', err);
    }
  }

  res.json({
    transcript: 'Feeling rested today. Taking blood pressure medication as scheduled and had a light morning walk.',
  });
});

app.get('/api/demo/clock', (_req: Request, res: Response) => {
  res.json({
    simulatedNow: db.getNow().toISOString(),
    offsetHours: db.getDemoClockOffsetHours(),
  });
});

app.post('/api/demo/clock', (req: Request, res: Response) => {
  const { advanceHours, setOffsetHours } = req.body;
  if (typeof advanceHours === 'number') {
    db.advanceDemoClock(advanceHours);
  } else if (typeof setOffsetHours === 'number') {
    db.setDemoClockOffset(setOffsetHours);
  }
  const sweep = CaseEngine.evaluateSlaAndEscalate(db);
  res.json({
    simulatedNow: db.getNow().toISOString(),
    offsetHours: db.getDemoClockOffsetHours(),
    sweep,
  });
});

app.get('/api/demo/outbox', (_req: Request, res: Response) => {
  const outbox = Array.from(db.collections.outbox.values());
  res.json({ outbox });
});

app.get('/api/demo/audits', (_req: Request, res: Response) => {
  const audits = Array.from(db.collections.auditEvents.values());
  res.json({ audits });
});

app.get('/api/demo/users', (_req: Request, res: Response) => {
  const users = Array.from(db.collections.users.values());
  res.json({ users });
});

app.post('/api/users/register', (req: Request, res: Response) => {
  const { uid, email, displayName, role, language, linkedPatientId, organizationId } = req.body;

  if (!uid || !email || !displayName || !role) {
    res.status(400).json({ error: 'Missing required user fields' });
    return;
  }

  // Upsert user profile into in-memory store
  const now = db.getNow().toISOString();
  const userProfile = {
    uid,
    email,
    displayName,
    role,
    language: language || 'en',
    linkedPatientId: linkedPatientId || (role === 'patient' || role === 'caregiver' ? `pat_${uid.substring(0, 12)}` : undefined),
    organizationId: organizationId || 'org_alamal_clinic',
    createdAt: now,
    updatedAt: now,
  };
  db.collections.users.set(uid, userProfile);

  // For patient and caregiver roles, create a FHIR Patient and seed a ResultIssued case
  if (role === 'patient' || role === 'caregiver') {
    const patientId = userProfile.linkedPatientId!;

    // Create FHIRPatient if not already present
    if (!db.collections.patients.has(patientId)) {
      db.collections.patients.set(patientId, {
        resourceType: 'Patient',
        id: patientId,
        active: true,
        name: [{ text: displayName, given: [displayName.split(' ')[0]], family: displayName.split(' ').slice(1).join(' ') || '' }],
        telecom: [{ system: 'email', value: email }],
        communication: [{ language: { text: language || 'en' }, preferred: true }],
        generalPractitioner: [{ reference: 'Practitioner/prac_dr_amina' }],
        managingOrganization: { reference: `Organization/${organizationId || 'org_alamal_clinic'}` },
      });

      // Create a default active consent
      const consentId = `${patientId}_${organizationId || 'org_alamal_clinic'}`;
      db.collections.consents.set(consentId, {
        resourceType: 'Consent',
        id: consentId,
        status: 'active',
        scope: { text: 'Clinical coordination data sharing' },
        category: [{ text: 'Care coordination' }],
        patient: { reference: `Patient/${patientId}`, type: 'Patient' },
        organization: [{ reference: `Organization/${organizationId || 'org_alamal_clinic'}` }],
        provision: { type: 'permit' },
      });

      // Ingest a default actionable screening observation to create a case
      const result = CaseEngine.ingestObservation(
        {
          patientId,
          systolic: 148,
          diastolic: 94,
          performerId: 'prac_coord_fatima',
          performerRole: 'coordinator',
          noteText: `Initial registration screening reading for ${displayName}`,
        },
        db
      );

      res.json({ success: true, userProfile, caseCreated: result.caseCreated, caseId: result.caseId });
      return;
    }
  }

  res.json({ success: true, userProfile, caseCreated: false });
});

app.get('/api/ai/outputs', (_req: Request, res: Response) => {
  const outputs = Array.from(db.collections.aiOutputs.values());
  res.json({ outputs });
});

app.post('/api/ai/override', (req: Request, res: Response) => {
  const { outputId, overriddenBy, overrideNote } = req.body;
  const result = AILayer.overrideAIOutput(
    outputId,
    overriddenBy,
    overrideNote,
    db
  );
  if (!result.success) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

app.post('/api/ai/analyze-symptoms', async (req: Request, res: Response) => {
  try {
    const analysis = await AILayer.analyzeSymptomsAndVoice(req.body, db);
    res.json({ success: true, analysis });
  } catch (err) {
    console.error('Failed to run AI symptom analysis:', err);
    res.status(500).json({ error: 'AI analysis service temporarily unavailable' });
  }
});

app.get('/api/simulation/latest', (_req: Request, res: Response) => {
  let latest = Array.from(db.collections.simulationRuns.values()).pop();
  if (!latest) {
    latest = ImpactSimulationEngine.runSimulation(2000, 30, db);
  }
  res.json({ simulation: latest });
});

app.post('/api/simulation/run', (req: Request, res: Response) => {
  const { cohortSize = 2000, replicationsCount = 50 } = req.body;
  const result = ImpactSimulationEngine.runSimulation(
    cohortSize,
    replicationsCount,
    db
  );
  res.json({ simulation: result });
});

app.get('/api/simulation/assumptions', (_req: Request, res: Response) => {
  res.json({ assumptions: SIMULATION_ASSUMPTIONS });
});

async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Screenlit server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Screenlit server:', err);
  process.exit(1);
});
