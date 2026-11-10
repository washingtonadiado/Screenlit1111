/**
 * Screenlit Cloud Functions Entrypoint
 * Callable and HTTPS endpoints for mobile client and clinical command centre
 */

import { CaseEngine } from './caseEngine';
import { ScreenlitDatabase } from './storage';
import {
  CreateReferralRequest,
  IngestObservationRequest,
  TransitionCaseRequest,
  WearableIngestPayload,
} from './types';

export const transitionCaseCallable = async (
  data: TransitionCaseRequest,
  context?: { auth?: { uid: string } }
) => {
  const db = ScreenlitDatabase.getInstance();
  const callerUid = context?.auth?.uid || data.actorUid;
  return CaseEngine.transitionCase(
    {
      ...data,
      actorUid: callerUid,
    },
    db
  );
};

export const ingestObservationCallable = async (
  data: IngestObservationRequest,
  context?: { auth?: { uid: string } }
) => {
  const db = ScreenlitDatabase.getInstance();
  return CaseEngine.ingestObservation(data, db);
};

export const createReferralCallable = async (
  data: CreateReferralRequest,
  context?: { auth?: { uid: string } }
) => {
  const db = ScreenlitDatabase.getInstance();
  return CaseEngine.createReferral(data, db);
};

export const ingestWearableHttps = async (payload: WearableIngestPayload) => {
  const db = ScreenlitDatabase.getInstance();
  return CaseEngine.ingestWearable(payload, db);
};

export const scheduledSlaSweep = async () => {
  const db = ScreenlitDatabase.getInstance();
  return CaseEngine.evaluateSlaAndEscalate(db);
};

export { CaseEngine, ScreenlitDatabase };
