"use client";

import { motion } from "framer-motion";

export function AboutUs() {
  return (
    <section id="about-us" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight mb-6">About Us</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We are a team of dedicated technical analysts passionate about market dynamics. We specialize in studying complex price action patterns, trend analysis, and indicators. Our mission is to share our chart setups and analysis strictly for educational purposes, helping you understand how technical criteria apply to the SPX index.
            <br className="hidden sm:block" />
            <br className="hidden sm:block" />
            We offer chart studies, pattern walkthroughs, and technical analysis training to help you master market concepts.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
