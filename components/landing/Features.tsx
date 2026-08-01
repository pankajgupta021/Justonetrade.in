"use client";

import { motion } from "framer-motion";
import { Target, Activity, Lock, Smartphone } from "lucide-react";

const features = [
  {
    icon: Target,
    title: "SPX Index Options Focused",
    description: "Focused specifically on SPX Index Options.",
  },
  {
    icon: Activity,
    title: "Expert Chart Analysis",
    description: "Chart setups are analyzed and created by the instructor before being manually shared with students.",
  },
  {
    icon: Lock,
    title: "Private Study Group Access",
    description: "Access to a private WhatsApp group for active students to discuss chart studies.",
  },
  {
    icon: Smartphone,
    title: "Simple Subscription Flow",
    description: "Register, subscribe, and manage your subscription from your dashboard.",
  },
];

export function Features() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Platform Features</h2>
          <p className="text-muted-foreground">
            Everything you need for disciplined market participation, delivered with absolute clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex gap-6"
            >
              <div className="flex-shrink-0 mt-1">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
