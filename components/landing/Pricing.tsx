"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground">
            One subscription. Full access. No hidden fees or complex tiers.
          </p>
        </div>

        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Card className="border-2 border-primary/20 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-primary"></div>
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2">Premium Access</CardTitle>
                <CardDescription>Everything you need for SPX Options trading</CardDescription>
                <div className="mt-6 flex items-baseline justify-center gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-foreground">₹2,999</span>
                  <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="px-8">
                <ul className="space-y-4 text-sm leading-6 text-muted-foreground">
                  <li className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                    Real-time SPX Index Options signals
                  </li>
                  <li className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                    Instant WhatsApp delivery
                  </li>
                  <li className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                    Private subscriber community
                  </li>
                  <li className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
                    Cancel anytime
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="px-8 pb-8 pt-4">
                <Link href="/signup" className={buttonVariants({ size: "lg", className: "w-full py-6 text-md rounded-xl" })}>
                  Subscribe Now
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
