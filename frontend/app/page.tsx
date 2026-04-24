import { Shield, AlertTriangle, Mic, TrendingUp, Quote } from "lucide-react";
import Link from "next/link";

const features = [
  {
    Icon: Shield,
    title: "100% Private",
    desc: "Raw data never leaves your server. Only schemas are sent.",
  },
  {
    Icon: AlertTriangle,
    title: "Risk Radar",
    desc: "Instantly flags anomalies, duplicates, and missing data.",
  },
  {
    Icon: Mic,
    title: "Voice Q&A",
    desc: "Speak naturally to query your financial data instantly.",
  },
  {
    Icon: TrendingUp,
    title: "What-If Engine",
    desc: "Model hypothetical scenarios and see projected impacts.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">

      {/* ═══ Hero ═══ */}
      <section className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 relative z-10">
        {/* Shield icon */}
        <div className="mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-8xl sm:text-9xl font-extrabold tracking-widest bg-gradient-to-b from-white via-blue-100 to-blue-500 bg-clip-text text-transparent select-none">
          AEGIS
        </h1>

        {/* Tagline */}
        <p className="mt-6 text-xl sm:text-2xl font-medium text-slate-400 tracking-wide">
          Your Privacy-First AI CFO.
        </p>

        {/* Subtext */}
        <p className="mt-5 max-w-2xl text-base text-slate-500 leading-relaxed">
          Stop waiting days for Excel models. Upload your raw data, ask questions
          with your voice, and model the future in seconds&mdash;without your
          data ever leaving your server.
        </p>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="mt-10 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-base font-medium px-8 py-3 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_32px_rgba(37,99,235,0.35)] transition-all duration-200"
        >
          Launch Command Center
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </section>

      {/* ═══ Features Grid ═══ */}
      <section className="px-4 pb-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch max-w-7xl mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="h-full flex flex-col bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <f.Icon className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Case Study ═══ */}
      <section className="px-6 relative z-10">
        <p className="text-center text-slate-400 uppercase tracking-widest text-sm font-semibold mb-8 pt-32">
          Trusted by Modern Finance Teams
        </p>

        <div className="max-w-6xl mx-auto mb-20 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-[2rem] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">

            {/* Left — Profile & ROI */}
            <div className="lg:col-span-2 p-10 border-b lg:border-b-0 lg:border-r border-slate-800/50 bg-slate-900/20 flex flex-col justify-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6 flex items-center justify-center text-white text-2xl font-bold select-none">
                SC
              </div>
              <p className="text-xl font-bold text-white">Sarah Chen</p>
              <p className="text-slate-400 mt-1">CFO, Nexus HealthTech</p>

              <div className="mt-8 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">The Old Way:</span>
                  <span className="text-slate-500 line-through ml-2">3 Days of VLOOKUPs</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">The Aegis Way:</span>
                  <span className="text-emerald-400 font-semibold ml-2">10 Seconds to Insight</span>
                </div>
              </div>
            </div>

            {/* Right — Quote */}
            <div className="lg:col-span-3 p-10 lg:p-14 flex flex-col justify-center">
              <Quote className="w-10 h-10 text-blue-500/30 mb-6 -scale-x-100" />
              <p className="text-2xl md:text-3xl font-medium text-slate-100 leading-tight mb-6">
                Aegis turned our finance department from a rearview mirror into a radar.
              </p>
              <p className="text-lg text-slate-400 leading-relaxed">
                We were trapped between slow BI dashboards and unsecure public AI.
                Preparing for board meetings meant days buried in Excel. Now, I drop
                our raw exports into the Command Center, and it instantly flags cash
                flow risks. When the board asks about a 20% drop in renewals, I just
                use my voice. Aegis generates a complete impact dashboard in 10 seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer CTA ═══ */}
      <Link
        href="/dashboard"
        className="text-blue-400 hover:text-blue-300 transition-colors pb-12 block text-center relative z-10"
      >
        Enter Command Center &rarr;
      </Link>
    </div>
  );
}
