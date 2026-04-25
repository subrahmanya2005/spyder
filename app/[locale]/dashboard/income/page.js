"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Wallet,
} from "lucide-react";

// ---------------------------------------------------
// Skeleton shimmer component
// ---------------------------------------------------
function Skeleton({ className = "" }) {
  return (
    <div
      className={`relative overflow-hidden bg-white/5 rounded-2xl ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </div>
  );
}

// ---------------------------------------------------
// Full-page skeleton shown while dashboard loads
// ---------------------------------------------------
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0B0F0E] text-white p-4 md:p-12 pb-32">
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="max-w-2xl mx-auto space-y-10">

        {/* Header skeleton */}
        <div className="flex items-center gap-6">
          <Skeleton className="w-12 h-12 rounded-2xl flex-shrink-0" />
          <div className="space-y-3 flex-1">
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-3 w-32 rounded-full" />
          </div>
        </div>

        {/* Card skeleton */}
        <div className="card-primary p-8 md:p-12 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-3 w-40 rounded-full" />
            <Skeleton className="h-24 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <div
            className="w-5 h-5 rounded-full border-2 border-[#1ED760]/30 border-t-[#1ED760]"
            style={{ animation: "spin 0.9s linear infinite" }}
          />
          <span className="text-xs uppercase tracking-widest">
            Loading your data…
          </span>
        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------
// Full-screen overlay shown during Razorpay / save
// ---------------------------------------------------
function ActionOverlay({ message, subMessage }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B0B]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.12); }
        }
      `}</style>

      {/* Pulsing ring + spinner */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-2 border-[#1ED760]/30"
          style={{ animation: "pulse-ring 1.8s ease-in-out infinite" }}
        />
        <div
          className="w-16 h-16 rounded-full border-2 border-[#1ED760]/20 border-t-[#1ED760]"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <div className="absolute w-3 h-3 rounded-full bg-[#1ED760]" />
      </div>

      <div className="text-center space-y-2">
        <p className="text-white font-black text-xl">{message}</p>
        {subMessage && (
          <p className="text-gray-500 text-sm">{subMessage}</p>
        )}
      </div>

      {/* Animated dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#1ED760]/50"
            style={{
              animation: `pulse-ring 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------
// Inline button spinner
// ---------------------------------------------------
function ButtonSpinner() {
  return (
    <div
      className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black"
      style={{ animation: "spin 0.8s linear infinite" }}
    />
  );
}

// ---------------------------------------------------
// Main Page
// ---------------------------------------------------
export default function IncomePage() {
  const t = useTranslations("Income");
  const locale = useLocale();

  const [data, setData] = useState(null);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");

  const [loading, setLoading] = useState(false);
  const [incomeResult, setIncomeResult] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [skippedSaving, setSkippedSaving] = useState(false);

  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  // ---------------------------------------------------
  // Load Dashboard Data
  // ---------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.user) setData(json);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  // ---------------------------------------------------
  // Validation
  // ---------------------------------------------------
  const AMOUNT_MIN = 1;
  const AMOUNT_MAX = 1000000000000;

  const validateAmt = (val) => {
    const n = Number(val);
    if (val === "" || isNaN(n)) return "Amount must be at least ₹1";
    if (n < AMOUNT_MIN) return "Amount must be at least ₹1";
    if (n > AMOUNT_MAX) return "Amount exceeds allowed limit";
    return "";
  };

  const handleAmountChange = (val) => {
    setAmount(val);
    setAmountError(validateAmt(val));
  };

  // ---------------------------------------------------
  // Razorpay Payment + Income API
  // ---------------------------------------------------
  const handleLogIncome = async (e) => {
    e.preventDefault();

    const err = validateAmt(amount);
    if (err) { setAmountError(err); return; }

    try {
      setLoading(true);
      const finalAmount = Number(amount);

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount }),
      });

      const order = await orderRes.json();

      if (!order.id) {
        alert("Unable to create payment order");
        setLoading(false);
        return;
      }

      const options = {
        key: "rzp_test_SZjo6Gu3NpZkpo",
        amount: order.amount,
        currency: "INR",
        name: "Smart Savings",
        description: "Income Payment",
        order_id: order.id,

        handler: async function () {
          try {
            const incomeRes = await fetch("/api/actions/income", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ amount: finalAmount }),
            });

            const result = await incomeRes.json();

            if (result.success) {
              setIncomeResult(result);
            } else {
              alert(result.error || "Income failed");
            }
          } catch {
            alert("Payment success but income update failed");
          }
        },

        theme: { color: "#1ED760" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      alert("Payment failed");
    }

    setLoading(false);
  };

  // ---------------------------------------------------
  // Save Suggested Amount
  // ---------------------------------------------------
  const handleInstantSave = async () => {
    try {
      setIsSaving(true);

      const finalAmountToSave =
        showCustom && customAmount
          ? Number(customAmount)
          : incomeResult.suggested_saving;

      if (finalAmountToSave <= 0) {
        alert("Enter valid amount");
        setIsSaving(false);
        return;
      }

      const res = await fetch("/api/actions/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmountToSave, source: "bank" }),
      });

      const result = await res.json();

      if (result.success) {
        setSkippedSaving(false);
        setSaveSuccess(true);
      } else {
        alert(result.error || "Save failed");
      }
    } catch {
      alert("Save failed");
    }

    setIsSaving(false);
  };

  // ---------------------------------------------------
  // Keep all as spendable
  // ---------------------------------------------------
  const handleKeepAllSpendable = () => {
    setSkippedSaving(true);
    setSaveSuccess(true);
  };

  // ---------------------------------------------------
  // Render: page skeleton while data loads
  // ---------------------------------------------------
  if (!data) return <PageSkeleton />;

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fade-up 0.4s ease both; }
      `}</style>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      {/* Overlay while payment is being initiated */}
      {loading && (
        <ActionOverlay
          message="Opening Payment…"
          subMessage="Please complete the Razorpay checkout"
        />
      )}

      {/* Overlay while saving */}
      {isSaving && (
        <ActionOverlay
          message="Saving your money…"
          subMessage="Transferring to your savings vault"
        />
      )}

      <div className="min-h-screen bg-[#0B0F0E] text-white p-4 md:p-12 pb-32">
        <div className="max-w-2xl mx-auto space-y-8 md:space-y-12">

          {/* Header */}
          <header className="flex items-center gap-6 animate-fade-up">
            <Link
              href={`/${locale}/dashboard`}
              className="w-12 h-12 rounded-2xl card-secondary flex items-center justify-center hover:text-white transition-colors text-slate-400"
            >
              <ArrowLeft size={20} />
            </Link>

            <div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                {t("title")}
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                Add Income via Razorpay
              </p>
            </div>
          </header>

          {/* Step 1 — Enter amount */}
          {!incomeResult && (
            <form
              onSubmit={handleLogIncome}
              className="card-primary p-8 md:p-12 space-y-8 animate-fade-up"
            >
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-4">
                  How much did you earn?
                </label>

                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-extrabold text-[#1ED760]">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    min="1"
                    required
                    className="input-premium py-6 pl-14 pr-6 text-5xl font-extrabold rounded-[24px]"
                  />
                </div>

                {amountError && (
                  <p className="text-red-400 text-xs mt-3">{amountError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-5 text-lg disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <ButtonSpinner />
                    Preparing payment…
                  </>
                ) : (
                  <>
                    Pay & Add Income <ArrowRight size={22} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2 — Save suggestion */}
          {incomeResult && !saveSuccess && (
            <div className="card-primary p-8 md:p-12 space-y-8 animate-fade-up border-[#1ED760]/30 bg-[#1ED760]/5">

              <div>
                <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-white">Transaction Successful</h2>
                <p className="text-slate-400 font-medium">
                  We recommend saving some money instantly.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="card-secondary p-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Spendable Balance
                  </p>
                  <p className="text-3xl font-extrabold text-white">
                    ₹
                    {(
                      Number(amount) - incomeResult.suggested_saving
                    ).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="card-secondary border-[#1ED760]/30 bg-[#1ED760]/10 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#1ED760] mb-2">
                    Suggested Saving
                  </p>
                  <p className="text-3xl font-extrabold text-[#1ED760]">
                    ₹{incomeResult.suggested_saving.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {!showCustom && (
                <button
                  onClick={() => setShowCustom(true)}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors underline"
                >
                  Edit custom amount
                </button>
              )}

              {showCustom && (
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Enter custom amount"
                  className="input-premium p-4 text-xl"
                />
              )}

              {/* Save Now */}
              <button
                onClick={handleInstantSave}
                disabled={isSaving}
                className="btn-primary w-full py-5 text-lg disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <ButtonSpinner />
                    Saving…
                  </>
                ) : (
                  <>
                    Save Now <ShieldCheck size={22} />
                  </>
                )}
              </button>

              {/* Keep all as spendable */}
              <button
                onClick={handleKeepAllSpendable}
                disabled={isSaving}
                className="btn-secondary w-full py-4 text-sm flex items-center justify-center gap-2"
              >
                <Wallet size={20} />
                Keep all as spendable
              </button>

            </div>
          )}

          {/* Step 3 — Success */}
          {saveSuccess && (
            <div className="card-primary p-12 text-center animate-fade-up">

              <div className="w-24 h-24 rounded-full bg-[#1ED760]/10 border border-[#1ED760]/20 mx-auto flex items-center justify-center mb-8">
                {skippedSaving ? (
                  <Wallet size={48} className="text-[#1ED760]" />
                ) : (
                  <CheckCircle2 size={48} className="text-[#1ED760]" />
                )}
              </div>

              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
                {skippedSaving ? "Transaction Complete" : "Saved Securely"}
              </h2>

              <p className="text-slate-400 font-medium mb-10">
                {skippedSaving
                  ? "Your full income is available as spendable balance."
                  : "Your money has been transferred to savings."}
              </p>

              <Link
                href={`/${locale}/dashboard`}
                className="btn-primary inline-block px-10 py-4 text-lg"
              >
                Return Dashboard
              </Link>
            </div>
          )}

        </div>
      </div>
    </>
  );
}