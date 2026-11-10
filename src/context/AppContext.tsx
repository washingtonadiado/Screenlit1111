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
import {
  auth,
  createDefaultProfile,
  loadUserProfile,
  loginWithGoogle,
  logoutUser,
  signInWithEmail,
  signUpWithEmail,
  testConnection,
} from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export interface AppContextType {
  currentUser: UserProfile;
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
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  signUp: (params: {
    email: string;
    password: string;
    displayName: string;
    role: Role;
    language: SupportedLanguage;
  }) => Promise<{ success: boolean; error?: string }>;
  signIn: (params: {
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string; role?: Role }>;
  firebaseUser: FirebaseUser | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const GUEST_USER: UserProfile = {
  uid: '',
  email: '',
  displayName: 'Guest',
  role: 'patient',
  language: 'en',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST_USER);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [activeCase, setActiveCase] = useState<CaseDocument | null>(null);
  const [allCases, setAllCases] = useState<CaseDocument[]>([]);
  const [observations, setObservations] = useState<FHIRObservation[]>([]);
  const [caregiverRevoked, setCaregiverRevoked] = useState(false);
  const [demoClockOffsetHours, setDemoClockOffsetHours] = useState(0);
  const [activeView, setActiveView] = useState('home');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Register user in the in-memory server DB so they appear in the workstation
  const registerWithServer = async (profile: UserProfile) => {
    try {
      await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
    } catch (err) {
      console.warn('Server registration sync failed:', err);
    }
  };
  useEffect(() => {
    testConnection().catch((err) => {
      console.warn('Firestore initial connection check:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        let profile = await loadUserProfile(user.uid);
        if (!profile) {
          // Google sign in users without a Firestore profile get a default patient profile
          profile = await createDefaultProfile(
            user.uid,
            user.email || '',
            user.displayName || 'New User'
          );
        }
        setCurrentUser(profile);
        setCurrentLanguage(profile.language);
        setIsAuthenticated(true);
        // Sync into in-memory server DB so they appear in the workstation
        await registerWithServer(profile);
      } else {
        setCurrentUser(GUEST_USER);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp: AppContextType['signUp'] = async (params) => {
    try {
      const profile = await signUpWithEmail(
        params.email,
        params.password,
        params.displayName,
        params.role,
        params.language
      );
      setCurrentUser(profile);
      setCurrentLanguage(profile.language);
      setIsAuthenticated(true);
      await registerWithServer(profile);
      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sign up failed. Please try again.';
      return { success: false, error: message };
    }
  };

  const signIn: AppContextType['signIn'] = async (params) => {
    try {
      const profile = await signInWithEmail(params.email, params.password);
      if (!profile) {
        return {
          success: false,
          error: 'User profile not found. Please contact your administrator.',
        };
      }
      setCurrentUser(profile);
      setCurrentLanguage(profile.language);
      setIsAuthenticated(true);
      await registerWithServer(profile);
      return { success: true, role: profile.role };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sign in failed. Please try again.';
      return { success: false, error: message };
    }
  };

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
      setCurrentUser(GUEST_USER);
      setIsAuthenticated(false);
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
    if (isAuthenticated) {
      refreshData();
    }
  }, [currentUser, isAuthenticated]);

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
        isAuthenticated,
        isLoadingAuth,
        signUp,
        signIn,
        firebaseUser,
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
