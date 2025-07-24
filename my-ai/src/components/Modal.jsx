"use client";
import { auth, signInAnonymously } from "../../lib/firebase";
import {
  db,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "../../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export function Modal({ show = true }) {
  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously(auth);
      console.log("Signed in anonymously");
    } catch (error) {
      alert("Anonymous sign-in failed:", error);
    }
  };
  const deleteAnonymousMessages = async (anonUid) => {
    const q = query(collection(db, "messages"), where("userId", "==", anonUid));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, "messages", docSnap.id)),
    );
    await Promise.all(deletePromises);

    console.log(
      `Deleted ${snapshot.docs.length} messages from anonymous user.`,
    );
  };

  const handleGoogleSignIn = async () => {
    const anonUser = auth.currentUser;

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      if (anonUser && anonUser.isAnonymous) {
        await deleteAnonymousMessages(anonUser.uid);
        await anonUser.delete();
        console.log("Anonymous account and messages deleted.");
      }

      console.log("Signed in with Google:", result.user.uid);
    } catch (error) {
      console.error("Google sign-in failed:", error);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-10 backdrop-blur-sm md:p-5 lg:p-5">
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl bg-[#2e2e2e] p-8 text-black shadow-lg [&>button]:cursor-pointer [&>button]:hover:bg-[#7e7e7e8c]">
        <button
          onClick={handleAnonymousSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#4f4f4f] px-5 py-3 text-white"
        >
          <img src="/guest-icon.svg" alt="Guest Icon" className="h-6 w-6" />
          <span>Sign in as Guest</span>
        </button>

        <div className="my-4 flex w-full items-center">
          <div className="h-px grow-1 bg-[#5e5e5e]"></div>
          <span className="px-3 text-white">OR</span>
          <div className="h-px grow-1 bg-[#5e5e5e]"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#4f4f4f9d] px-5 py-3 text-white"
        >
          <img src="/google-icon.svg" alt="Google Icon" className="h-6 w-6" />
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}
