/**
 * Screenlit Application Context
 * Manages active user role, patient session, FHIR resources, language, and demo clock
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CaseDocument,
  FHIRConsent,
  FHIRObservation,
  Role,
  SupportedLanguage,
  UserProfile,
} from '@shared/types';
import { getDictionary, isRtl } from '../locales';
import { auth, loginWithGoogle, logoutUser, testConnection } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  availableUsers: UserProfile[];
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  dict: ReturnType<typeof getDictionary>;
  activeCase: CaseDocument | null;
  allCases: CaseDocument[];
  observations: FHIRObservation[];
  consents: FHIRConsent[];
  toggleConsent: (organizationId: string) => Promise<void>;
  caregiverRevoked: boolean;
  revokeCaregiver: () => void;
  refreshData: () => Promise<void>;
  submitObservation: (params: {
    systolic: number;
    diastolic: number;
    noteText?: string;
  }) => Promise<{ success: boolean; isActionable: boolean }>;
  transitionCase: (
    targetState: string,
    reason: string,
    evidenceUpdates?: Record<string, unknown>
  ) => Promise<{ success: boolean; error?: string }>;
  demoClockOffsetHours: number;
  advanceDemoClock: (hours: number) => Promise<void>;
  activeView: string;
  setActiveView: (view: string) => void;
  firebaseUser: FirebaseUser | null;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const DEFAULT_USERS: UserProfile[] = [
  {
    uid: 'user_patient_tariq',
    email: 'tariq.patient@screenlit.health',
    displayName: 'Tariq Al Mahmoud',
    role: 'patient',
    language: 'ar',
    linkedPatientId: 'pat_tariq_001',
    organizationId: 'org_alamal_clinic',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'user_caregiver_zainab',
    email: 'zainab.caregiver@screenlit.health',
    displayName: 'Zainab Al Mahmoud',
    role: 'caregiver',
    language: 'ar',
    linkedPatientId: 'pat_tariq_001',
    organizationId: 'org_alamal_clinic',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'user_coordinator_fatima',
    email: 'coordinator.fatima@screenlit.health',
    displayName: 'Fatima Noor, RN',
    role: 'coordinator',
    language: 'en',
    organizationId: 'org_alamal_clinic',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'user_physician_amina',
    email: 'dr.amina@screenlit.health',
    displayName: 'Dr. Amina Al Mansoor',
    role: 'physician',
    language: 'en',
    organizationId: 'org_alamal_clinic',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'user_specialist_mwangi',
    email: 'dr.mwangi@screenlit.health',
    displayName: 'Dr. David Mwangi',
    role: 'specialist',
    language: 'sw',
    organizationId: 'org_central_hospital',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    uid: 'user_admin_hassan',
    email: 'admin.hassan@screenlit.health',
    displayName: 'Hassan Al Kuwari',
    role: 'admin',
    language: 'en',
    organizationId: 'org_alamal_clinic',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USERS[0]);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [activeCase, setActiveCase] = useState<CaseDocument | null>(null);
  const [allCases, setAllCases] = useState<CaseDocument[]>([]);
  const [observations, setObservations] = useState<FHIRObservation[]>([]);
  const [caregiverRevoked, setCaregiverRevoked] = useState(false);
  const [demoClockOffsetHours, setDemoClockOffsetHours] = useState(0);
  const [activeView, setActiveView] = useState('home');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    // Validate connection to Firestore on initial application boot
    testConnection().catch((err) => {
      console.warn('Firestore initial connection check:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setFirebaseReady(true);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        setFirebaseUser(user);
      }
    } catch (err) {
      console.error('Failed to sign in with Google:', err);
    }
  };

  const signOutUser = async () => {
    try {
      await logoutUser();
      setFirebaseUser(null);
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  const [consents, setConsents] = useState<FHIRConsent[]>([
    {
      resourceType: 'Consent',
      id: 'consent_alamal_clinic',
      status: 'active',
      scope: { text: 'Primary Care Coordination' },
      category: [{ text: 'Care coordination' }],
      patient: { reference: 'Patient/pat_tariq_001' },
      organization: [
        {
          reference: 'Organization/org_alamal_clinic',
          display: 'Al Amal Community Health Centre',
        },
      ],
      provision: { type: 'permit' },
    },
    {
      resourceType: 'Consent',
      id: 'consent_central_hospital',
      status: 'active',
      scope: { text: 'Hospital Specialty Consult' },
      category: [{ text: 'Specialist referral' }],
      patient: { reference: 'Patient/pat_tariq_001' },
      organization: [
        {
          reference: 'Organization/org_central_hospital',
          display: 'Central District Hospital',
        },
      ],
      provision: { type: 'permit' },
    },
  ]);

  const dict = getDictionary(currentLanguage);

  useEffect(() => {
    document.documentElement.dir = isRtl(currentLanguage) ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  const refreshData = async () => {
    try {
      const patientId = currentUser.linkedPatientId || 'pat_tariq_001';
      const casesRes = await fetch(`/api/cases?patientId=${patientId}`);
      if (casesRes.ok) {
        const data = await casesRes.json();
        setAllCases(data.cases || []);
        if (data.cases && data.cases.length > 0) {
          const sorted = [...data.cases].sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setActiveCase(sorted[0]);
        }
      }

      const obsRes = await fetch(`/api/observations?patientId=${patientId}`);
      if (obsRes.ok) {
        const data = await obsRes.json();
        setObservations(data.observations || []);
      }

      const clockRes = await fetch('/api/demo/clock');
      if (clockRes.ok) {
        const data = await clockRes.json();
        setDemoClockOffsetHours(data.offsetHours || 0);
      }
    } catch (err) {
      console.warn('Network sync warning: Running with local fallback data', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  const toggleConsent = async (organizationId: string) => {
    setConsents((prev) =>
      prev.map((c) => {
        const orgRef = c.organization?.[0]?.reference;
        if (orgRef === `Organization/${organizationId}`) {
          const nextStatus = c.status === 'active' ? 'inactive' : 'active';
          return {
            ...c,
            status: nextStatus,
            provision: {
              ...c.provision,
              type: nextStatus === 'active' ? 'permit' : 'deny',
            },
          };
        }
        return c;
      })
    );
  };

  const revokeCaregiver = () => {
    setCaregiverRevoked(true);
  };

  const submitObservation = async (params: {
    systolic: number;
    diastolic: number;
    noteText?: string;
  }) => {
    const patientId = currentUser.linkedPatientId || 'pat_tariq_001';
    try {
      const res = await fetch('/api/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          systolic: params.systolic,
          diastolic: params.diastolic,
          noteText: params.noteText,
          performerId: currentUser.uid,
          performerRole: currentUser.role,
        }),
      });
      const data = await res.json();
      await refreshData();
      return { success: data.success, isActionable: data.isActionable };
    } catch (err) {
      console.error('Failed to submit observation:', err);
      return { success: false, isActionable: false };
    }
  };

  const transitionCase = async (
    targetState: string,
    reason: string,
    evidenceUpdates?: Record<string, unknown>
  ) => {
    if (!activeCase) {
      return { success: false, error: 'No active case found' };
    }
    try {
      const res = await fetch('/api/cases/transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: activeCase.id,
          targetState,
          actorUid: currentUser.uid,
          actorRole: currentUser.role,
          reason,
          evidenceUpdates,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await refreshData();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err) {
      return { success: false, error: 'Failed to contact server' };
    }
  };

  const advanceDemoClock = async (hours: number) => {
    try {
      const res = await fetch('/api/demo/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ advanceHours: hours }),
      });
      if (res.ok) {
        const data = await res.json();
        setDemoClockOffsetHours(data.offsetHours);
        await refreshData();
      }
    } catch (err) {
      console.error('Error advancing clock:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers: DEFAULT_USERS,
        currentLanguage,
        setLanguage: setCurrentLanguage,
        dict,
        activeCase,
        allCases,
        observations,
        consents,
        toggleConsent,
        caregiverRevoked,
        revokeCaregiver,
        refreshData,
        submitObservation,
        transitionCase,
        demoClockOffsetHours,
        advanceDemoClock,
        activeView,
        setActiveView,
        firebaseUser,
        firebaseReady,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
