"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Check, ShieldCheck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

interface RazorpayCheckoutProps {
  hasUsedTrial?: boolean;
  onSuccess?: () => void;
}

export function RazorpayCheckout({ hasUsedTrial = false, onSuccess }: RazorpayCheckoutProps) {
  const [isLoading, setIsLoading] = useState<"trial" | "monthly" | "yearly" | "recurring" | null>(null);
  const router = useRouter();

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleStartTrial = async () => {
    setIsLoading("trial");
    try {
      const res = await fetch("/api/subscription/start-trial", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        alert("🎉 Trial request submitted! The admin will add your phone number to the private WhatsApp signal group shortly. Your 48-hour trial timer will begin as soon as you are added.");
        onSuccess?.();
        router.refresh();
      } else {
        alert(data.error || "Failed to start free trial.");
      }
    } catch (err) {
      console.error("Error activating trial:", err);
      alert("Something went wrong while starting your trial. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  const handlePayment = async (plan: "monthly" | "yearly" | "recurring") => {
    setIsLoading(plan);
    try {
      const res = await initializeRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setIsLoading(null);
        return;
      }

      const endpoint = plan === "recurring"
        ? "/api/payments/create-subscription"
        : "/api/payments/create-order";

      const body = plan === "recurring" ? {} : { plan };

      const initRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await initRes.json();

      if (!data.success) {
        alert(data.error || "Failed to initialize payment.");
        setIsLoading(null);
        return;
      }

      const description = plan === "yearly"
        ? "365-Day VIP Annual Pass"
        : plan === "monthly"
          ? "30-Day Premium Pass"
          : "Monthly Premium Subscription";

      const options = {
        key: data.data.keyId,
        name: "JustOneTrade",
        description,
        order_id: plan !== "recurring" ? data.data.id : undefined,
        subscription_id: plan === "recurring" ? data.data.subscription_id : undefined,
        amount: plan !== "recurring" ? data.data.amount?.toString() : undefined,
        currency: data.data.currency || "INR",
        handler: async function (response: {
          razorpay_order_id?: string;
          razorpay_subscription_id?: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id || undefined,
              razorpay_subscription_id: response.razorpay_subscription_id || undefined,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert("🎉 Payment Successful! The admin will add your phone number to the private WhatsApp signal group shortly.");
            onSuccess?.();
            router.refresh();
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(null);
          },
        },
        theme: {
          color: "#0f172a",
        },
      };

      type RazorpayInstance = {
        open: () => void;
        on: (event: string, handler: (resp: { error: { description: string } }) => void) => void;
      };

      const RazorpayConstructor = (window as unknown as { Razorpay: new (opts: typeof options) => RazorpayInstance }).Razorpay;
      const paymentObject = new RazorpayConstructor(options);

      paymentObject.on("payment.failed", function (response) {
        console.error("Payment failed", response.error);
        alert(`Payment Failed: ${response.error.description}`);
        setIsLoading(null);
      });

      paymentObject.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("An unexpected error occurred. Please try again.");
      setIsLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 3-Tier Pricing Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">

        {/* Tier 1: 2-Day Free Trial */}
        <div className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${hasUsedTrial
          ? "bg-muted/40 border-border opacity-70"
          : "bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-500/60 shadow-sm"
          }`}>
          <div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                Free Trial
              </Badge>
              {!hasUsedTrial && (
                <Sparkles className="w-4 h-4 text-emerald-500" />
              )}
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold">₹0</div>
              <p className="text-xs text-muted-foreground mt-0.5">48 Hours Full Access</p>
            </div>

            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Real-time SPX Options signals</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Instant WhatsApp group access</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>No credit card required</span>
              </li>
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t">
            <Button
              onClick={handleStartTrial}
              disabled={isLoading !== null || hasUsedTrial}
              className={`w-full text-xs font-bold ${hasUsedTrial
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                }`}
            >
              {isLoading === "trial" ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Activating...</>
              ) : hasUsedTrial ? (
                "Trial Already Claimed"
              ) : (
                <><Zap className="w-3.5 h-3.5 mr-1" /> Start 2-Day Free Trial</>
              )}
            </Button>
          </div>
        </div>

        {/* Tier 2: Monthly Pass */}
        <div className="flex flex-col justify-between p-4 rounded-xl border bg-card hover:border-primary/40 transition-all shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-bold uppercase tracking-wider">
                Monthly Pass
              </Badge>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold">₹1,000 <span className="text-xs font-normal text-muted-foreground">/ month</span></div>
              <p className="text-xs text-muted-foreground mt-0.5">30-Day Uninterrupted Access</p>
            </div>

            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>All SPX Technical Chart setups</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Full month WhatsApp signals</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>1-Click renewal anytime</span>
              </li>
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t">
            <Button
              onClick={() => handlePayment("monthly")}
              disabled={isLoading !== null}
              variant="default"
              className="w-full text-xs font-bold"
            >
              {isLoading === "monthly" ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Processing...</>
              ) : (
                "Get Monthly Pass (₹1,000)"
              )}
            </Button>
          </div>
        </div>

        {/* Tier 3: Yearly Pass (Best Value) */}
        <div className="flex flex-col justify-between p-4 rounded-xl border-2 border-primary/60 bg-primary/5 hover:border-primary transition-all shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-bl-md uppercase">
            Save ₹20,000
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                👑 Yearly VIP
              </Badge>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold">₹1,00,000 <span className="text-xs font-normal text-muted-foreground">/ year</span></div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Includes 2 Months Free (Save ₹20,000)</p>
            </div>

            <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>365 Days complete SPX signals</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>VIP WhatsApp Group Priority</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Best price guarantee (Save 17%)</span>
              </li>
            </ul>
          </div>

          <div className="mt-5 pt-3 border-t border-primary/20">
            <Button
              onClick={() => handlePayment("yearly")}
              disabled={isLoading !== null}
              className="w-full text-xs font-bold bg-primary text-primary-foreground shadow-sm"
            >
              {isLoading === "yearly" ? (
                <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Processing...</>
              ) : (
                "Get Yearly Pass (₹1,00,000)"
              )}
            </Button>
          </div>
        </div>

      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <span>Secure 256-bit encrypted checkout powered by Razorpay</span>
      </div>
    </div>
  );
}
