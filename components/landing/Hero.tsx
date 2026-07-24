"use client";

import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BarChart2 } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium mb-6">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
              NIFTY 50 Exclusive
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Institutional-Grade <br className="hidden sm:block" />
            <span className="text-muted-foreground">NIFTY Market Signals</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl"
          >
            Get clear, actionable, and real-time NIFTY index signals delivered directly to your WhatsApp. Designed for focused, disciplined market participants.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Link href="/signup" className={buttonVariants({ size: "lg", className: "rounded-full px-8 h-12" })}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg", className: "rounded-full px-8 h-12" })}>
              Login
            </Link>
          </motion.div>

          {/* Minimal visual representation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="w-full mt-16 max-w-3xl mx-auto relative rounded-2xl border bg-card p-2 shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 bottom-0 h-1/2 pointer-events-none" />
            <div className="rounded-xl border bg-muted/20 p-6 flex flex-col gap-4 relative z-0 h-[250px] overflow-hidden">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">NIFTY 50 Signal</span>
                </div>
                <span className="text-xs text-muted-foreground">10:15 AM</span>
              </div>
              <div className="space-y-4 pt-2">
                <div className="h-4 w-1/3 bg-muted rounded"></div>
                <div className="h-10 w-full bg-muted rounded"></div>
                <div className="h-4 w-2/3 bg-muted rounded"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
