"use client";
import { useEffect, useRef, useState } from "react";
import { Userchat } from "../components/User-chat";
import { Aichat } from "../components/Ai-chat";
import { Modal } from "../components/Modal";
import { SignOut } from "../components/SignOut";

import {
  model,
  db,
  auth,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  deleteDoc,
  doc,
  where,
  limit,
  onAuthStateChanged,
} from "../../lib/firebase";

export default function MyAI() {
  const [hide, setHide] = useState(true);
  const [user_prompt, setUser_prompt] = useState("");
  const [isLoading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const textareaRef = useRef(null);

  const [user, setUser] = useState(null);

  const handleHide = () => {
    setHide((prev) => !prev);
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const messagesRef = collection(db, "messages");
    const userMessagesQuery = query(
      messagesRef,
      where("userId", "==", user.uid),
      orderBy("createdAt"),
    );

    const unsubscribe = onSnapshot(userMessagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [user]);

  const handleChange = (e) => {
    setUser_prompt(e.target.value);
  };

  async function clearMessagesCollection() {
    try {
      const messagesRef = collection(db, "messages");
      const snapshot = await getDocs(messagesRef);

      const deletePromises = snapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "messages", docSnap.id)),
      );

      await Promise.all(deletePromises);
      console.log("All messages deleted.");
    } catch (error) {
      console.error("Error clearing messages collection:", error);
    }
  }

  const handleSubmit = async () => {
    if (!user_prompt.trim()) return;
    setUser_prompt("");

    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error("User not signed in");
      return;
    }

    try {
      const userMessagesQuery = query(
        collection(db, "messages"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(10),
      );

      const snapshot = await getDocs(userMessagesQuery);

      const pastMessages = snapshot.docs.reverse().map((doc) => ({
        prompt: doc.data().prompt,
        response: doc.data().response,
      }));

      const contextText = pastMessages
        .map((msg) => `User: ${msg.prompt}\nAI: ${msg.response}`)
        .join("\n\n");

      const fullPrompt = `${contextText}\n\nUser: ${user_prompt}\nAI:`;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const text = await response.text();

      await addDoc(collection(db, "messages"), {
        userId: currentUser.uid,
        prompt: user_prompt,
        response: text,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error submitting prompt:", error);
    }
  };

  const handleKeydown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [user_prompt]);

  return (
    // Container
    <main className={`flex h-screen w-screen flex-col lg:flex-row`}>
      <Modal show={!user} />
      {user && (
        <>
          {/* navbar */}
          <nav
            className={`${hide ? "w-full lg:w-52" : "w-22 rounded-r-xl lg:w-16"} flex h-full max-h-[4rem] items-center justify-around gap-5 bg-[black] transition-all duration-500 lg:h-full lg:max-h-[100dvh] lg:flex-col lg:p-5`}
          >
            {/* BRAND OF SITE */}
            <div className={`${hide ? "" : "lg:mb-auto"} flex gap-5`}>
              {hide ? (
                <>
                  <img
                    className="size-5 lg:mb-auto"
                    src="/ai-icon.svg"
                    alt="ai-icon"
                  />
                  <p className="hidden lg:block">TFer AI</p>
                </>
              ) : null}
              <img
                onClick={handleHide}
                className={`z-10 size-5 cursor-pointer`}
                src="/close-icon.svg"
                alt="ai-icon"
              />
            </div>

            {hide ? (
              <>
                <div
                  onClick={clearMessagesCollection}
                  className="flex cursor-pointer items-center gap-3.5 rounded-lg hover:bg-[#5555551c] lg:w-full lg:px-5 lg:py-3.5"
                >
                  <img className="size-5" src="/newchat-icon.svg" alt="" />

                  <button className="hidden lg:block">New chat</button>
                </div>
                <SignOut isHide={hide} className="lg:mt-auto" />
              </>
            ) : null}
          </nav>

          {/* Chat contaier */}
          <div className="flex h-full w-full flex-col lg:items-center lg:justify-center">
            <div className="flex h-full max-h-[90vh] w-full flex-col p-3.5 lg:max-h-dvh lg:w-1/2">
              {/* Chat message */}
              <div className="overflow-y-auto [&>div]:mb-5 [&>div]:space-y-5">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    <Userchat user_id={msg.id} user_text={msg.prompt} />

                    <Aichat ai_id={msg.id} ai_text={msg.response} />
                  </div>
                ))}
              </div>

              {/* Input */}
              <section className="mt-auto flex w-full gap-5 place-self-end rounded-2xl bg-[#4a4a4a68] px-3 py-2.5 leading-5">
                <textarea
                  ref={textareaRef}
                  className="max-h-32 w-full resize-none overflow-y-auto rounded-lg bg-transparent px-4 py-3 leading-5 text-white focus:placeholder-[#ffffff00] focus:outline-none"
                  placeholder="Type your message..."
                  rows={1}
                  value={user_prompt}
                  onChange={handleChange}
                  onKeyDown={handleKeydown}
                />
                <button
                  onClick={handleSubmit}
                  className="flex cursor-pointer items-center gap-3.5 rounded-lg border border-[#4d4d4de5] px-6 py-2.5 text-white"
                >
                  Send
                  <img
                    className="size-4.5 invert"
                    src="/send-icon.svg"
                    alt=""
                  />
                </button>
              </section>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
