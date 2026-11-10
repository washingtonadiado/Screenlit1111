/**
 * Screenlit Patient Feeling and Symptom Journal Tests
 * Validates storage, retrieval, and transcription capabilities
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import { describe, expect, it } from 'vitest';
import { ScreenlitDatabase } from '../functions/storage';
import { PatientFeelingLog } from '../shared/types';

describe('Patient Feeling and Symptom Journal', () => {
  it('seeds default patient feeling entries for surveillance monitoring', () => {
    const db = ScreenlitDatabase.getInstance();
    const feelings = Array.from(db.collections.patientFeelings.values());
    expect(feelings.length).toBeGreaterThanOrEqual(2);

    const tariqFeelings = feelings.filter((f) => f.patientId === 'pat_tariq_001');
    expect(tariqFeelings.length).toBeGreaterThanOrEqual(2);
    expect(tariqFeelings.some((f) => f.transcribedFromVoice)).toBe(true);
  });

  it('stores a newly logged patient feeling checkin with voice transcription metadata', () => {
    const db = ScreenlitDatabase.getInstance();
    const newLog: PatientFeelingLog = {
      id: 'feel_test_001',
      patientId: 'pat_tariq_001',
      caseId: 'task_case_001',
      recordedAt: new Date().toISOString(),
      feelingScore: 'good',
      feelingNote: 'Morning walk completed without shortness of breath or dizziness.',
      tags: ['Normal', 'Seated Rested'],
      transcribedFromVoice: true,
      audioDurationSeconds: 6,
    };

    db.collections.patientFeelings.set(newLog.id, newLog);
    const retrieved = db.collections.patientFeelings.get('feel_test_001');

    expect(retrieved).toBeDefined();
    expect(retrieved?.feelingScore).toBe('good');
    expect(retrieved?.transcribedFromVoice).toBe(true);
    expect(retrieved?.audioDurationSeconds).toBe(6);
    expect(retrieved?.tags).toContain('Normal');
  });

  it('preserves symptom tags and clinical context across feelings', () => {
    const db = ScreenlitDatabase.getInstance();
    const unwellLog: PatientFeelingLog = {
      id: 'feel_test_002',
      patientId: 'pat_tariq_001',
      caseId: 'task_case_001',
      recordedAt: new Date().toISOString(),
      feelingScore: 'unwell',
      feelingNote: 'Mild headache after skipping breakfast.',
      tags: ['Headache', 'Mild Dizziness'],
      transcribedFromVoice: false,
    };

    db.collections.patientFeelings.set(unwellLog.id, unwellLog);
    const found = db.collections.patientFeelings.get('feel_test_002');
    expect(found?.tags).toContain('Headache');
    expect(found?.feelingScore).toBe('unwell');
  });

  it('runs AI symptom and voice analysis and extracts clinical insights', async () => {
    const { AILayer } = await import('../functions/aiLayer');
    const db = ScreenlitDatabase.getInstance();

    const result = await AILayer.analyzeSymptomsAndVoice(
      {
        patientId: 'pat_tariq_001',
        caseId: 'task_case_001',
        feelingScore: 'unwell',
        noteText: 'Feeling slight dizziness and mild shoulder tightness after morning walk.',
        tags: ['Mild Dizziness', 'Shoulder Tension'],
        transcribedFromVoice: true,
      },
      db
    );

    expect(result).toBeDefined();
    expect(result.extractedSymptoms).toContain('Mild Dizziness');
    expect(result.extractedSymptoms).toContain('Shoulder Tension');
    expect(result.suggestedProbes.length).toBeGreaterThanOrEqual(2);
    expect(result.riskLevel).toBe('moderate');

    const log = db.collections.aiOutputs.get(result.aiOutputId);
    expect(log).toBeDefined();
    expect(log?.taskType).toBe('analyzeSymptoms');
  });

  it('detects red flag symptoms and raises clinical safety alert', async () => {
    const { AILayer } = await import('../functions/aiLayer');
    const db = ScreenlitDatabase.getInstance();

    const redFlagResult = await AILayer.analyzeSymptomsAndVoice(
      {
        patientId: 'pat_tariq_001',
        caseId: 'task_case_001',
        feelingScore: 'concerning',
        noteText: 'Experiencing sudden shortness of breath while seated.',
        tags: ['Shortness of Breath'],
        transcribedFromVoice: true,
      },
      db
    );

    expect(redFlagResult.redFlagAlert).toBe(true);
    expect(redFlagResult.riskLevel).toBe('high');
    expect(redFlagResult.redFlagReason).toBeDefined();
  });
});
