"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What market does the platform focus on?",
    answer: "The platform focuses specifically on SPX Index Options.",
  },
  {
    question: "How do I become a subscriber?",
    answer: "Create an account, select a subscription plan, and complete the payment process.",
  },
  {
    question: "How will I receive chart studies?",
    answer: "Active students receive technical chart studies and analysis setups through a private WhatsApp group after access is granted by the instructor.",
  },
  {
    question: "Are trade signals or recommendations provided?",
    answer: "No. The platform does not provide buy/sell signals or financial advice. All chart setups and patterns are generated strictly for educational and training purposes.",
  },
  {
    question: "Does the platform automatically send WhatsApp messages?",
    answer: "No. The platform prepares a pre-filled educational chart study, which the instructor reviews and manually sends through WhatsApp.",
  },
  {
    question: "How do I get WhatsApp access?",
    answer: "After successful payment and subscription activation, the admin will process your access to the private WhatsApp study group.",
  },
  {
    question: "Does the platform guarantee profits?",
    answer: "No. The platform is purely educational. We do not guarantee profits or investment returns. Trading and investing involve risk, and users should make their own decisions.",
  }
];

export function FAQ() {
  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Clear answers to common questions about our SPX charting education.
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
