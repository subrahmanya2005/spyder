"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Sparkles, Loader2 } from "lucide-react";

// Helpers for logic and randomness
const historyMap = new Map();

function getRandomResponse(key, variations) {
  let lastIdx = historyMap.get(key) ?? -1;
  let nextIdx;
  do {
    nextIdx = Math.floor(Math.random() * variations.length);
  } while (nextIdx === lastIdx && variations.length > 1);
  historyMap.set(key, nextIdx);
  return variations[nextIdx];
}

// Rewritten for human-like conversational tone
function getSaveResponses(data) {
  const { balance } = data;
  if (balance <= 0) {
    return [
      "I cannot provide a recommendation until income is deposited.",
      "Please deposit funds into your wallet to receive personalized savings recommendations.",
      "Your current balance is zero. Log your earnings to proceed.",
      "A positive balance is required to calculate savings targets.",
      "Please record your income so I can determine an appropriate savings amount.",
    ];
  }
  const recommended = Math.round(balance * 0.25).toLocaleString('en-IN');
  const balStr = balance.toLocaleString('en-IN');
  return [
    `Based on your balance, saving ₹${recommended} today is a prudent financial decision.`,
    `I recommend allocating ₹${recommended} from your current balance to savings.`,
    `Securing ₹${recommended} today aligns with standard financial growth strategies.`,
    `With ₹${balStr} in your wallet, transferring ₹${recommended} to savings is highly advised.`,
    `Allocating ₹${recommended} to your savings now will strengthen your financial position.`,
  ];
}

function getProgressResponses(data) {
  const { saved } = data;
  if (saved <= 0) {
    return [
      "No savings have been recorded yet. Please initiate a deposit.",
      "Your savings balance is currently zero. Initiate a transfer to begin.",
      "You have not started saving yet. Consider depositing a small amount today.",
      "Your financial journey has not commenced. Please make your first deposit.",
      "There are no recorded savings. Start building your portfolio today.",
    ];
  }
  const savedStr = saved.toLocaleString('en-IN');
  return [
    `You are making consistent progress. You have secured ₹${savedStr} in savings.`,
    `Your current savings balance is ₹${savedStr}. Maintaining consistency is recommended.`,
    `You have successfully saved ₹${savedStr}. This provides a strong financial foundation.`,
    `Your progress is recorded. Your total savings amount to ₹${savedStr}.`,
    `You are on track. A secured balance of ₹${savedStr} indicates positive financial discipline.`,
  ];
}

function getGoalResponses(data) {
  const { goals } = data;
  const len = goals?.length || 0;
  if (len === 0) {
    return [
      "There are no active goals associated with your account. Please create one.",
      "Your goal list is currently empty. Defining a target is recommended for structured saving.",
      "You have not defined any financial targets. Setting specific goals improves financial outcomes.",
      "No active goals found. Please initialize a new savings objective.",
      "You currently lack a defined savings target. Please create a goal to track progress.",
    ];
  }
  return [
    `You are currently tracking ${len} active goal${len > 1 ? 's' : ''}. Maintain your deposit schedule.`,
    `There are ${len} active goal${len > 1 ? 's' : ''} in your portfolio. Continued focus is advised.`,
    `With ${len} goal${len > 1 ? 's' : ''} in progress, consistent daily contributions are necessary.`,
    `You have ${len} active financial objective${len > 1 ? 's' : ''}. Your tracking is optimal.`,
    `Your account reflects ${len} active target${len > 1 ? 's' : ''}. Continue your current strategy.`,
  ];
}

function getWithdrawResponses(data) {
  const { balance, canWithdraw } = data;
  if (!canWithdraw || balance <= 0) {
    return [
      "Your spendable balance is insufficient for a withdrawal.",
      "No funds are available for withdrawal at this time.",
      "Your liquid balance is zero. Deposits are required before withdrawing.",
      "You do not have sufficient liquid funds to authorize a withdrawal.",
      "Withdrawal requests cannot be processed with your current balance.",
    ];
  }
  const balStr = balance.toLocaleString('en-IN');
  return [
    `You have ₹${balStr} available. Withdrawals should be reserved for essential requirements.`,
    `Your liquid balance is ₹${balStr}. Please consider the impact on your savings before withdrawing.`,
    `You are authorized to withdraw up to ₹${balStr}. Maintain discipline regarding unnecessary expenditures.`,
    `₹${balStr} is available in your main wallet. Ensure withdrawals align with your financial strategy.`,
    `Your account has ₹${balStr} available for withdrawal. Please proceed with caution.`,
  ];
}

function getTips() {
  return [
    "Financial Tip: Prioritize your savings by allocating a fixed percentage of your income before budgeting for expenses.",
    "Financial Tip: The 50/30/20 rule is an effective framework for structuring your personal budget.",
    "Financial Tip: Automating your deposits reduces the likelihood of discretionary spending.",
    "Financial Tip: As your income increases, ensure your savings rate increases proportionally to avoid lifestyle inflation.",
    "Financial Tip: An emergency fund covering 3 to 6 months of expenses is essential for financial stability."
  ];
}

function getEnoughResponses(data) {
  const { saved } = data;
  if (saved <= 0) {
    return [
      "You have not accumulated any savings. Initiating deposits is strongly recommended.",
      "A zero balance indicates a critical need to begin saving immediately.",
      "You currently lack financial reserves. Please make a deposit to start building wealth.",
      "No savings have been recorded. Consistent contributions are required to meet any standard.",
      "Your savings are currently insufficient. Begin depositing to improve your financial health.",
    ];
  }
  return [
    "Your progress is satisfactory. Continue maintaining your current deposit schedule.",
    "Your current savings rate is optimal, provided you are meeting your predefined monthly targets.",
    "You are demonstrating solid financial habits. Ensure your emergency reserves remain fully funded.",
    "Your savings volume is acceptable. Consistency is the most critical factor for long-term growth.",
    "Based on current metrics, your savings activity is appropriate. Continue your systematic deposits.",
  ];
}

function getImproveResponses() {
  return [
    "Consider reducing non-essential subscription services to increase your available savings capital.",
    "Automating your financial transfers is the most effective method for improving savings consistency.",
    "Establishing smaller, incremental targets can improve adherence to your broader financial goals.",
    "Conducting a comprehensive review of your recent expenditures will help identify areas for budget optimization.",
    "Implementing periodic spending freezes can accelerate your capital accumulation.",
  ];
}

const QUESTIONS = [
  { id: "save", label: "How much should I save today?" },
  { id: "doing", label: "How am I doing financially?" },
  { id: "goals", label: "What about my goals?" },
  { id: "withdraw", label: "Can I withdraw now?" },
  { id: "tips", label: "Give me a smart tip" },
  { id: "enough", label: "Am I saving enough?" },
  { id: "improve", label: "How can I improve my savings?" },
];

export default function SmartAssistant({ 
  balance = 0, 
  saved = 0, 
  goals = [], 
  canWithdraw = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [response, setResponse] = useState(null);
  const [typing, setTyping] = useState(false);
  const [lastQuestion, setLastQuestion] = useState(null);
  const [initialSuggestion, setInitialSuggestion] = useState("");
  const scrollRef = useRef(null);

  // Generate initial proactive suggestion when data changes
  useEffect(() => {
    if (balance > 0) {
      const rec = Math.round(balance * 0.25).toLocaleString('en-IN');
      setInitialSuggestion(`Based on your current balance, I recommend saving ₹${rec} today to maintain optimal financial growth.`);
    } else {
      setInitialSuggestion("I am your financial assistant. Please deposit funds into your wallet so I can provide personalized recommendations.");
    }
  }, [balance]);

  // Auto-scroll to bottom of chat body
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [response, typing]);

  const handleQuestion = (questionId, data) => {
    switch (questionId) {
      case "save": return getRandomResponse("save", getSaveResponses(data));
      case "doing": return getRandomResponse("doing", getProgressResponses(data));
      case "goals": return getRandomResponse("goals", getGoalResponses(data));
      case "withdraw": return getRandomResponse("withdraw", getWithdrawResponses(data));
      case "tips": return getRandomResponse("tips", getTips());
      case "enough": return getRandomResponse("enough", getEnoughResponses(data));
      case "improve": return getRandomResponse("improve", getImproveResponses());
      default: return "I am available to assist with your financial queries.";
    }
  };

  const handleChipClick = async (q) => {
    if (typing) return;
    
    // Memory: track if this is a repeated question
    const isRepeat = lastQuestion === q.id;
    setLastQuestion(q.id);

    setSelected(q.id);
    setResponse(null);
    setTyping(true);

    const dataObj = { balance, saved, goals, canWithdraw };
    let ans = handleQuestion(q.id, dataObj);

    // If repeat, prepend conversational memory phrase
    if (isRepeat) {
      const prefixes = [
        "As stated previously, ",
        "To reiterate, ",
        "As noted earlier, ",
        "I will confirm again, "
      ];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      // Lowercase first letter of original answer to make sentence flow naturally
      ans = prefix + ans.charAt(0).toLowerCase() + ans.slice(1);
    }

    // Smooth typing delay (600-900ms human-like feel)
    const typingTime = Math.floor(Math.random() * 300) + 600;
    await new Promise((r) => setTimeout(r, typingTime));
    
    setResponse(ans);
    setTyping(false);
  };

  const toggleAssistant = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* FLOATING CHAT BUTTON */}
      <button
        onClick={toggleAssistant}
        className={`
          fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[200]
          w-[60px] h-[60px] rounded-full
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-105 active:scale-95
          ${isOpen 
            ? "bg-[#222222] text-[#1ED760] border border-[#1ED760]/30 shadow-[0_0_20px_rgba(30,215,96,0.15)]" 
            : "bg-[#1ED760] text-[#121212] shadow-[0_8px_30px_rgba(30,215,96,0.4)]"
          }
        `}
      >
        {isOpen ? <X size={26} strokeWidth={2.5} /> : <MessageCircle size={28} fill="currentColor" />}
      </button>

      {/* CHAT PANEL VISIBILITY CONTROL */}
      {isOpen && (
        <div
          className={`
            fixed z-[199]
            bottom-[100px] md:bottom-[110px] 
            right-4 md:right-8 
            w-[calc(100vw-32px)] md:w-[340px]
            animate-in fade-in zoom-in-95 duration-200 ease-out
            overflow-hidden
            bg-[#121212]/95 backdrop-blur-xl text-white
            border border-[rgba(255,255,255,0.06)]
            rounded-[24px]
            shadow-[0_16px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(0,0,0,0.4)]
            flex flex-col
            max-h-[65vh] md:max-h-[500px]
          `}
        >
          {/* HEADER */}
          <div className="relative shrink-0 px-5 py-4 border-b border-[rgba(255,255,255,0.06)] bg-transparent flex items-center justify-between z-10 sticky top-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1ED760]/10 border border-[#1ED760]/20 rounded-xl flex items-center justify-center text-[#1ED760]">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-[14px] font-bold tracking-tight text-white leading-tight">Smart Assistant</h3>
                <p className="text-[11px] text-white/50 font-medium">Financial Assistant</p>
              </div>
            </div>
            {/* CLOSE BUTTON */}
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* CHAT BODY */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-5"
          >
            {/* Initial Proactive Suggestion */}
            <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="w-8 h-8 rounded-full bg-[#1ED760]/15 border border-[#1ED760]/20 flex items-center justify-center text-[#1ED760] shrink-0 mt-0.5">
                <Sparkles size={14} />
              </div>
              <div className="bg-[#1C1C1C] border border-[rgba(255,255,255,0.04)] px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] shadow-md">
                <p className="text-[13px] text-white leading-relaxed font-medium">
                  {initialSuggestion}
                </p>
              </div>
            </div>

            {/* QUESTION CHIPS */}
            <div className="flex flex-wrap gap-2 pt-2">
              {QUESTIONS.map((q) => (
                <button
                  key={q.id}
                  onClick={() => handleChipClick(q)}
                  disabled={typing}
                  className={`
                    px-3.5 py-2 rounded-full text-[12px] font-medium
                    transition-all duration-200
                    border
                    ${selected === q.id 
                      ? "bg-[#1ED760]/20 border-[#1ED760]/40 text-[#1ED760]" 
                      : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)] text-white/80 hover:bg-[rgba(255,255,255,0.08)] hover:scale-105 active:scale-95"
                    }
                    disabled:opacity-50 disabled:hover:scale-100
                  `}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* MESSAGES AREA */}
            {(selected || typing) && (
              <div className="space-y-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                {/* User Message (Question) */}
                {selected && (
                  <div className="flex justify-end animate-in fade-in slide-in-from-right-2 duration-300">
                    <div className="bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.08)] px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%]">
                      <p className="text-[13px] text-white font-medium">
                        {QUESTIONS.find(q => q.id === selected)?.label}
                      </p>
                    </div>
                  </div>
                )}

                {/* Assistant Message (Response) */}
                {(typing || response) && (
                  <div className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="w-8 h-8 rounded-full bg-[#1ED760]/15 border border-[#1ED760]/20 flex items-center justify-center text-[#1ED760] shrink-0 mt-0.5">
                      <Sparkles size={14} />
                    </div>
                    {/* Chat bubble style: dark gray background */}
                    <div className="bg-[#1C1C1C] border border-[rgba(255,255,255,0.04)] px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] shadow-md">
                      {typing ? (
                        <div className="flex items-center gap-2 text-white/40">
                          <Loader2 size={14} className="animate-spin text-[#1ED760]" />
                          <span className="text-[12px] font-medium">Typing...</span>
                        </div>
                      ) : (
                        <p className="text-[13px] text-white leading-relaxed font-medium">
                          {response}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
