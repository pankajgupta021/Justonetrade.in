"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function RazorpayCheckout() {
  const [isLoading, setIsLoading] = useState<"one-time" | "recurring" | null>(null);
  const router = useRouter();

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (mode: "one-time" | "recurring") => {
    setIsLoading(mode);
    try {
      const res = await initializeRazorpay();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setIsLoading(null);
        return;
      }

      const endpoint = mode === "one-time" 
        ? "/api/payments/create-order" 
        : "/api/payments/create-subscription";

      const initRes = await fetch(endpoint, { method: "POST" });
      const data = await initRes.json();

      if (!data.success) {
        alert(data.error || "Failed to initialize payment");
        setIsLoading(null);
        return;
      }

      const options: any = {
        key: data.data.keyId,
        name: "JustOneTrade",
        description: mode === "one-time" ? "30-Day Premium Pass" : "Monthly Premium Subscription",
        handler: async function (response: any) {
          // Verify payment signature
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id || response.razorpay_subscription_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert("Payment Successful! Your subscription is now active.");
            router.refresh();
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: function() {
            setIsLoading(null);
          }
        },
        theme: {
          color: "#0f172a",
        },
      };

      if (mode === "one-time") {
        options.order_id = data.data.id;
        options.amount = data.data.amount.toString();
        options.currency = data.data.currency;
      } else {
        options.subscription_id = data.data.subscription_id;
      }

      // @ts-ignore
      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response: any) {
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
    <div className="flex flex-col gap-4 w-full sm:w-auto">
      <Button 
        onClick={() => handlePayment("recurring")} 
        disabled={isLoading !== null}
        className="w-full"
      >
        {isLoading === "recurring" ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
        ) : (
          "Subscribe Monthly ($39/mo)"
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button 
        variant="outline"
        onClick={() => handlePayment("one-time")} 
        disabled={isLoading !== null}
        className="w-full"
      >
        {isLoading === "one-time" ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
        ) : (
          "Buy 30-Day Pass ($39)"
        )}
      </Button>
    </div>
  );
}
