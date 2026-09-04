'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Zap, ShieldCheck, Plug, Layers, Activity, Puzzle, Code2,
  Terminal, Github, Copy, Check, ChevronRight, Star, ArrowRight,
  Rocket, Cpu, Globe, PlayCircle, Sparkles, Download, Settings,
  CircleCheck, Twitter, MessagesSquare, Linkedin, Menu, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ------------- Utilities -------------
const PRODUCT = {
  name: 'Agentic Browser',
  tagline: 'The Browser Built for AI Agents',
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-secondary/60 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      aria-label="Copy code"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// Token-based syntax highlighter (avoids re-tokenizing already-wrapped HTML)
function highlight(code, lang) {
  const kwByLang = {
    python: ['from','import','def','return','class','with','as','if','else','for','in','await','async','None','True','False','print'],
    typescript: ['import','from','const','let','var','return','function','async','await','if','else','for','of','new','export','default','class','type','interface','true','false','null','undefined'],
    javascript: ['import','from','const','let','var','return','function','async','await','if','else','for','of','new','export','default','class','true','false','null','undefined'],
    bash: ['sudo','curl','echo','cd','ls','export','brew','npm','pip','pip3','docker','yarn','pnpm','node','python','python3'],
    yaml: [],
    json: [],
  };
  const kws = new Set(kwByLang[lang] || []);
  // Ordered patterns: first match wins per position
  const patterns = [
    { type: 'comment', re: /^(#[^\n]*|\/\/[^\n]*)/ },
    { type: 'string',  re: /^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/ },
    { type: 'number',  re: /^(\d+(?:\.\d+)?)/ },
    { type: 'ident',   re: /^([A-Za-z_][A-Za-z0-9_]*)/ },
    { type: 'other',   re: /^([\s\S])/ },
  ];
  const colors = {
    comment: 'text-zinc-500',
    string: 'text-emerald-300',
    number: 'text-amber-300',
    keyword: 'text-sky-400',
    fn: 'text-fuchsia-300',
  };
  const esc = (s) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  let out = '';
  let i = 0;
  while (i < code.length) {
    let matched = false;
    for (const p of patterns) {
      const m = code.slice(i).match(p.re);
      if (!m) continue;
      const val = m[1];
      if (p.type === 'ident') {
        if (kws.has(val)) {
          out += `<span class="${colors.keyword}">${esc(val)}</span>`;
        } else if (code[i + val.length] === '(') {
          out += `<span class="${colors.fn}">${esc(val)}</span>`;
        } else {
          out += esc(val);
        }
      } else if (p.type === 'other') {
        out += esc(val);
      } else {
        out += `<span class="${colors[p.type]}">${esc(val)}</span>`;
      }
      i += val.length;
      matched = true;
      break;
    }
    if (!matched) { out += esc(code[i]); i++; }
  }
  return out;
}

function CodeBlock({ code, lang = 'bash', filename }) {
  const html = useMemo(() => highlight(code, lang), [code, lang]);
  const lines = code.split('\n');
  return (
    <div className="gradient-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-black/40">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-3 text-xs text-muted-foreground font-mono">{filename || lang}</span>
        </div>
        <CopyButton text={code} />
      </div>
      <pre className="m-0 overflow-x-auto text-[13px] leading-6 font-mono bg-[#0b0b10] p-4">
        <code>
          {lines.map((_, i) => (
            <div key={i} className="flex">
              <span className="select-none text-zinc-600 pr-4 w-8 text-right">{i + 1}</span>
              <span
                className="flex-1 text-zinc-200"
                dangerouslySetInnerHTML={{ __html: highlight(lines[i], lang) || '&nbsp;' }}
              />
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

// ------------- Navbar -------------
function Navbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { label: 'Features', href: '#features' },
    { label: 'Install', href: '#install' },
    { label: 'How it Works', href: '#how' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <a href="#top" className="flex items-center gap-2">
          <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-sky-400 via-violet-500 to-cyan-400 grid place-items-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">{PRODUCT.name}</span>
          <Badge variant="secondary" className="ml-1 text-[10px] font-mono">v1.0</Badge>
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <a href="#"><Github className="h-4 w-4 mr-1.5" />GitHub</a>
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-sky-500 to-violet-500 hover:opacity-90">
            Get Started <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/50 bg-background/95">
          <div className="container py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1"><Github className="h-4 w-4 mr-1.5" />GitHub</Button>
              <Button size="sm" className="flex-1 bg-gradient-to-r from-sky-500 to-violet-500">Get Started</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ------------- Hero -------------
const TERMINAL_LINES = [
  { p: '$ ', t: 'npm install @agent-browser/core', c: 'text-emerald-400' },
  { p: '', t: 'added 42 packages in 3s', c: 'text-zinc-400' },
  { p: '$ ', t: 'node example.js', c: 'text-emerald-400' },
  { p: '', t: '→ launching sandboxed browser…', c: 'text-sky-300' },
  { p: '', t: '→ navigating https://news.ycombinator.com', c: 'text-sky-300' },
  { p: '', t: '→ extracting 30 posts …', c: 'text-sky-300' },
  { p: '✓ ', t: 'done in 1.42s', c: 'text-fuchsia-300' },
];

function TypingTerminal() {
  const [idx, setIdx] = useState(0);
  const [sub, setSub] = useState(0);
  useEffect(() => {
    if (idx >= TERMINAL_LINES.length) return;
    const current = TERMINAL_LINES[idx].t;
    if (sub < current.length) {
      const t = setTimeout(() => setSub(sub + 1), 22 + Math.random() * 30);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setIdx(idx + 1); setSub(0); }, 380);
    return () => clearTimeout(t);
  }, [idx, sub]);

  useEffect(() => {
    if (idx >= TERMINAL_LINES.length) {
      const t = setTimeout(() => { setIdx(0); setSub(0); }, 2500);
      return () => clearTimeout(t);
    }
  }, [idx]);

  return (
    <div className="gradient-border glow overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-black/60">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
        <span className="ml-3 text-xs text-muted-foreground font-mono">agent-browser — zsh</span>
      </div>
      <div className="p-5 font-mono text-[13px] leading-7 bg-[#0a0a10] min-h-[240px]">
        {TERMINAL_LINES.slice(0, idx).map((l, i) => (
          <div key={i}><span className={l.c}>{l.p}</span><span className="text-zinc-200">{l.t}</span></div>
        ))}
        {idx < TERMINAL_LINES.length && (
          <div>
            <span className={TERMINAL_LINES[idx].c}>{TERMINAL_LINES[idx].p}</span>
            <span className="text-zinc-200 caret">{TERMINAL_LINES[idx].t.slice(0, sub)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FloatingParticles() {
  const parts = useMemo(() => new Array(18).fill(0).map((_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 6,
    duration: 6 + Math.random() * 6,
    size: 2 + Math.random() * 3,
    color: ['#60a5fa','#a78bfa','#22d3ee'][i % 3],
  })), []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {parts.map((p, i) => (
        <span key={i} className="particle absolute bottom-0 rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size, height: p.size,
            background: p.color,
            boxShadow: `0 0 12px ${p.color}`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }} />
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="relative pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 grid-bg" aria-hidden />
      <FloatingParticles />
      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-6"
        >
          <Badge variant="outline" className="gap-1.5 border-sky-500/30 bg-sky-500/5 text-sky-300">
            <Sparkles className="h-3.5 w-3.5" /> v1.0 is here — 10x faster agent runs
          </Badge>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="text-center text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05]"
        >
          The Browser <span className="text-gradient">Built for AI Agents</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-6 text-center text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          A sandboxed, AI-native browser that lets autonomous agents browse, interact and
          extract data from the web — with a few lines of code.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button size="lg" className="bg-gradient-to-r from-sky-500 to-violet-500 hover:opacity-90 shadow-lg shadow-sky-500/20">
            <Rocket className="h-4 w-4 mr-2" /> Get Started
          </Button>
          <Button size="lg" variant="outline" className="border-border/70">
            <Github className="h-4 w-4 mr-2" /> View on GitHub
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> 12.4k
            </span>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mt-14 max-w-3xl mx-auto"
        >
          <TypingTerminal />
        </motion.div>
      </div>
    </section>
  );
}

// ------------- Features -------------
const FEATURES = [
  { icon: Bot, title: 'AI-Native Design', desc: 'Built from the ground up for AI agents. Structured DOM, semantic actions, and vision APIs baked in.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Rust-powered core with parallel action pipelines. Sub-second navigations and near-zero overhead.' },
  { icon: ShieldCheck, title: 'Secure Sandboxing', desc: 'Every session is an isolated container. Network, cookies and storage are scoped per agent.' },
  { icon: Plug, title: 'Easy Integration', desc: 'A tiny, obvious API. Drop into LangChain, CrewAI, AutoGen or your custom stack in minutes.' },
  { icon: Layers, title: 'Multi-Tab Support', desc: 'Run hundreds of concurrent sessions with a single client. Perfect for large-scale scraping.' },
  { icon: Activity, title: 'Built-in Observability', desc: 'Structured logs, distributed traces, screenshots, HAR files — replay any run step-by-step.' },
  { icon: Puzzle, title: 'Plugin System', desc: 'Extend with plugins for captcha solving, stealth, proxies, or your own actions.' },
  { icon: Code2, title: 'Multi-Language SDKs', desc: 'First-class SDKs for Python and TypeScript. Go, Ruby and Rust on the way.' },
];

function Features() {
  return (
    <section id="features" className="relative py-24 border-t border-border/40">
      <div className="container">
        <SectionHeader
          eyebrow="Features"
          title="Everything your agent needs to browse the web"
          subtitle="A modern, batteries-included runtime that turns web browsing into a first-class tool for any AI agent."
        />
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
              className="group gradient-border p-5 hover:-translate-y-1 transition-transform"
            >
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/20 grid place-items-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="h-5 w-5 text-sky-300" />
              </div>
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-sky-300">
        <span className="h-px w-6 bg-sky-500/50" />{eyebrow}<span className="h-px w-6 bg-sky-500/50" />
      </div>
      <h2 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

// ------------- Installation Guide -------------
function Step({ n, icon: Icon, title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className="relative pl-14"
    >
      <div className="absolute left-0 top-0 h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 grid place-items-center text-white font-semibold shadow-lg shadow-sky-500/20">
        {n}
      </div>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-sky-300" />}
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </motion.div>
  );
}

const INSTALL_COMMANDS = {
  npm: 'npm install @agent-browser/core',
  pip: 'pip install agent-browser',
  docker: 'docker pull agentbrowser/agent-browser:latest',
  brew: 'brew install agent-browser',
};

const QUICKSTART = {
  python: `from agent_browser import Browser

# 1. Initialize a sandboxed browser session
browser = Browser(headless=True)

# 2. Navigate to a URL
page = browser.new_page()
page.goto("https://news.ycombinator.com")

# 3. Extract content with a natural-language selector
titles = page.extract("list of top 10 post titles")
print(titles)

# 4. Close the browser
browser.close()`,
  typescript: `import { Browser } from "@agent-browser/core";

async function main() {
  // 1. Initialize a sandboxed browser session
  const browser = await Browser.launch({ headless: true });

  // 2. Navigate to a URL
  const page = await browser.newPage();
  await page.goto("https://news.ycombinator.com");

  // 3. Extract content with a natural-language selector
  const titles = await page.extract("list of top 10 post titles");
  console.log(titles);

  // 4. Close the browser
  await browser.close();
}

main();`,
};

const CONFIG_YAML = `# agent-browser.config.yaml
headless: true            # run without a visible window
timeout_ms: 30000         # per-action timeout
viewport:
  width: 1440
  height: 900
proxy:
  server: http://proxy.local:8080
  username: agent
  password: \${PROXY_PASS} # env vars supported
stealth: true             # evade bot detection
plugins:
  - captcha-solver
  - request-logger
observability:
  traces: true
  screenshots: on-error`;

const VERIFY = `$ agent-browser doctor

✓ Node.js 20.11.0 detected
✓ Python 3.11.7 detected
✓ Chromium runtime installed (127.0.6533)
✓ Sandbox permissions OK
✓ Network egress OK

All systems go. Run \`agent-browser hello\` to try it out.`;

function InstallationGuide() {
  return (
    <section id="install" className="relative py-24 border-t border-border/40">
      <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
      <div className="container relative">
        <SectionHeader
          eyebrow="Installation"
          title="Up and running in under two minutes"
          subtitle="Follow five simple steps. Copy-paste friendly commands. Zero yak-shaving."
        />

        <div className="mt-16 max-w-4xl mx-auto space-y-14">
          {/* Step 1 */}
          <Step n={1} icon={Cpu} title="Prerequisites">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="gradient-border p-5">
                <p className="text-sm text-muted-foreground mb-3">System requirements</p>
                <ul className="space-y-2 text-sm">
                  {[
                    'Node.js 18+ or Python 3.9+',
                    '2 GB RAM minimum (4 GB recommended)',
                    '500 MB free disk space',
                    'Internet connection for first-time setup',
                  ].map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <CircleCheck className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="gradient-border p-5">
                <p className="text-sm text-muted-foreground mb-3">Supported operating systems</p>
                <div className="flex flex-wrap gap-2">
                  {['macOS 12+', 'Ubuntu 20.04+', 'Debian 11+', 'Fedora 38+', 'Windows 10/11', 'WSL2'].map((o) => (
                    <Badge key={o} variant="outline" className="border-border/60 bg-secondary/40">{o}</Badge>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Works on x86_64 and Apple Silicon. Docker image is multi-arch.
                </p>
              </div>
            </div>
          </Step>

          {/* Step 2 */}
          <Step n={2} icon={Download} title="Install via your package manager">
            <Tabs defaultValue="npm" className="w-full">
              <TabsList className="bg-secondary/60 border border-border/60">
                <TabsTrigger value="npm">npm</TabsTrigger>
                <TabsTrigger value="pip">pip</TabsTrigger>
                <TabsTrigger value="docker">Docker</TabsTrigger>
                <TabsTrigger value="brew">Homebrew</TabsTrigger>
              </TabsList>
              {Object.entries(INSTALL_COMMANDS).map(([k, v]) => (
                <TabsContent key={k} value={k} className="mt-4">
                  <CodeBlock code={v} lang="bash" filename={`${k} — terminal`} />
                </TabsContent>
              ))}
            </Tabs>
            <p className="mt-3 text-xs text-muted-foreground">
              Tip: use <code className="font-mono text-sky-300">--global</code> or <code className="font-mono text-sky-300">pipx</code> to install the CLI system-wide.
            </p>
          </Step>

          {/* Step 3 */}
          <Step n={3} icon={Code2} title="Quick-start example">
            <Tabs defaultValue="python" className="w-full">
              <TabsList className="bg-secondary/60 border border-border/60">
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="typescript">TypeScript</TabsTrigger>
              </TabsList>
              <TabsContent value="python" className="mt-4">
                <CodeBlock code={QUICKSTART.python} lang="python" filename="quickstart.py" />
              </TabsContent>
              <TabsContent value="typescript" className="mt-4">
                <CodeBlock code={QUICKSTART.typescript} lang="typescript" filename="quickstart.ts" />
              </TabsContent>
            </Tabs>
          </Step>

          {/* Step 4 */}
          <Step n={4} icon={Settings} title="Configuration">
            <div className="grid lg:grid-cols-5 gap-4 items-start">
              <div className="lg:col-span-3">
                <CodeBlock code={CONFIG_YAML} lang="yaml" filename="agent-browser.config.yaml" />
              </div>
              <ul className="lg:col-span-2 space-y-3 text-sm">
                {[
                  ['headless', 'Run without a visible browser window. Turn off for debugging.'],
                  ['timeout_ms', 'How long a single action waits before failing.'],
                  ['proxy', 'Route all traffic through a proxy for geo-targeting.'],
                  ['stealth', 'Enable anti-detection heuristics.'],
                  ['plugins', 'Extend the runtime with community or custom plugins.'],
                ].map(([k, v]) => (
                  <li key={k} className="gradient-border p-3">
                    <code className="text-sky-300 font-mono text-xs">{k}</code>
                    <p className="text-muted-foreground mt-1">{v}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Step>

          {/* Step 5 */}
          <Step n={5} icon={Terminal} title="Verify your installation">
            <div className="grid md:grid-cols-2 gap-4">
              <CodeBlock code={'agent-browser doctor'} lang="bash" filename="terminal" />
              <div className="gradient-border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-black/60">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs text-muted-foreground font-mono">expected output</span>
                </div>
                <pre className="p-4 text-[12.5px] leading-6 font-mono text-zinc-200 bg-[#0a0a10] whitespace-pre-wrap">{VERIFY}</pre>
              </div>
            </div>
          </Step>
        </div>
      </div>
    </section>
  );
}

// ------------- How It Works -------------
const STEPS = [
  { icon: Download, title: 'Install the SDK', desc: 'A single command in your language of choice.' },
  { icon: Code2, title: 'Write your agent logic', desc: 'Describe goals in code; use tools, memory, planning.' },
  { icon: Rocket, title: 'Launch the browser', desc: 'A sandboxed session spins up in under a second.' },
  { icon: Bot, title: 'Agent browses autonomously', desc: 'It clicks, types, extracts and reports back.' },
];

function HowItWorks() {
  return (
    <section id="how" className="relative py-24 border-t border-border/40">
      <div className="container">
        <SectionHeader
          eyebrow="How it works"
          title="From zero to autonomous browsing in 4 steps"
        />
        <div className="mt-16 relative">
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-sky-500/40 to-transparent" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative text-center"
              >
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-sky-500/30 grid place-items-center relative z-10 backdrop-blur">
                  <s.icon className="h-6 w-6 text-sky-300" />
                </div>
                <div className="mt-4 text-xs font-mono text-muted-foreground">STEP 0{i + 1}</div>
                <h3 className="mt-1 font-medium">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------- Code Demo -------------
const DEMO_CODE = `import { Browser } from "@agent-browser/core";

const browser = await Browser.launch();
const page = await browser.newPage();

await page.goto("https://shop.example.com/laptops");

// Extract structured data with a plain-English query
const products = await page.extract(
  "array of { name, price, rating } for every product"
);

console.table(products);
await browser.close();`;

function CodeDemo() {
  return (
    <section className="relative py-24 border-t border-border/40">
      <div className="container">
        <SectionHeader
          eyebrow="Live demo"
          title="Scrape a real e-commerce site in 10 lines"
          subtitle="Write the intent — the agent figures out selectors, pagination and structure."
        />
        <div className="mt-14 grid lg:grid-cols-2 gap-4 items-stretch">
          <div>
            <CodeBlock code={DEMO_CODE} lang="typescript" filename="scrape-products.ts" />
          </div>
          <div className="gradient-border overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/60 bg-black/60">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              <div className="ml-3 flex-1 px-3 py-1 rounded-md bg-secondary/70 text-xs text-muted-foreground font-mono truncate">
                shop.example.com/laptops
              </div>
            </div>
            <div className="flex-1 bg-[#0a0a10] p-4 text-[13px] font-mono">
              <div className="text-sky-300 mb-2">→ result</div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground border-b border-border/40 pb-2">
                <span>name</span><span>price</span><span>rating</span>
              </div>
              {[
                ['MacBook Pro 14"', '$1,999', '4.8'],
                ['ThinkPad X1 Carbon', '$1,499', '4.6'],
                ['Dell XPS 15', '$1,799', '4.5'],
                ['Framework 13', '$1,099', '4.7'],
                ['Razer Blade 14', '$2,299', '4.4'],
              ].map((row, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="grid grid-cols-3 gap-2 py-1.5 border-b border-border/20 text-zinc-200">
                  <span className="truncate">{row[0]}</span>
                  <span className="text-emerald-300">{row[1]}</span>
                  <span className="text-amber-300">★ {row[2]}</span>
                </motion.div>
              ))}
              <div className="mt-3 text-fuchsia-300">✓ scraped 42 items in 1.8s</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------- Integrations -------------
const PARTNERS = ['LangChain','AutoGPT','CrewAI','OpenAI','Anthropic','LlamaIndex','AutoGen','Vercel AI','Cohere','Mistral','Groq','Hugging Face'];
function Integrations() {
  return (
    <section className="relative py-20 border-t border-border/40">
      <div className="container">
        <SectionHeader eyebrow="Ecosystem" title="Works with your favorite AI framework" />
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {PARTNERS.map((p) => (
            <div key={p} className="gradient-border p-4 flex items-center justify-center h-16 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {p}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------- Pricing -------------
const PLANS = [
  { name: 'Open Source', price: 'Free', cta: 'Star on GitHub', features: ['Full SDK, self-hosted','Community support','Unlimited local sessions','MIT licensed'], highlight: false },
  { name: 'Pro', price: '$29', suffix: '/mo', cta: 'Start free trial', features: ['Hosted cloud runners','Priority support','10k agent-minutes / mo','Proxies & stealth included','Team dashboard'], highlight: true },
  { name: 'Enterprise', price: 'Custom', cta: 'Contact sales', features: ['Dedicated infrastructure','99.9% SLA & SSO','Compliance (SOC2, GDPR)','Custom integrations','Slack channel support'], highlight: false },
];
function Pricing() {
  return (
    <section id="pricing" className="relative py-24 border-t border-border/40">
      <div className="container">
        <SectionHeader eyebrow="Pricing" title="Free & open source. Scale when you need to." />
        <div className="mt-14 grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {PLANS.map((p) => (
            <div key={p.name} className={cn('gradient-border p-6 flex flex-col', p.highlight && 'ring-2 ring-sky-500/40 glow')}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                {p.highlight && <Badge className="bg-gradient-to-r from-sky-500 to-violet-500 border-0">Popular</Badge>}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold">{p.price}</span>
                {p.suffix && <span className="text-muted-foreground text-sm">{p.suffix}</span>}
              </div>
              <ul className="mt-6 space-y-2 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CircleCheck className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /><span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className={cn('mt-6 w-full', p.highlight ? 'bg-gradient-to-r from-sky-500 to-violet-500' : '')} variant={p.highlight ? 'default' : 'outline'}>
                {p.cta} <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------- Testimonials -------------
const TESTIMONIALS = [
  { name: 'Sara Ito', role: 'Founder, Loop AI', quote: 'We replaced our custom Playwright rig with Agentic Browser in a weekend. Runs are 4x faster and infinitely more reliable.' },
  { name: 'Marcus Klein', role: 'Staff Engineer, Neuronix', quote: 'The vision + DOM extraction combo is magic. Our agents actually understand pages now.' },
  { name: 'Priya Raman', role: 'AI Lead, Kestrel Labs', quote: 'Sandboxing, tracing, retries — all the boring parts done right. We ship agents 10x faster.' },
];
function Testimonials() {
  return (
    <section className="relative py-24 border-t border-border/40">
      <div className="container">
        <SectionHeader eyebrow="Social proof" title="Loved by AI builders" />
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><span className="text-foreground font-semibold">12.4k</span> GitHub stars</div>
          <div><span className="text-foreground font-semibold">280k+</span> npm downloads / month</div>
          <div><span className="text-foreground font-semibold">4,200+</span> Discord members</div>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="gradient-border p-6">
              <p className="text-sm text-zinc-200 leading-relaxed">“{t.quote}”</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-sky-500 to-violet-500 grid place-items-center text-xs font-semibold">
                  {t.name.split(' ').map(x=>x[0]).join('')}
                </div>
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ------------- FAQ -------------
const FAQS = [
  { q: 'What is an AI Agent Browser?', a: 'It is a headless browser purpose-built for autonomous AI agents. Instead of low-level DOM selectors, it exposes intent-based actions like extract, click, fill and observe — plus first-class hooks for LLMs.' },
  { q: 'How is this different from Puppeteer or Playwright?', a: 'Playwright is a great tool for humans writing scripts. Agentic Browser is designed for LLMs writing and executing plans: robust selectors, structured extraction, retries, sandboxing, tracing and multi-agent concurrency baked in.' },
  { q: 'Is it free to use?', a: 'Yes. The core is MIT-licensed and free forever. Our hosted Pro and Enterprise plans are optional.' },
  { q: 'What AI frameworks does it support?', a: 'LangChain, LlamaIndex, CrewAI, AutoGen, Vercel AI SDK and any Python/TypeScript stack. Native tool wrappers ship with the SDK.' },
  { q: 'Can I use it in production?', a: 'Absolutely. It powers browsing agents at YC startups and Fortune 500 teams with strict SLAs. Enterprise plans include dedicated infra and SOC2 compliance.' },
  { q: 'How do I contribute?', a: 'Open an issue or PR on GitHub, join our Discord, or write a plugin. Good first issues are labeled and mentored.' },
];
function FAQ() {
  return (
    <section id="faq" className="relative py-24 border-t border-border/40">
      <div className="container max-w-3xl">
        <SectionHeader eyebrow="FAQ" title="Frequently asked questions" />
        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border/50">
              <AccordionTrigger className="text-left hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

// ------------- Footer -------------
function Footer() {
  const cols = [
    { title: 'Product', links: ['Features','Installation','Pricing','Changelog'] },
    { title: 'Developers', links: ['Documentation','API Reference','SDKs','Examples'] },
    { title: 'Company', links: ['About','Blog','Careers','Contact'] },
    { title: 'Legal', links: ['Privacy','Terms','Security','Cookies'] },
  ];
  return (
    <footer className="relative border-t border-border/40 pt-16 pb-8">
      <div className="container">
        <div className="grid md:grid-cols-6 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8 rounded-md bg-gradient-to-br from-sky-400 via-violet-500 to-cyan-400 grid place-items-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">{PRODUCT.name}</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">{PRODUCT.tagline}. Open source and built by AI engineers, for AI engineers.</p>
            <form onSubmit={(e)=>e.preventDefault()} className="mt-5 flex gap-2 max-w-sm">
              <Input type="email" placeholder="you@company.com" className="bg-secondary/60 border-border/60" />
              <Button type="submit" className="bg-gradient-to-r from-sky-500 to-violet-500">Subscribe</Button>
            </form>
            <div className="mt-5 flex items-center gap-2">
              {[Github, Twitter, MessagesSquare, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="h-9 w-9 grid place-items-center rounded-md border border-border/60 hover:bg-secondary/60">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-semibold">{c.title}</div>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {c.links.map((l) => (<li key={l}><a href="#" className="hover:text-foreground">{l}</a></li>))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-6 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} {PRODUCT.name}. All rights reserved.</div>
          <div>Made with ⌘ + agents.</div>
        </div>
      </div>
    </footer>
  );
}

// ------------- Page -------------
export default function App() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Features />
      <InstallationGuide />
      <HowItWorks />
      <CodeDemo />
      <Integrations />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Footer />
    </main>
  );
}
