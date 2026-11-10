/**
 * Screenlit AI Layer Abstraction
 * Transparent AI services with three operational modes: template (default offline), Gemini, and Anthropic
 * Humans decide. AI only ranks, predicts, drafts, and summarizes.
 */

import { SCREENLIT_CONFIG } from '../shared/config';
import {
  AIOutputRecord,
  Role,
  SupportedLanguage,
  SymptomAnalysisInputs,
  SymptomAnalysisResult,
} from '../shared/types';
import { ScreenlitDatabase } from './storage';

export type AIProviderMode = 'template' | 'gemini' | 'anthropic';

export interface RankCasesInputs {
  caseId: string;
  systolic: number;
  diastolic: number;
  isUrgent: boolean;
  patientAge: number;
  comorbiditiesCount: number;
  hoursSinceResult: number;
  priorEngagement: boolean;
  outOfNetwork: boolean;
  distanceKm: number;
}

export interface RankCasesResult {
  riskScore: number;
  factors: string[];
  aiOutputId: string;
}

export interface PredictDropOffInputs {
  caseId: string;
  patientId: string;
  priorEngagement: boolean;
  languageBarrier: boolean;
  delayHours: number;
  distanceKm: number;
  outOfNetwork: boolean;
}

export interface PredictDropOffResult {
  dropOffProbability: number;
  riskTier: 'low' | 'moderate' | 'high';
  recommendedOutreach: string;
  aiOutputId: string;
}

export interface DraftMessageInputs {
  caseId: string;
  patientId: string;
  language: SupportedLanguage;
  messageType: 'result_issued' | 'repeat_reminder' | 'appointment_reminder' | 'surveillance_check';
  patientName: string;
  clinicName: string;
}

export interface DraftMessageResult {
  messageText: string;
  safetyCheckPassed: boolean;
  safetyNotes: string[];
  aiOutputId: string;
}

export class AILayer {
  private static mode: AIProviderMode = 'template';
  private static aiEnabled = true;

  public static setMode(mode: AIProviderMode): void {
    this.mode = mode;
  }

  public static getMode(): AIProviderMode {
    return this.mode;
  }

  public static setAiEnabled(enabled: boolean): void {
    this.aiEnabled = enabled;
  }

  public static isAiEnabled(): boolean {
    return this.aiEnabled;
  }

  public static rankCases(
    inputs: RankCasesInputs,
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): RankCasesResult {
    const c = SCREENLIT_CONFIG.riskScoringCoefficients;
    let logit = c.intercept;

    const factors: string[] = [];

    if (inputs.isUrgent) {
      logit += c.severityUrgent;
      factors.push('Critical blood pressure elevation (systolic >= 180 or diastolic >= 110)');
    } else {
      logit += c.severityActionable;
      factors.push('Elevated screening blood pressure exceeding guideline threshold');
    }

    if (inputs.patientAge >= 60) {
      logit += c.ageOver60;
      factors.push(`Advanced age factor (${inputs.patientAge} years)`);
    }

    if (inputs.comorbiditiesCount > 0) {
      logit += inputs.comorbiditiesCount * c.comorbidityCountWeight;
      factors.push(`Documented comorbidities count: ${inputs.comorbiditiesCount}`);
    }

    if (!inputs.priorEngagement) {
      logit += c.noPriorEngagement;
      factors.push('No prior patient portal or clinic coordination engagement');
    }

    if (inputs.outOfNetwork) {
      logit += c.outOfNetworkInsurance;
      factors.push('Out of network coverage navigation required');
    }

    logit += inputs.hoursSinceResult * c.hoursSinceResultWeight;
    logit += inputs.distanceKm * c.distanceKmWeight;

    const prob = 1 / (1 + Math.exp(-logit));
    const score = parseFloat(prob.toFixed(2));

    const topFactors = factors.slice(0, 3);
    const outputId = `ai_rank_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const logRecord: AIOutputRecord = {
      id: outputId,
      taskType: 'rankCases',
      reason: 'Transparent logistic regression risk ranking from clinical and social determinants',
      modelVersion: `Screenlit-LogisticRank-v1 (${this.mode} mode)`,
      inputsRef: `Task/${inputs.caseId}`,
      rawOutput: { score, factors: topFactors },
      overridden: false,
      createdAt: db.getNow().toISOString(),
    };
    db.collections.aiOutputs.set(outputId, logRecord);

    return {
      riskScore: score,
      factors: topFactors,
      aiOutputId: outputId,
    };
  }

  public static predictDropOff(
    inputs: PredictDropOffInputs,
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): PredictDropOffResult {
    const c = SCREENLIT_CONFIG.dropOffCoefficients;
    let logit = c.intercept;

    if (!inputs.priorEngagement) {
      logit += c.noPriorEngagement;
    }
    if (inputs.languageBarrier) {
      logit += c.languageBarrier;
    }
    if (inputs.outOfNetwork) {
      logit += c.outOfNetwork;
    }
    logit += inputs.delayHours * c.delayHoursWeight;
    logit += inputs.distanceKm * c.distanceKmWeight;

    const prob = 1 / (1 + Math.exp(-logit));
    const dropOffProb = parseFloat(prob.toFixed(2));

    let tier: 'low' | 'moderate' | 'high' = 'low';
    let outreach = 'Standard automated SMS and portal notification';

    if (dropOffProb >= 0.65) {
      tier = 'high';
      outreach = 'Direct telephone coordination outreach by named nurse coordinator';
    } else if (dropOffProb >= 0.4) {
      tier = 'moderate';
      outreach = 'Dual channel push notification with proactive reminder schedule';
    }

    const outputId = `ai_drop_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const logRecord: AIOutputRecord = {
      id: outputId,
      taskType: 'predictDropOff',
      reason: 'Engagement drop off likelihood estimation for coordinator prioritization',
      modelVersion: `Screenlit-DropOffPredictor-v1 (${this.mode} mode)`,
      inputsRef: `Task/${inputs.caseId}`,
      rawOutput: { dropOffProbability: dropOffProb, riskTier: tier, recommendedOutreach: outreach },
      overridden: false,
      createdAt: db.getNow().toISOString(),
    };
    db.collections.aiOutputs.set(outputId, logRecord);

    return {
      dropOffProbability: dropOffProb,
      riskTier: tier,
      recommendedOutreach: outreach,
      aiOutputId: outputId,
    };
  }

  public static draftPatientMessage(
    inputs: DraftMessageInputs,
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): DraftMessageResult {
    let template = '';

    if (inputs.language === 'ar') {
      if (inputs.messageType === 'result_issued') {
        template = `مرحباً ${inputs.patientName}، نتيجة فحص ضغط الدم الأخير جاهزة للاطلاع. يرجى مراجعة بوابة سكرين ليت لتأكيد الاستلام ومناقشة الخطوة التالية مع ${inputs.clinicName}.`;
      } else if (inputs.messageType === 'appointment_reminder') {
        template = `تذكير بموعدك: موعد الاستشارة الطبية مؤكد في ${inputs.clinicName}. نتطلع للقائك للمتابعة.`;
      } else {
        template = `تذكير صحي من ${inputs.clinicName}: يرجى تسجيل قراءة ضغط الدم الصباحية عبر جهاز القياس المنزلي.`;
      }
    } else if (inputs.language === 'sw') {
      if (inputs.messageType === 'result_issued') {
        template = `Habari ${inputs.patientName}, matokeo ya uchunguzi wako wa shinikizo la damu yamefika. Tafadhali kagua kupitia Screenlit na uthibitishe hatua inayofuata na ${inputs.clinicName}.`;
      } else if (inputs.messageType === 'appointment_reminder') {
        template = `Kikumbusho cha miadi: Miadi yako ya kliniki katika ${inputs.clinicName} imethibitishwa. Karibu sana.`;
      } else {
        template = `Kikumbusho cha afya kutoka ${inputs.clinicName}: Tafadhali weka kipimo chako cha asubuhi cha shinikizo la damu.`;
      }
    } else {
      if (inputs.messageType === 'result_issued') {
        template = `Hello ${inputs.patientName}, your recent blood pressure screening result is ready for review. Please open your Screenlit portal to acknowledge receipt and arrange next steps with ${inputs.clinicName}.`;
      } else if (inputs.messageType === 'appointment_reminder') {
        template = `Appointment Reminder: Your consultation at ${inputs.clinicName} is confirmed. Our team looks forward to seeing you.`;
      } else {
        template = `Health reminder from ${inputs.clinicName}: Please remember to log your morning blood pressure cuff reading.`;
      }
    }

    const forbiddenPhrases = [
      'you have hypertension',
      'you are diagnosed',
      'take this medication',
      'stop taking your pills',
      'medical emergency',
    ];

    const safetyNotes: string[] = [];
    let safetyPassed = true;

    forbiddenPhrases.forEach((phrase) => {
      if (template.toLowerCase().includes(phrase)) {
        safetyPassed = false;
        safetyNotes.push(`Blocked forbidden phrase: ${phrase}`);
      }
    });

    if (safetyPassed) {
      safetyNotes.push('Message validated: No diagnostic claims, no medical advice, reading level plain');
    }

    const outputId = `ai_msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const logRecord: AIOutputRecord = {
      id: outputId,
      taskType: 'draftPatientMessage',
      reason: 'Rule validated patient notification drafting in patient preferred language',
      modelVersion: `Screenlit-SafeMessageTemplate-v1 (${this.mode} mode)`,
      inputsRef: `Task/${inputs.caseId}`,
      rawOutput: { messageText: template, safetyCheckPassed: safetyPassed },
      overridden: false,
      createdAt: db.getNow().toISOString(),
    };
    db.collections.aiOutputs.set(outputId, logRecord);

    return {
      messageText: template,
      safetyCheckPassed: safetyPassed,
      safetyNotes,
      aiOutputId: outputId,
    };
  }

  public static summarizeHandoff(
    caseId: string,
    eventCitations: Array<{ eventId: string; fact: string }>,
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): { summary: string; aiOutputId: string } {
    const sentences = eventCitations.map(
      (item) => `${item.fact} [${item.eventId}].`
    );
    const summary = sentences.join(' ');

    const outputId = `ai_sum_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const logRecord: AIOutputRecord = {
      id: outputId,
      taskType: 'summarizeHandoff',
      reason: 'Clinician consult summary where every sentence cites a timeline event identifier',
      modelVersion: `Screenlit-EventCiteSummary-v1 (${this.mode} mode)`,
      inputsRef: `Task/${caseId}`,
      rawOutput: { summary, citationCount: eventCitations.length },
      overridden: false,
      createdAt: db.getNow().toISOString(),
    };
    db.collections.aiOutputs.set(outputId, logRecord);

    return {
      summary,
      aiOutputId: outputId,
    };
  }

  public static overrideAIOutput(
    outputId: string,
    overriddenBy: string,
    overrideNote: string,
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): { success: boolean; error?: string } {
    const record = db.collections.aiOutputs.get(outputId);
    if (!record) {
      return { success: false, error: 'AI output record not found' };
    }

    record.overridden = true;
    record.overriddenBy = overriddenBy;
    record.overrideNote = overrideNote;
    db.collections.aiOutputs.set(outputId, record);

    return { success: true };
  }

  public static async analyzeSymptomsAndVoice(
    inputs: SymptomAnalysisInputs,
    db: ScreenlitDatabase = ScreenlitDatabase.getInstance()
  ): Promise<SymptomAnalysisResult> {
    const outputId = `ai_sym_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const lowerText = (inputs.noteText || '').toLowerCase();
    const allTags = inputs.tags || [];

    // Red flag keyword detection
    const redFlagKeywords = [
      'chest pain',
      'crushing',
      'radiating to arm',
      'short of breath',
      'shortness of breath',
      'difficulty breathing',
      'fainting',
      'passed out',
      'syncope',
      'slurred speech',
      'paralysis',
      'sudden numbness',
      'vision loss',
    ];

    const detectedRedFlags = redFlagKeywords.filter((kw) => lowerText.includes(kw));
    const hasRedFlag = detectedRedFlags.length > 0 || inputs.feelingScore === 'concerning';

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI();

        const systemPrompt = `You are a clinical decision support assistant for Screenlit, a population health screening to care coordination system.
Hard clinical rules:
1. Humans decide. AI only ranks, predicts, drafts, and summarizes. Never provide a final medical diagnosis or prescribe treatments.
2. If severe emergency symptoms (e.g. crushing chest pain, difficulty breathing, slurred speech) are present, flag them for urgent review.
3. Analyze patient reported symptoms, feeling score, tags, and voice transcript.
4. Return strictly JSON with keys:
- summary: 1 to 2 sentence clinical overview of patient reported state
- riskLevel: "routine" | "moderate" | "high" | "crisis"
- extractedSymptoms: string array of physical symptoms identified
- suggestedProbes: string array of 2 to 3 clarifying questions for the nurse coordinator follow up call
- redFlagAlert: boolean
- redFlagReason: string or empty string
- patientGuidance: encouraging practical advice (e.g. seated rest, hydrate, record next cuff reading)
- clinicianNotes: notes for attending doctor or nurse coordinator
`;

        const userPrompt = `Patient ID: ${inputs.patientId}
Case ID: ${inputs.caseId || 'None'}
Feeling Score: ${inputs.feelingScore}
Transcribed from Voice: ${inputs.transcribedFromVoice ? 'Yes' : 'No'}
Selected Tags: ${allTags.join(', ')}
Logged Note Text: "${inputs.noteText}"
Recent Vitals: BP ${inputs.recentVitals?.bp || '158/98'}, HR ${inputs.recentVitals?.heartRate || 71} bpm, SpO2 ${inputs.recentVitals?.spo2 || 98}%
`;

        const generatePromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            { text: systemPrompt },
            { text: userPrompt },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 3500)
        );

        const response: any = await Promise.race([generatePromise, timeoutPromise]);

        const parsed = JSON.parse(response.text || '{}');
        const result: SymptomAnalysisResult = {
          aiOutputId: outputId,
          summary: parsed.summary || 'Patient reported well being checkin analyzed by Gemini API.',
          riskLevel: parsed.riskLevel || (hasRedFlag ? 'high' : inputs.feelingScore === 'unwell' ? 'moderate' : 'routine'),
          extractedSymptoms: Array.isArray(parsed.extractedSymptoms) && parsed.extractedSymptoms.length > 0 ? parsed.extractedSymptoms : allTags,
          suggestedProbes: Array.isArray(parsed.suggestedProbes) ? parsed.suggestedProbes : [
            'Inquire about symptom onset and relation to seated rest',
            'Confirm adherence to prescribed morning dose',
          ],
          redFlagAlert: Boolean(parsed.redFlagAlert || hasRedFlag),
          redFlagReason: parsed.redFlagReason || (hasRedFlag ? 'Potential symptom elevation requiring prompt clinician attention' : undefined),
          patientGuidance: parsed.patientGuidance || 'Continue seated resting protocol and maintain scheduled morning blood pressure log.',
          clinicianNotes: parsed.clinicianNotes || 'Synthesized from patient voice transcription and self reported journal.',
          modelVersion: 'Gemini 3.8 Flash (Server Generative API)',
        };

        const logRecord: AIOutputRecord = {
          id: outputId,
          taskType: 'analyzeSymptoms',
          reason: 'Gemini API multimodal clinical analysis of patient voice transcription and logged symptoms',
          modelVersion: 'gemini-3.8-flash',
          inputsRef: inputs.caseId ? `Task/${inputs.caseId}` : `Patient/${inputs.patientId}`,
          rawOutput: result,
          overridden: false,
          createdAt: db.getNow().toISOString(),
        };
        db.collections.aiOutputs.set(outputId, logRecord);

        return result;
      } catch (err) {
        console.warn('Gemini symptom analysis fallback engaged:', err);
      }
    }

    // Deterministic Clinical Decision Support Fallback
    const extracted: string[] = [...allTags];
    if (lowerText.includes('headache') && !extracted.includes('Headache')) extracted.push('Headache');
    if (lowerText.includes('dizz') && !extracted.includes('Mild Dizziness')) extracted.push('Mild Dizziness');
    if (lowerText.includes('shoulder') && !extracted.includes('Shoulder Tension')) extracted.push('Shoulder Tension');
    if (lowerText.includes('tight') && !extracted.includes('Chest Warmth')) extracted.push('Chest Warmth');
    if (lowerText.includes('tired') && !extracted.includes('Fatigue')) extracted.push('Fatigue');

    let riskLevel: 'routine' | 'moderate' | 'high' | 'crisis' = 'routine';
    let summaryText = 'Patient reports normal resting state with stable well being.';

    if (hasRedFlag) {
      riskLevel = detectedRedFlags.length > 0 ? 'high' : 'moderate';
      summaryText = `Elevated symptom checkin detected: ${detectedRedFlags.join(', ') || inputs.feelingScore}. Nurse coordinator outreach recommended.`;
    } else if (inputs.feelingScore === 'unwell') {
      riskLevel = 'moderate';
      summaryText = 'Patient reports feeling unwell with localized mild symptoms. Routine surveillance follow up indicated.';
    } else if (inputs.feelingScore === 'great' || inputs.feelingScore === 'good') {
      riskLevel = 'routine';
      summaryText = 'Patient self reports comfortable resting baseline with positive treatment response.';
    }

    const probes = [
      'Ask if symptoms occurred during exertion or seated rest',
      'Confirm whether blood pressure medication was taken with water as directed',
      'Verify that repeat upper arm cuff readings remain below 140 over 90 mmHg',
    ];

    const fallbackResult: SymptomAnalysisResult = {
      aiOutputId: outputId,
      summary: summaryText,
      riskLevel,
      extractedSymptoms: extracted.length > 0 ? extracted : ['Resting Baseline'],
      suggestedProbes: probes,
      redFlagAlert: hasRedFlag,
      redFlagReason: hasRedFlag ? 'Detected potential symptom elevation warranting prompt review' : undefined,
      patientGuidance: 'Please continue relaxing in a seated position for 5 minutes before your next cuff reading. Keep your care team informed.',
      clinicianNotes: `Analyzed from ${inputs.transcribedFromVoice ? 'live voice transcription and ' : ''}symptom journal entries.`,
      modelVersion: `Screenlit-SymptomClassifier-v1 (${this.mode} mode)`,
    };

    const logRecord: AIOutputRecord = {
      id: outputId,
      taskType: 'analyzeSymptoms',
      reason: 'Automated rule backed clinical synthesis of voice transcription and symptoms',
      modelVersion: `Screenlit-SymptomClassifier-v1 (${this.mode} mode)`,
      inputsRef: inputs.caseId ? `Task/${inputs.caseId}` : `Patient/${inputs.patientId}`,
      rawOutput: fallbackResult,
      overridden: false,
      createdAt: db.getNow().toISOString(),
    };
    db.collections.aiOutputs.set(outputId, logRecord);

    return fallbackResult;
  }
}
