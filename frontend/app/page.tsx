/**
 * Aegis Landing Page - Privacy-First AI CFO
 */
"use client";

import { Shield, Lock, Clock, Ghost, Upload, Brain, Mic, AlertTriangle } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b" style={{ background: 'var(--overlay)', borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
              <span className="font-bold text-sm" style={{ color: 'var(--text-on-accent)' }}>A</span>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>AEGIS</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              Enter App &rarr;
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="mb-6 inline-block">
            <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h1 className="text-7xl md:text-8xl font-bold mb-6 tracking-tight" style={{ color: 'var(--accent-primary)' }}>
            AEGIS
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
            Your Privacy-First AI CFO
          </h2>
          <p className="text-xl mb-12 max-w-3xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Upload your financial data. Get enterprise-grade intelligence in seconds.
            <br />
            <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>Fully private, fully local.</span>
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg transition-colors text-lg font-semibold"
            style={{ background: 'var(--accent-primary)', color: 'var(--text-on-accent)', boxShadow: '0 0 30px var(--shadow-glow)' }}
          >
            Launch Aegis &rarr;
          </Link>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-6" style={{ background: 'color-mix(in srgb, var(--bg-card) 30%, transparent)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: 'var(--text-primary)' }}>
            Sound familiar?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Problem 1 */}
            <div className="border-2 rounded-xl p-8 transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'color-mix(in srgb, var(--status-critical) 20%, transparent)' }}>
                <Lock className="w-6 h-6" style={{ color: 'var(--status-critical)' }} />
              </div>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                You can&apos;t upload payroll or bank data into ChatGPT. It{" "}
                <span className="font-semibold" style={{ color: 'var(--status-critical)' }}>violates privacy laws.</span>
              </p>
            </div>

            {/* Problem 2 */}
            <div className="border-2 rounded-xl p-8 transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'color-mix(in srgb, var(--status-warning) 20%, transparent)' }}>
                <Clock className="w-6 h-6" style={{ color: 'var(--status-warning)' }} />
              </div>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                Getting answers takes{" "}
                <span className="font-semibold" style={{ color: 'var(--status-warning)' }}>3 days</span> and a
                spreadsheet with{" "}
                <span className="font-semibold" style={{ color: 'var(--status-warning)' }}>47 VLOOKUPs.</span>
              </p>
            </div>

            {/* Problem 3 */}
            <div className="border-2 rounded-xl p-8 transition-colors" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{ background: 'color-mix(in srgb, var(--status-critical) 20%, transparent)' }}>
                <Ghost className="w-6 h-6" style={{ color: 'var(--status-critical)' }} />
              </div>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                A ghost employee or duplicate invoice won&apos;t show up until the{" "}
                <span className="font-semibold" style={{ color: 'var(--status-critical)' }}>cash is gone.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16" style={{ color: 'var(--text-primary)' }}>
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "01", Icon: Upload, title: "Upload Your Files", desc: "Drop your CSV exports from Chase, Stripe, Gusto, or any tool" },
              { num: "02", Icon: Brain, title: "Aegis Analyzes Instantly", desc: "Schema-only AI means your raw data never leaves your machine" },
              { num: "03", Icon: Mic, title: "Ask Anything by Voice", desc: "Get KPIs, charts, anomaly alerts, and insights in 5 seconds" },
            ].map((step) => (
              <div key={step.num} className="relative">
                <div className="absolute -top-6 left-0">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
                    <span className="font-bold text-xl" style={{ color: 'var(--text-on-accent)' }}>{step.num}</span>
                  </div>
                </div>
                <div className="border rounded-xl p-8 pt-12" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                  <step.Icon className="w-10 h-10 mb-4" style={{ color: 'var(--accent-primary)' }} />
                  <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6" style={{ background: 'color-mix(in srgb, var(--bg-card) 30%, transparent)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16" style={{ color: 'var(--text-primary)' }}>
            What Aegis does
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="border-2 rounded-xl p-8" style={{ background: 'var(--bg-card)', borderColor: 'var(--status-healthy)' }}>
              <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-6" style={{ background: 'color-mix(in srgb, var(--status-healthy) 20%, transparent)' }}>
                <Shield className="w-8 h-8" style={{ color: 'var(--status-healthy)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                100% Private
              </h3>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Raw data never sent to any LLM.{" "}
                <span className="font-semibold" style={{ color: 'var(--status-healthy)' }}>Ever.</span>
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border-2 rounded-xl p-8" style={{ background: 'var(--bg-card)', borderColor: 'var(--status-critical)' }}>
              <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-6" style={{ background: 'color-mix(in srgb, var(--status-critical) 20%, transparent)' }}>
                <AlertTriangle className="w-8 h-8" style={{ color: 'var(--status-critical)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Forensic Auditing
              </h3>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Detects duplicate payments, ghost employees, and outliers{" "}
                <span className="font-semibold" style={{ color: 'var(--status-critical)' }}>automatically</span>
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border-2 rounded-xl p-8" style={{ background: 'var(--bg-card)', borderColor: 'var(--accent-primary)' }}>
              <div className="w-16 h-16 rounded-lg flex items-center justify-center mb-6" style={{ background: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)' }}>
                <Mic className="w-8 h-8" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Voice-Activated
              </h3>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Talk to your financial data like a{" "}
                <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>CFO assistant</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
            Your board meeting is in{" "}
            <span style={{ color: 'var(--status-warning)' }}>2 hours.</span>
          </p>
          <p className="text-2xl mb-12" style={{ color: 'var(--text-secondary)' }}>
            Aegis gives you the answers in{" "}
            <span className="font-semibold" style={{ color: 'var(--accent-primary)' }}>5 seconds.</span>
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-10 py-5 rounded-lg transition-colors text-xl font-bold"
            style={{ background: 'var(--accent-primary)', color: 'var(--text-on-accent)', boxShadow: '0 0 40px var(--shadow-glow)' }}
          >
            Get Started &rarr;
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
              <span className="font-bold text-sm" style={{ color: 'var(--text-on-accent)' }}>A</span>
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>AEGIS</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            &copy; 2024 Aegis. Privacy-first financial intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}
