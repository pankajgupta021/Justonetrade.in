"use client";

import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TechnicalStudyChart } from "@/components/shared/TechnicalStudyChart";

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
              SPX Chart Technical Analysis
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            SPX Technical Analysis & Chart Education, <br className="hidden sm:block" />
            <span className="text-muted-foreground">Mastering Options.</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl"
          >
            Access a focused platform for Education and Training on Technical Analysis and Charts of the SPX Index. Subscribe, get approved for the private WhatsApp group, and receive real-time educational chart studies directly from the instructor.
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

          {/* Live Technical Analysis Study Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-full mt-14 max-w-4xl mx-auto"
          >
            <TechnicalStudyChart defaultTimeframe="5" height={480} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
