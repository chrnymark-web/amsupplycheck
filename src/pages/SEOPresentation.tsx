import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search, Link2, FileCode, Map, Trophy, Swords,
  Target, CheckCircle2, ArrowRight, ArrowLeft,
  Globe, Code2, FileText, BarChart3, Zap, Image,
  ShieldCheck, LinkIcon, BookOpen
} from "lucide-react";

const TOTAL_SLIDES = 13;

/* ─── Individual Slides ─── */

const Slide1 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 text-center gap-16">
    <Search className="w-32 h-32 text-blue-400" strokeWidth={1.5} />
    <h1 className="text-8xl font-bold text-white leading-tight">Hvad er SEO?</h1>
    <p className="text-4xl text-blue-200 max-w-[1400px] leading-relaxed">
      SEO = få Google til at vise din side, når folk søger.
      <br />
      <span className="text-blue-300">Jo højere du er på Google, jo flere besøgende får du.</span>
    </p>
    <div className="flex items-center gap-6 bg-white/10 rounded-2xl px-12 py-6 mt-4">
      <Search className="w-8 h-8 text-blue-300" />
      <span className="text-3xl text-white/80">3d printing service near me</span>
    </div>
  </div>
);

const Slide2 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 gap-14">
    <Link2 className="w-28 h-28 text-green-400" strokeWidth={1.5} />
    <h1 className="text-7xl font-bold text-white text-center">Smarte URLs</h1>
    <div className="flex flex-col gap-8 w-full max-w-[1400px]">
      <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-8">
        <p className="text-2xl text-red-300 mb-2 font-semibold">❌ Før</p>
        <code className="text-3xl text-red-200 break-all">/supplier/a8f3e2b1-4c7d-9e6f-...</code>
      </div>
      <div className="bg-green-500/20 border border-green-500/40 rounded-2xl p-8">
        <p className="text-2xl text-green-300 mb-2 font-semibold">✅ Efter</p>
        <code className="text-3xl text-green-200">/suppliers/protolabs</code>
      </div>
    </div>
    <p className="text-3xl text-blue-200 text-center mt-4">
      Google kan læse det. Mennesker kan læse det. Alle vinder.
    </p>
  </div>
);

const Slide3 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 gap-12">
    <Code2 className="w-28 h-28 text-purple-400" strokeWidth={1.5} />
    <h1 className="text-7xl font-bold text-white text-center">Structured Data</h1>
    <p className="text-3xl text-blue-200 text-center max-w-[1200px]">
      Vi giver Google et <span className="text-purple-300 font-semibold">snyde-ark</span> der fortæller
      præcis hvad vores sider handler om.
    </p>
    <div className="grid grid-cols-3 gap-6 mt-4">
      {[
        { icon: Globe, label: "Organization" },
        { icon: Map, label: "LocalBusiness" },
        { icon: FileText, label: "FAQ" },
        { icon: Link2, label: "Breadcrumbs" },
        { icon: BarChart3, label: "Dataset" },
        { icon: FileCode, label: "JSON-LD" },
      ].map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-4 bg-white/10 rounded-xl px-8 py-5">
          <Icon className="w-8 h-8 text-purple-300" />
          <span className="text-2xl text-white">{label}</span>
        </div>
      ))}
    </div>
  </div>
);

const Slide4 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 gap-14">
    <Map className="w-28 h-28 text-amber-400" strokeWidth={1.5} />
    <h1 className="text-7xl font-bold text-white text-center">Sitemap & Robots.txt</h1>
    <div className="flex gap-12 mt-4">
      <div className="bg-white/10 rounded-2xl p-10 flex-1">
        <h2 className="text-3xl font-bold text-amber-300 mb-4">Sitemap.xml</h2>
        <p className="text-2xl text-blue-200 leading-relaxed">
          Et <span className="text-amber-200 font-semibold">kort</span> over hele sitet
          som Google bruger til at finde alle sider.
        </p>
        <p className="text-xl text-white/50 mt-4">100+ sider indexeret</p>
      </div>
      <div className="bg-white/10 rounded-2xl p-10 flex-1">
        <h2 className="text-3xl font-bold text-amber-300 mb-4">Robots.txt</h2>
        <p className="text-2xl text-blue-200 leading-relaxed">
          <span className="text-amber-200 font-semibold">Regler</span> for hvad Google
          må og ikke må se. Admin-sider er skjulte.
        </p>
        <p className="text-xl text-white/50 mt-4">Admin routes = noindex</p>
      </div>
    </div>
  </div>
);

const Slide5 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 gap-12">
    <Trophy className="w-28 h-28 text-yellow-400" strokeWidth={1.5} />
    <h1 className="text-7xl font-bold text-white text-center">"Alternatives"-sider</h1>
    <p className="text-3xl text-blue-200 text-center max-w-[1200px]">
      Når folk søger <span className="text-yellow-300 font-semibold">"best Xometry alternatives"</span> — finder de os.
    </p>
    <div className="flex flex-col gap-4 mt-4">
      {[
        "Best Xometry Alternatives",
        "Best Protolabs Alternatives",
        "Best Hubs Alternatives",
        "Best Sculpteo Alternatives",
        "Top Manufacturing Platforms",
      ].map((title) => (
        <div key={title} className="flex items-center gap-4 bg-white/10 rounded-xl px-8 py-4">
          <ArrowRight className="w-6 h-6 text-yellow-400" />
          <span className="text-2xl text-white">{title}</span>
        </div>
      ))}
    </div>
  </div>
);

const Slide6 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 gap-12">
    <Swords className="w-28 h-28 text-rose-400" strokeWidth={1.5} />
    <h1 className="text-7xl font-bold text-white text-center">Versus & Roundups</h1>
    <p className="text-3xl text-blue-200 text-center max-w-[1200px]">
      Sider folk <span className="text-rose-300 font-semibold">aktivt søger efter</span> — og nu finder hos os.
    </p>
    <div className="grid grid-cols-2 gap-6 mt-4">
      {[
        "Xometry vs Protolabs",
        "Hubs vs Shapeways",
        "Best 3D Printing Services",
        "Best 3D Printing in Europe",
        "Best Metal 3D Printing",
        "Top CNC Machining Platforms",
      ].map((title) => (
        <div key={title} className="bg-white/10 rounded-xl px-8 py-5 text-center">
          <span className="text-2xl text-white">{title}</span>
        </div>
      ))}
    </div>
  </div>
);

const Slide7 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 gap-12">
    <LinkIcon className="w-28 h-28 text-cyan-400" strokeWidth={1.5} />
    <h1 className="text-7xl font-bold text-white text-center">Intern Linking</h1>
    <p className="text-3xl text-blue-200 text-center max-w-[1200px]">
      <span className="text-cyan-300 font-semibold">Link juice</span> flyder fra forsiden til guides — og fra leverandørsider til relevante sammenligninger.
    </p>
    <div className="flex gap-8 mt-4">
      <div className="bg-white/10 rounded-2xl p-8 flex-1 text-center">
        <BookOpen className="w-12 h-12 text-cyan-300 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Forsiden</h3>
        <p className="text-xl text-blue-200">"Comparisons & Guides" kolonne med links til alle alternatives- og roundup-sider</p>
      </div>
      <div className="bg-white/10 rounded-2xl p-8 flex-1 text-center">
        <Target className="w-12 h-12 text-cyan-300 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Leverandørsider</h3>
        <p className="text-xl text-blue-200">Dynamiske links til relevante guides baseret på supplier ID</p>
      </div>
    </div>
  </div>
);

const Slide8 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 gap-12">
    <Image className="w-28 h-28 text-teal-400" strokeWidth={1.5} />
    <h1 className="text-7xl font-bold text-white text-center">Performance</h1>
    <p className="text-3xl text-blue-200 text-center max-w-[1200px]">
      <span className="text-teal-300 font-semibold">Hurtigere sider = bedre Google-placering.</span>
      <br />Core Web Vitals er en rankingfaktor.
    </p>
    <div className="flex gap-8 mt-6">
      <div className="bg-white/10 rounded-2xl p-8 flex-1">
        <p className="text-2xl text-red-300 mb-2 font-semibold">Før</p>
        <code className="text-3xl text-red-200">logo.png — 2 MB</code>
      </div>
      <div className="bg-white/10 rounded-2xl p-8 flex-1">
        <p className="text-2xl text-green-300 mb-2 font-semibold">Efter</p>
        <code className="text-3xl text-green-200">logo.webp — ~400 KB</code>
        <p className="text-xl text-green-200/60 mt-2">~80% mindre</p>
      </div>
    </div>
    <p className="text-2xl text-blue-200/70 mt-4">Billeder konverteret til WebP for hurtigere load</p>
  </div>
);

const Slide9 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 gap-12">
    <Globe className="w-28 h-28 text-indigo-400" strokeWidth={1.5} />
    <h1 className="text-7xl font-bold text-white text-center">Custom Domæne</h1>
    <p className="text-3xl text-blue-200 text-center max-w-[1200px]">
      Sitet kører nu på <span className="text-indigo-300 font-semibold">amsupplycheck.com</span> — et professionelt, brandbart domæne.
    </p>
    <div className="flex gap-8 mt-4 w-full max-w-[1400px]">
      <div className="bg-white/10 rounded-2xl p-8 flex-1">
        <h3 className="text-2xl font-bold text-indigo-300 mb-4">Primært domæne</h3>
        <code className="text-3xl text-white">amsupplycheck.com</code>
        <p className="text-xl text-blue-200/60 mt-3">Alt SEO-værdi samles her</p>
      </div>
      <div className="bg-white/10 rounded-2xl p-8 flex-1">
        <h3 className="text-2xl font-bold text-indigo-300 mb-4">Sekundært domæne</h3>
        <code className="text-3xl text-white">supplycheck.io</code>
        <p className="text-xl text-blue-200/60 mt-3">301 redirect → amsupplycheck.com</p>
      </div>
    </div>
    <div className="flex flex-col gap-4 mt-4 w-full max-w-[1400px]">
      <div className="flex items-center gap-4 bg-green-500/15 border border-green-500/30 rounded-xl px-8 py-4">
        <CheckCircle2 className="w-7 h-7 text-green-400 flex-shrink-0" />
        <span className="text-2xl text-white">Canonical tags peger på amsupplycheck.com</span>
      </div>
      <div className="flex items-center gap-4 bg-green-500/15 border border-green-500/30 rounded-xl px-8 py-4">
        <CheckCircle2 className="w-7 h-7 text-green-400 flex-shrink-0" />
        <span className="text-2xl text-white">Sitemap, OG-tags & JSON-LD bruger amsupplycheck.com</span>
      </div>
    </div>
  </div>
);

const Slide10 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 gap-12">
    <ShieldCheck className="w-28 h-28 text-green-400" strokeWidth={1.5} />
    <h1 className="text-7xl font-bold text-white text-center">Google Search Console</h1>
    <p className="text-3xl text-blue-200 text-center max-w-[1200px]">
      Begge domæner er sat op i Search Console for fuld kontrol over indeksering.
    </p>
    <div className="flex gap-8 mt-4 w-full max-w-[1400px]">
      <div className="bg-white/10 rounded-2xl p-8 flex-1">
        <h3 className="text-2xl font-bold text-green-300 mb-4">amsupplycheck.com</h3>
        <p className="text-xl text-blue-200 mb-2">Verificeret via meta-tag</p>
        <code className="text-lg text-green-200/70 break-all">
          &lt;meta name="google-site-verification" ... /&gt;
        </code>
        <p className="text-xl text-white/50 mt-4">Sitemap indsendt her</p>
      </div>
      <div className="bg-white/10 rounded-2xl p-8 flex-1">
        <h3 className="text-2xl font-bold text-green-300 mb-4">supplycheck.io</h3>
        <p className="text-xl text-blue-200 mb-2">Verificeret via DNS TXT-record</p>
        <p className="text-xl text-white/50 mt-4">Overvåger redirect + crawl-fejl</p>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-6 mt-4 w-full max-w-[1400px]">
      {[
        { label: "Indeksering", desc: "Se hvilke sider Google har fundet" },
        { label: "Søgeord", desc: "Se hvad folk søger for at finde os" },
        { label: "Fejl", desc: "Fang crawl-fejl og 404s hurtigt" },
      ].map(({ label, desc }) => (
        <div key={label} className="bg-white/10 rounded-xl p-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">{label}</h3>
          <p className="text-lg text-blue-200">{desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const Slide11 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 gap-12">
    <FileText className="w-28 h-28 text-amber-400" strokeWidth={1.5} />
    <h1 className="text-7xl font-bold text-white text-center">Statisk Sitemap</h1>
    <p className="text-3xl text-blue-200 text-center max-w-[1200px]">
      Sitemappet er nu en <span className="text-amber-300 font-semibold">statisk XML-fil</span> — hurtigere og direkte tilgængelig for crawlere.
    </p>
    <div className="flex gap-8 mt-4 w-full max-w-[1400px]">
      <div className="bg-red-500/15 border border-red-500/30 rounded-2xl p-8 flex-1">
        <p className="text-2xl text-red-300 mb-2 font-semibold">❌ Før</p>
        <p className="text-xl text-red-200">Edge function genererede sitemap dynamisk</p>
        <p className="text-lg text-red-200/50 mt-2">Langsom, afhængig af server</p>
      </div>
      <div className="bg-green-500/15 border border-green-500/30 rounded-2xl p-8 flex-1">
        <p className="text-2xl text-green-300 mb-2 font-semibold">✅ Nu</p>
        <p className="text-xl text-green-200">public/sitemap.xml — statisk fil</p>
        <p className="text-lg text-green-200/50 mt-2">Instant load, altid tilgængelig</p>
      </div>
    </div>
    <div className="bg-white/10 rounded-xl px-8 py-5 mt-2">
      <span className="text-2xl text-white">160+ URLs: leverandører, teknologier, materialer, lokationer, kombinations-sider</span>
    </div>
  </div>
);

const Slide12 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 gap-12">
    <Target className="w-28 h-28 text-emerald-400" strokeWidth={1.5} />
    <h1 className="text-7xl font-bold text-white text-center">Conversion Capture</h1>
    <p className="text-3xl text-blue-200 text-center max-w-[1200px]">
      Traffic uden konvertering = <span className="text-red-400">spildt</span>.
      <br />Nu fanger vi leads på <span className="text-emerald-300 font-semibold">alle sider</span>.
    </p>
    <div className="flex gap-8 mt-4">
      {[
        { icon: FileText, label: "Quote Request Form", desc: "Fanger email + projektbehov" },
        { icon: Zap, label: "Sticky CTA", desc: "Altid synlig konverterings-knap" },
        { icon: Target, label: "Upload STL CTA", desc: "Driver til instant quotes" },
      ].map(({ icon: Icon, label, desc }) => (
        <div key={label} className="bg-white/10 rounded-2xl p-8 flex-1 text-center">
          <Icon className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">{label}</h3>
          <p className="text-xl text-blue-200">{desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const Slide13 = () => (
  <div className="flex flex-col items-center justify-center h-full px-32 gap-10">
    <CheckCircle2 className="w-28 h-28 text-green-400" strokeWidth={1.5} />
    <h1 className="text-7xl font-bold text-white text-center">Opsummering</h1>
    <div className="flex flex-col gap-5 mt-4">
      {[
        "Custom domæne: amsupplycheck.com (primær)",
        "supplycheck.io → 301 redirect til primær",
        "SEO-venlige URLs (/suppliers/protolabs)",
        "Structured Data (JSON-LD til Google)",
        "Statisk sitemap.xml med 160+ URLs",
        "5+ Alternatives-sider + Versus + Roundups",
        "Intern linking fra forsiden + leverandørsider",
        "Performance: WebP billeder (~80% mindre)",
        "Google Search Console: begge domæner verificeret",
        "Lead Capture på alle sider",
      ].map((item) => (
        <div key={item} className="flex items-center gap-4">
          <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0" />
          <span className="text-3xl text-white">{item}</span>
        </div>
      ))}
    </div>
    <p className="text-4xl text-blue-300 font-semibold mt-8">
      Fra usynlig → synlig på Google 🚀
    </p>
  </div>
);

const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8, Slide9, Slide10, Slide11, Slide12, Slide13];

/* ─── Main Component ─── */

const SEOPresentation = () => {
  const [current, setCurrent] = useState(0);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setScale(Math.min(clientWidth / 1920, clientHeight / 1080));
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, TOTAL_SLIDES - 1)), []);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      if (e.key === "Escape") window.history.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const SlideComponent = SLIDES[current];
  const progress = ((current + 1) / TOTAL_SLIDES) * 100;

  return (
    <div
      className="fixed inset-0 bg-[#0a0e27] overflow-hidden select-none"
      style={{ cursor: "default" }}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/10 z-50">
        <div
          className="h-full bg-blue-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Scaled slide container */}
      <div ref={containerRef} className="relative w-full h-full">
        <div
          className="absolute"
          style={{
            width: 1920,
            height: 1080,
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <SlideComponent />
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className={`absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all z-50 ${current === 0 ? "opacity-20 pointer-events-none" : "opacity-70 hover:opacity-100"}`}
      >
        <ArrowLeft className="w-8 h-8 text-white" />
      </button>
      <button
        onClick={next}
        className={`absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all z-50 ${current === TOTAL_SLIDES - 1 ? "opacity-20 pointer-events-none" : "opacity-70 hover:opacity-100"}`}
      >
        <ArrowRight className="w-8 h-8 text-white" />
      </button>

      {/* Dot navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-50">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full transition-all ${i === current ? "bg-blue-400 scale-125" : "bg-white/30 hover:bg-white/50"}`}
          />
        ))}
      </div>

      {/* Slide number */}
      <div className="absolute bottom-8 right-8 text-white/40 text-lg z-50">
        {current + 1} / {TOTAL_SLIDES}
      </div>

    </div>
  );
};

export default SEOPresentation;