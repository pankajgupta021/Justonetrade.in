import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | JustOneTrade",
  description: "Terms and conditions for JustOneTrade.in",
};

export default function TermsPage() {
  return (
    <div className="flex-1 py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Terms & Conditions</h1>
        
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="font-medium text-foreground">
            By accessing and using JustOneTrade.in, you agree to the following terms and conditions:
          </p>

          <ol className="list-decimal pl-5 space-y-4">
            <li>
              <strong className="text-foreground">Objective of the Website:</strong> The objective of this website is to provide Training and Education to users on how the stock markets move. They move up and down regularly on intervals which can be as small as 5 minutes or as large as 1 hour to 1 day.
            </li>
            
            <li>
              <strong className="text-foreground">Proprietary Trading System:</strong> The creators of this website have extensive experience learning the various technical indicators designed by experts and have designed a proprietary trading system which uses one or more technical indicators depending on the market.
            </li>
            
            <li>
              <strong className="text-foreground">No Guarantee of Returns:</strong> These indicators do not guarantee the market movement but only help you anticipate or guestimate the market movement. Once you have learned the system enough, you may be able to enter the market and exit the market to make a trade. You enter and exit the market only at your own risk and this website does not provide any tips for trading nor does it provide any guarantee of any assured returns. The website is purely for learning about the system and the indicators.
            </li>
            
            <li>
              <strong className="text-foreground">Fee Structure:</strong> The fee structure is designed by the number of hours of tutorials you can avail yourself of in a month.
            </li>
            
            <li>
              <strong className="text-foreground">User Data Accuracy:</strong> All members are required to provide correct data about their country, phone number, billing address to ensure proper transactions.
            </li>
            
            <li>
              <strong className="text-foreground">Data Security:</strong> The data is fully secure as our data servers are hosted in the US.
            </li>
            
            <li>
              <strong className="text-foreground">User Eligibility & Account Rules:</strong> Any users can use this website irrespective of the age limit, geographic restrictions provided they adhere to company policy.
            </li>
            
            <li>
              <strong className="text-foreground">Data Privacy:</strong> We strictly follow data privacy rules for data collection and consent protocols aligned with India&apos;s Digital Personal Data Protection Act.
            </li>
            
            <li>
              <strong className="text-foreground">Financial Disclosures & Refunds:</strong> There are no hidden costs in the payment of fee. Once you take a paid plan, you become eligible to take tutorials online. If you request a refund, all your fee will be fully refunded under financial transparency standards, within 7 days (local refund) and 15 days (international refunds).
            </li>
            
            <li>
              <strong className="text-foreground">No Hidden Costs:</strong> There are no hidden costs in the fee structure.
            </li>
            
            <li>
              <strong className="text-foreground">KYC & AML Compliance:</strong> All users must adhere to identity verification rules and laws (SSN, Driver&apos;s License, PAN, Aadhaar, and other official IDs as required by the law of users&apos; country). Non-compliant accounts will be immediately suspended.
            </li>
            
            <li>
              <strong className="text-foreground">Third-Party & API Disclaimers:</strong> We are currently accepting only credit card payments. We are based out of India and our financial transaction partner is Razorpay under the statutory guidelines laid out by the Reserve Bank of India (RBI).
            </li>
            
            <li>
              <strong className="text-foreground">Dispute Resolution:</strong> Any disputes will be arbitrated under the legal jurisdiction, governing laws, and arbitration procedures for resolving financial grievances in India.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
