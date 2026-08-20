"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Crown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-3 px-3 py-1 bg-primary/10 text-primary border-primary/20">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Flexible Plans for Every Trainee/Trader
          </h2>
          <p className="text-muted-foreground">
            Start with our 2-day free trial or choose a monthly or yearly pass. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

          {/* Card 1: 2-Day Free Trial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex"
          >
            <Card className="border border-emerald-500/30 bg-card shadow-md relative overflow-hidden flex flex-col justify-between w-full hover:border-emerald-500/60 transition-all">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-500"></div>
              <CardHeader className="text-center pb-6 pt-6">
                <div className="flex justify-center mb-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 mr-1" /> 2-Day Free Trial
                  </Badge>
                </div>
                <CardTitle className="text-xl">Trial Access</CardTitle>
                <CardDescription>Test live SPX signals with 0 risk</CardDescription>
                <div className="mt-4 flex items-baseline justify-center gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">₹0</span>
                  <span className="text-xs font-semibold text-muted-foreground">/ 48 hours</span>
                </div>
              </CardHeader>
              <CardContent className="px-6 flex-1">
                <ul className="space-y-3 text-xs leading-5 text-muted-foreground">
                  <li className="flex gap-x-2">
                    <Check className="h-4 w-4 flex-none text-emerald-500" />
                    Real-time SPX Options chart setups
                  </li>
                  <li className="flex gap-x-2">
                    <Check className="h-4 w-4 flex-none text-emerald-500" />
                    Instant WhatsApp delivery
                  </li>
                  <li className="flex gap-x-2">
                    <Check className="h-4 w-4 flex-none text-emerald-500" />
                    Private subscriber community
                  </li>
                  <li className="flex gap-x-2">
                    <Check className="h-4 w-4 flex-none text-emerald-500" />
                    No credit card required
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-2">
                <Link
                  href="/signup"
                  className={buttonVariants({
                    size: "default",
                    className: "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg"
                  })}
                >
                  Start Free Trial
                </Link>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Card 2: Monthly Pass */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex"
          >
            <Card className="border border-primary/20 bg-card shadow-md relative overflow-hidden flex flex-col justify-between w-full hover:border-primary/50 transition-all">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-primary"></div>
              <CardHeader className="text-center pb-6 pt-6">
                <div className="flex justify-center mb-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-bold uppercase tracking-wider">
                    Monthly Pass
                  </Badge>
                </div>
                <CardTitle className="text-xl">Monthly Access</CardTitle>
                <CardDescription>Full 30-day SPX Options training</CardDescription>
                <div className="mt-4 flex items-baseline justify-center gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">₹10,000</span>
                  <span className="text-xs font-semibold text-muted-foreground">/ month</span>
                </div>
              </CardHeader>
              <CardContent className="px-6 flex-1">
                <ul className="space-y-3 text-xs leading-5 text-muted-foreground">
                  <li className="flex gap-x-2">
                    <Check className="h-4 w-4 flex-none text-primary" />
                    All daily SPX Options chart insights
                  </li>
                  <li className="flex gap-x-2">
                    <Check className="h-4 w-4 flex-none text-primary" />
                    Instant WhatsApp notifications
                  </li>
                  <li className="flex gap-x-2">
                    <Check className="h-4 w-4 flex-none text-primary" />
                    Subscriber chat access
                  </li>
                  <li className="flex gap-x-2">
                    <Check className="h-4 w-4 flex-none text-primary" />
                    Renew anytime with 1 click
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-2">
                <Link
                  href="/signup"
                  className={buttonVariants({
                    size: "default",
                    className: "w-full rounded-lg font-bold"
                  })}
                >
                  Get Monthly Pass
                </Link>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Card 3: Yearly VIP Pass */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex"
          >
            <Card className="border-2 border-primary bg-primary/5 shadow-xl relative overflow-hidden flex flex-col justify-between w-full">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Save ₹20,000
              </div>
              <CardHeader className="text-center pb-6 pt-6">
                <div className="flex justify-center mb-2">
                  <Badge className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                    <Crown className="w-3.5 h-3.5 mr-1" /> Yearly VIP
                  </Badge>
                </div>
                <CardTitle className="text-xl">Annual VIP Pass</CardTitle>
                <CardDescription>365 days of full technical setups</CardDescription>
                <div className="mt-4 flex items-baseline justify-center gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-foreground">₹1,00,000</span>
                  <span className="text-xs font-semibold text-muted-foreground">/ year</span>
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Includes 2 Months Free (Save ₹20,000)</span>
              </CardHeader>
              <CardContent className="px-6 flex-1">
                <ul className="space-y-3 text-xs leading-5 text-muted-foreground">
                  <li className="flex gap-x-2">
                    <Check className="h-4 w-4 flex-none text-primary" />
                    Complete year of SPX market signals
                  </li>
                  <li className="flex gap-x-2">
                    <Check className="h-4 w-4 flex-none text-primary" />
                    VIP priority WhatsApp access
                  </li>
                  <li className="flex gap-x-2">
                    <Check className="h-4 w-4 flex-none text-primary" />
                    Exclusive subscriber community
                  </li>
                  <li className="flex gap-x-2">
                    <Check className="h-4 w-4 flex-none text-primary" />
                    Best value (Save 17%)
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="px-6 pb-6 pt-2">
                <Link
                  href="/signup"
                  className={buttonVariants({
                    size: "default",
                    className: "w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold shadow-md"
                  })}
                >
                  Get Yearly Pass
                </Link>
              </CardFooter>
            </Card>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
