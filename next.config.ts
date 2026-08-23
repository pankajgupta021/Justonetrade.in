import type { NextConfig } from "next";

const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://s3.tradingview.com https://*.tradingview.com https://www.tradingview.com https://*.tradingview-widget.com https://tradingview-widget.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' wss://ws.finnhub.io wss://ws.twelvedata.com https://api.twelvedata.com https://api.razorpay.com https://formspree.io https://query1.finance.yahoo.com https://web.whatsapp.com https://*.tradingview.com wss://*.tradingview.com https://s3.tradingview.com https://*.tradingview-widget.com wss://*.tradingview-widget.com https://tradingview-widget.com",
  "img-src 'self' data: blob: https: https://*.tradingview.com https://*.tradingview-widget.com",
  "frame-src 'self' https://api.razorpay.com https://www.tradingview.com https://*.tradingview.com https://s.tradingview.com https://*.tradingview-widget.com https://tradingview-widget.com https://www.tradingview-widget.com https://s.tradingview-widget.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://formspree.io",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
];

const nextConfig: NextConfig = {
  // Note: @whiskeysockets/baileys has been moved to the standalone whatsapp-worker.
  // It is no longer imported by any Next.js server code.
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
