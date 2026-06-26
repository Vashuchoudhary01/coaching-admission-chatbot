"use client";
import { supabase } from "@/lib/supabase";
import { Bot, User, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

// import { courses } from "@/data/courses";
// import { fees } from "@/data/fees";
// import { scholarships } from "@/data/scholarships";
// import { faqs } from "@/data/faqs";
// import { admissionInfo } from "@/data/admission";

import { knowledgeBase } from "@/data/knowledge";

type Message = {
  role: "user" | "ai";
  text: string;
};

type Lead = {
  name: string;
  phone: string;
  course: string;
};

const normalizePhone = (phone: string) => {
  const digits = phone.replace(/\D/g, "");

  if (digits.length > 10 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  if (digits.length > 10) {
    return digits.slice(-10);
  }

  return digits;
};

export default function Home() {
  const [input, setInput] = useState("");

 const [messages, setMessages] = useState<Message[]>([]);

  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
   const [showLeadForm, setShowLeadForm] = useState(false);
   const [leadStatus, setLeadStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
   const [leadMessage, setLeadMessage] = useState("");

  const [lead, setLead] = useState<Lead>({
    name: "",
    phone: "",
    course: "",
  });
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });
}, [messages, isTyping]);
const handleSend = async (quickMessage?: string) => {
  const userMessage = (quickMessage ?? input).trim();

  if (!userMessage) return;

  setInput("");

  // Add user message immediately
  setMessages((prev) => [
    ...prev,
    {
      role: "user",
      text: userMessage,
    },
  ]);

  // Show typing indicator
  setIsTyping(true);

  // Simulate AI thinking
  setTimeout(async () => {
    let aiResponse =
      "Please ask about courses, fees, scholarships, or admissions.";
    const matchedFaq = knowledgeBase.faqs.find((faq) =>
  userMessage
    .toLowerCase()
    .includes(faq.question.toLowerCase())
);

try {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: userMessage,
    }),
  });

  const data = await response.json();

  aiResponse = data.reply;
} catch (error) {
  aiResponse =
    "Sorry, I am unable to process your request right now.";
}
  
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: aiResponse,
      },
    ]);

    setIsTyping(false);
  }, 1000);
};

const handleLeadSubmit = async () => {
  const leadPayload = {
    name: lead.name.trim(),
    phone: normalizePhone(lead.phone),
    course: lead.course.trim(),
  };

  if (!leadPayload.name || !leadPayload.phone || !leadPayload.course) {
    setLeadStatus("error");
    setLeadMessage("Please fill name, phone number, and interested course.");
    return;
  }

  if (leadPayload.phone.length !== 10) {
    setLeadStatus("error");
    setLeadMessage("Please enter a valid 10-digit phone number.");
    return;
  }

  setLeadStatus("submitting");
  setLeadMessage("");

  const { error } = await supabase.from("leads").insert(leadPayload);

  if (error) {
    console.error("Supabase lead insert failed:", error);
    setLeadStatus("error");
    setLeadMessage(
      error.code === "42501"
        ? "Database permission is blocking lead submissions. Run the Supabase leads policy SQL once."
        : error.code === "23505"
          ? "This phone number is already registered. We will contact you soon."
        : error.message || "Could not save your details. Please try again.",
    );
    return;
  }

  setLeadStatus("success");
  setLeadMessage("Saved successfully. Our counselor will contact you soon.");
  setLead({ name: "", phone: "", course: "" });

  setMessages((prev) => [
    ...prev,
    {
      role: "ai",
      text: "Thanks! Your admission details have been saved successfully.",
    },
  ]);

  setTimeout(() => {
    setShowLeadForm(false);
    setLeadStatus("idle");
    setLeadMessage("");
  }, 900);
};
  return (
    <main className="h-screen flex bg-slate-100">
      {/* Sidebar */}
      {showSidebar && (
  <div
    className="fixed inset-0 bg-black/40 z-40 md:hidden"
    onClick={() => setShowSidebar(false)}
  />
)}
<motion.div
  initial={{ x: -100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.5 }}
className={`
  fixed md:static
  top-0 left-0
  h-screen md:h-auto
  w-80
  bg-slate-900
  text-white
  p-6
  z-50
  transform
  transition-transform
  duration-300
  ${showSidebar ? "translate-x-0" : "-translate-x-full"}
  md:translate-x-0
`}
>
<div className="flex items-center gap-3">
  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
    <Bot size={24} />
  </div>

  <div>
    <h1 className="text-2xl font-bold">
      Admission AI
    </h1>

    <p className="text-slate-400 text-sm">
      AI Powered Counselor
    </p>
  </div>
</div>

  <div className="mt-10 space-y-3">
    <button
  className="w-full text-left p-4 rounded-2xl hover:bg-slate-800/80 hover:translate-x-2 transition-all duration-300 font-medium"
>
  ➕ New Chat
</button>

<button
  className="w-full text-left p-4 rounded-2xl hover:bg-slate-800/80 hover:translate-x-2 transition-all duration-300 font-medium"
>
  🎓 Admission Queries
</button>

<button
  className="w-full text-left p-4 rounded-2xl hover:bg-slate-800/80 hover:translate-x-2 transition-all duration-300 font-medium"
>
  💰 Fee Structure
</button>

<button
  className="w-full text-left p-4 rounded-2xl hover:bg-slate-800/80 hover:translate-x-2 transition-all duration-300 font-medium"
>
  🏆 Scholarships
</button>

<button
  className="w-full text-left p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-105 transition-all duration-300 shadow-lg font-semibold"
>
  📞 Contact Counselor
</button>
  </div>
</motion.div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
  {/* Header */}
 <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between px-8 shadow-lg">
  <button
    onClick={() => setShowSidebar(!showSidebar)}
    className="md:hidden text-white"
  >
    <Menu size={30} />
  </button>

  <h2 className="text-2xl font-bold text-white">
    🤖 AI Admission Assistant
  </h2>
</div>

  {/* Messages Area */}
  <div className="flex-1 p-8 overflow-y-auto">
    <div className="flex gap-3 mb-8 flex-wrap">
<button
  onClick={() => handleSend("What courses do you offer?")}
className="
bg-white
px-5 py-3
rounded-full
shadow-md
hover:shadow-xl
hover:scale-105
transition-all
duration-300
font-medium
"
>
  🎓 Courses
</button>

<button
  onClick={() => handleSend("What is B.Tech fees?")}
className="
bg-white
px-5 py-3
rounded-full
shadow-md
hover:shadow-xl
hover:scale-105
transition-all
duration-300
font-medium
"
>
  💰 Fees
</button>

<button
  onClick={() => handleSend("Tell me about scholarships")}
className="
bg-white
px-5 py-3
rounded-full
shadow-md
hover:shadow-xl
hover:scale-105
transition-all
duration-300
font-medium
"
>
  🏆 Scholarships
</button>

<button
  onClick={() => handleSend("Tell me about admissions")}
className="
bg-white
px-5 py-3
rounded-full
shadow-md
hover:shadow-xl
hover:scale-105
transition-all
duration-300
font-medium
"
>
  📞 Admissions
</button>
</div>
{messages.length === 0 && (
  <div className="h-full flex flex-col items-center justify-center text-center">
    <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl mb-8">
      <Bot size={50} className="text-white" />
    </div>

    <h2 className="text-4xl font-bold text-slate-800 mb-4">
      AI Admission Assistant
    </h2>

    <p className="text-slate-500 text-lg max-w-lg">
      Ask about courses, fees, scholarships, admissions, and get instant answers.
    </p>

    <div className="flex flex-wrap justify-center gap-4 mt-10">
      <button
        onClick={() => handleSend("What courses do you offer?")}
        className="bg-white px-5 py-3 rounded-full shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
      >
        🎓 Courses
      </button>

      <button
        onClick={() => handleSend("What is B.Tech fees?")}
        className="bg-white px-5 py-3 rounded-full shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
      >
        💰 Fees
      </button>

      <button
        onClick={() => handleSend("Tell me about scholarships")}
        className="bg-white px-5 py-3 rounded-full shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
      >
        🏆 Scholarships
      </button>

      <button
        onClick={() => handleSend("Tell me about admissions")}
        className="bg-white px-5 py-3 rounded-full shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium"
      >
        📞 Admissions
      </button>
    </div>
  </div>
)}
  {messages.map((message, index) => (
    <motion.div
  key={index}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  className={`flex mb-6 ${
    message.role === "user"
      ? "justify-end"
      : "justify-start"
  }`}
>
{message.role === "ai" && (
  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center mr-3 shadow-lg">
    <Bot size={20} />
  </div>
)}

  <div
    className={`p-5 rounded-2xl shadow-md max-w-2xl ${
      message.role === "user"
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        : "bg-white/90 backdrop-blur-md text-slate-700 border border-slate-200"
    }`}
  >
    {message.text}
  </div>

{message.role === "user" && (
  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center ml-3 shadow-lg">
    <User size={20} />
  </div>
)}
</motion.div>
  ))}
  {isTyping && (
  <div className="flex items-center gap-2 mb-6">
    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
      <Bot size={20} />
    </div>

    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl px-5 py-4 shadow-md flex gap-2">
      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div>
      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div>
    </div>
  </div>
)}

<div ref={messagesEndRef}></div>
</div>

  {/* Input Area */}
  <div className="h-24 bg-white border-t flex items-center px-8 gap-4">
<input
  type="text"
  placeholder="Ask about courses, fees, scholarships..."
  value={input}
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  }}
className="
flex-1
bg-white
border
border-slate-200
rounded-2xl
px-5
py-4
shadow-md
outline-none
focus:ring-2
focus:ring-blue-500
transition-all
duration-300
"
/>

  <button
  onClick={() => handleSend()}
className="
bg-gradient-to-r
from-blue-600
to-indigo-600
text-white
px-7
py-4
rounded-2xl
shadow-lg
hover:scale-105
transition-all
duration-300
font-semibold
"
>
  Send
</button>
</div>
</div>
{showLeadForm && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white w-[90%] max-w-md rounded-2xl p-6 shadow-2xl">
      
      <h2 className="text-2xl font-bold mb-4">
        📞 Get Admission Help
      </h2>

      <p className="text-slate-500 mb-6">
        Please enter your details and our counselor will contact you.
      </p>

      {/* Name */}
      <input
        type="text"
        placeholder="Your Name"
        value={lead.name}
        onChange={(e) =>
          setLead({ ...lead, name: e.target.value })
        }
        className="w-full border p-3 rounded-xl mb-3"
      />

      {/* Phone */}
      <input
        type="text"
        placeholder="Phone Number"
        value={lead.phone}
        onChange={(e) =>
          setLead({ ...lead, phone: e.target.value })
        }
        className="w-full border p-3 rounded-xl mb-3"
      />

      {/* Course */}
      <input
        type="text"
        placeholder="Interested Course"
        value={lead.course}
        onChange={(e) =>
          setLead({ ...lead, course: e.target.value })
        }
        className="w-full border p-3 rounded-xl mb-5"
      />

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            setShowLeadForm(false);
            setLeadStatus("idle");
            setLeadMessage("");
          }}
          className="flex-1 bg-slate-200 p-3 rounded-xl"
        >
          Cancel
        </button>

        <button
          onClick={handleLeadSubmit}
          disabled={leadStatus === "submitting"}
          className="flex-1 bg-blue-600 text-white p-3 rounded-xl disabled:cursor-not-allowed disabled:opacity-70"
        >
          {leadStatus === "submitting" ? "Saving..." : "Submit"}
        </button>
      </div>
      {leadMessage && (
        <p
          className={`mt-4 text-sm ${
            leadStatus === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {leadMessage}
        </p>
      )}
    </div>
  </div>
)}
    </main>
  );
}
