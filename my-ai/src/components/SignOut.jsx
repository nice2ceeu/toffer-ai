import React, { useState, useCallback } from "react";
import { signOut } from "../../lib/firebase";
import { deleteUser } from "firebase/auth";
import {
  db,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "../../lib/firebase";
import { auth } from "../../lib/firebase";

export function SignOut({ className = "", isHide }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const deleteAnonymousMessages = async (uid) => {
    const q = query(collection(db, "messages"), where("userId", "==", uid));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, "messages", docSnap.id)),
    );

    await Promise.all(deletePromises);
    console.log(`Deleted ${snapshot.docs.length} messages for anonymous user`);
  };

  const handleSignOut = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage("");

    try {
      const user = auth.currentUser;

      if (user?.isAnonymous) {
        await deleteAnonymousMessages(user.uid);
        await deleteUser(user);
        setMessage("Anonymous account and messages deleted.");
      } else {
        await signOut(auth);
        setMessage("You have been signed out successfully!");
      }
    } catch (err) {
      console.error("Error signing out:", err);
      setError(err);
      setMessage(`Error signing out: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className={`${className} flex items-center rounded-lg lg:w-full`}>
      <div
        onClick={handleSignOut}
        className="flex cursor-pointer items-center justify-around gap-3.5 rounded-lg hover:bg-[#5555551c] lg:w-full lg:px-5 lg:py-3.5"
      >
        <button className="hidden lg:block" disabled={loading}>
          {isHide ? (loading ? `Signing Out...` : `Sign Out`) : null}
        </button>
        <img className={`size-5`} src="/logout-icon.svg" alt="logout-icon" />
      </div>
      {message && <p style={{ color: error ? "red" : "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}
    </div>
  );
}
