import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User,
} from "firebase/auth";
import { auth } from "./config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./config";

export type UserRole = "caregiver" | "senior" | "family";

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt?: any;
}

const googleProvider = new GoogleAuthProvider();

export async function signInWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  role: UserRole,
  displayName?: string
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  // Store user data in Firestore
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    role,
    displayName: displayName || user.displayName || "",
    createdAt: serverTimestamp(),
  });

  return user;
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Check if user exists in Firestore
  const userDoc = await getDoc(doc(db, "users", user.uid));
  
  if (!userDoc.exists()) {
    // New user - redirect to onboarding
    // For now, we'll set a default role, but onboarding should handle this
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      role: "caregiver", // Default, will be set in onboarding
      displayName: user.displayName || "",
      createdAt: serverTimestamp(),
    });
  }

  return user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function getUserData(uid: string): Promise<UserData | null> {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data() as UserData;
  }
  return null;
}

export async function updateUserRole(uid: string, role: UserRole) {
  await setDoc(
    doc(db, "users", uid),
    { role },
    { merge: true }
  );
}

