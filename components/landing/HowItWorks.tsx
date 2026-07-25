"use client";

import { motion } from "framer-motion";
import { UserPlus, CreditCard, CheckCircle, MessageCircle } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "1. Create Your Account",
    description: "Sign up and create your account in a few simple steps.",
  },
  {
    icon: CreditCard,
    title: "2. Choose Your Plan",
    description: "Select the subscription plan that suits you and complete your payment securely.",
  },
  {
    icon: CheckCircle,
    title: "3. Get Approved",
    description: "After successful payment, your subscription is activated and your WhatsApp access is processed by the provider.",
  },
  {
    icon: MessageCircle,
    title: "4. Receive Signals",
    description: "Once access is granted, receive SPX Index Options signals through the private WhatsApp group.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">How It Works</h2>
          <p className="text-muted-foreground">
            A seamless onboarding experience designed to get you connected to our market intelligence as quickly as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border shadow-sm"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
