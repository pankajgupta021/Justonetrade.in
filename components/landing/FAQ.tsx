"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the subscription work?",
    answer: "Once you subscribe, you will gain access to our private WhatsApp group where all NIFTY market signals are posted in real-time. Your subscription is billed monthly and you can cancel at any time.",
  },
  {
    question: "How are signals delivered?",
    answer: "All signals are delivered exclusively via WhatsApp to ensure you receive notifications instantly on your mobile device, wherever you are.",
  },
  {
    question: "Is trading automated?",
    answer: "No, we only provide informational market signals. You are entirely responsible for executing your own trades on your preferred brokerage platform.",
  },
  {
    question: "Which market is covered?",
    answer: "Our service is 100% focused on the NIFTY 50 index. We do not provide signals for other indices, stocks, forex, or crypto markets.",
  },
  {
    question: "How does WhatsApp access work?",
    answer: "After completing your payment, you will receive a secure invite link to our broadcast list/group on WhatsApp. Simply tap the link to join and start receiving signals.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Clear answers to common questions about our NIFTY signal service.
          </p>
        </div>

        <Accordion className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
