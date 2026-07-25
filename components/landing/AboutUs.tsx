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
            We are a team of technical analysts, enthusiastic about how the spx market moves. After a lot of research we found that there are times and patterns when we can catch a part of the market directional move. During this move, we can make good gains. 
            <br className="hidden sm:block" />
            <br className="hidden sm:block" />
            This is what we are offering as a service to our customers.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
