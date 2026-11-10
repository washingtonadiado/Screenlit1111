/**
 * Screenlit Firebase SDK Initializer and Security Client
 * Configures Firestore enterprise database, Firebase Authentication, and error reporting
 *
 * Hard rule: Never use em dashes, en dashes, or hyphens as punctuation
 */

import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, getDocFromServer, getFirestore, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Role, SupportedLanguage, UserProfile } from '@shared/types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validate connection to Firestore on initial application boot
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}

/**
 * Helper to authenticate via Google Login popup
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Google sign in error:', err);
    throw err;
  }
}

/**
 * Helper to sign out of Firebase
 */
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Sign out error:', err);
    throw err;
  }
}

/**
 * Sign up a new user with email and password.
 * Creates a Firebase Auth user and a Firestore profile document.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: Role,
  language: SupportedLanguage
): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName });

  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName,
    role,
    language,
    linkedPatientId:
      role === 'patient' || role === 'caregiver'
        ? `pat_${user.uid.substring(0, 12)}`
        : undefined,
    organizationId:
      role === 'specialist' ? 'org_central_hospital' : 'org_alamal_clinic',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'users', user.uid), profile);
  return profile;
}

/**
 * Sign in an existing user with email and password.
 * Loads the user profile from Firestore.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserProfile | null> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return await loadUserProfile(credential.user.uid);
}

/**
 * Load a user profile from Firestore by UID.
 */
export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return snap.data() as UserProfile;
  } catch (error) {
    console.error('Failed to load user profile:', error);
    return null;
  }
}

/**
 * Create a default patient profile for a Google sign in user
 * who has no Firestore profile yet.
 */
export async function createDefaultProfile(
  uid: string,
  email: string,
  displayName: string
): Promise<UserProfile> {
  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid,
    email,
    displayName: displayName || 'New User',
    role: 'patient',
    language: 'en',
    linkedPatientId: `pat_${uid.substring(0, 12)}`,
    organizationId: 'org_alamal_clinic',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'users', uid), profile);
  return profile;
}
