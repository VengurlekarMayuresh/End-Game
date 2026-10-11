import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Code2,
  Brain,
  Video,
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  Briefcase,
  Play,
  Terminal,
  FileCheck2,
  Lock,
  ChevronRight,
  Star,
  Cpu,
  BadgeCheck,
  Search,
  ExternalLink,
  ChevronDown,
  Building,
  Activity,
  Layers,
  Award,
  Laptop
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

const Landing = () => {
  // Interactive showcase state
  const [activeHeroTab, setActiveHeroTab] = useState('interview');
  const [audienceView, setAudienceView] = useState('recruiters');
  const [simulatorRole, setSimulatorRole] = useState('fullstack');
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Sample data for Simulator
  const roleSimulations = {
    fullstack: {
      title: 'Senior Full-Stack Engineer',
      skills: ['React 19', 'Node.js', 'Distributed Caching', 'PostgreSQL', 'System Architecture'],
      aiQuestion: 'How would you architect real-time state synchronization across multi-tenant clients while maintaining strict idempotency?',
      candidateResponse: 'I utilize an event-driven CQRS pattern with Redis pub/sub backplanes, enforcing deterministic UUID idempotency keys at the API gateway layer to prevent replay duplicates.',
      aiEvaluation: {
        score: 95,
        rating: 'Top 3% Candidate',
        feedback: 'Demonstrated deep architectural understanding of distributed caching, race conditions, and idempotent API contracts.',
        breakdown: [
          { label: 'System Design', score: 96 },
          { label: 'Code Quality', score: 94 },
          { label: 'Communication', score: 95 },
        ]
      }
    },
    ml: {
      title: 'Staff AI/ML Systems Engineer',
      skills: ['PyTorch', 'vLLM', 'Distributed Training', 'Quantization (AWQ/GPTQ)', 'CUDA Kernels'],
      aiQuestion: 'What strategies do you adopt when fine-tuning 70B parameter LLMs under constrained VRAM without compromising perplexity?',
      candidateResponse: 'I apply 4-bit AWQ weight-only quantization coupled with FlashAttention-2 and ZeRO-3 parameter sharding across distributed GPU clusters with gradient checkpointing.',
      aiEvaluation: {
        score: 98,
        rating: 'Exceptional Hire',
        feedback: 'Superb grasp of low-level memory layout, GPU tensor parallelism, and high-throughput inference serving engines.',
        breakdown: [
          { label: 'Model Architecture', score: 99 },
          { label: 'Inference Efficiency', score: 97 },
          { label: 'Production Scaling', score: 98 },
        ]
      }
    },
    devops: {
      title: 'Principal Cloud Platform Engineer',
      skills: ['Kubernetes', 'Terraform', 'eBPF', 'ArgoCD GitOps', 'Zero-Trust Networking'],
      aiQuestion: 'Describe your protocol for isolating zero-day container breakouts and automating canary rollbacks during cluster node drain operations.',
      candidateResponse: 'I implement Cilium eBPF kernel tracing with Tetragon runtime policies, orchestrating automated progressive delivery rollbacks via ArgoCD and Prometheus alertmanager hooks.',
      aiEvaluation: {
        score: 94,
        rating: 'Strong Recommend',
        feedback: 'Rigorous approach to low-level Linux kernel security, progressive traffic routing, and resilient cloud automation.',
        breakdown: [
          { label: 'Platform Security', score: 96 },
          { label: 'Incident Automation', score: 93 },
          { label: 'Infrastructure as Code', score: 94 },
        ]
      }
    }
  };

  const currentSim = roleSimulations[simulatorRole];

  // Featured sample jobs
  const featuredJobs = [
    {
      id: 'job-1',
      title: 'Senior Backend Engineer (Go & Distributed Systems)',
      company: 'Novatech Labs',
      location: 'San Francisco, CA (Remote)',
      type: 'Full-time',
      salary: '$165,000 – $195,000',
      skills: ['Go', 'Kafka', 'Kubernetes', 'PostgreSQL'],
      scoreMatch: '96% Fit Match',
      isHot: true
    },
    {
      id: 'job-2',
      title: 'Lead Frontend Architect (React / Next.js)',
      company: 'Stratos Cloud',
      location: 'New York, NY (Hybrid)',
      type: 'Full-time',
      salary: '$150,000 – $180,000',
      skills: ['React', 'TypeScript', 'Web Workers', 'Tailwind'],
      scoreMatch: '94% Fit Match',
      isHot: false
    },
    {
      id: 'job-3',
      title: 'AI Applied Scientist & LLM Specialist',
      company: 'Synthetix AI',
      location: 'Austin, TX (Remote)',
      type: 'Full-time',
      salary: '$180,000 – $220,000',
      skills: ['Python', 'PyTorch', 'RAG Pipelines', 'Vector DBs'],
      scoreMatch: '98% Fit Match',
      isHot: true
    }
  ];

  // FAQs
  const faqs = [
    {
      question: 'How do HireSense AI interviews differ from generic video recording tools?',
      answer: 'HireSense conducts fully conversational, bidirectional interviews in real time. Rather than asking static, pre-recorded questions, our LLM engine actively listens to candidate responses, dynamically formulates tailored follow-up technical questions, probes edge cases, and objectively evaluates answers against calibrated engineering rubrics.'
    },
    {
      question: 'How does the OpenCV proctoring engine protect test integrity?',
      answer: 'Our proprietary proctoring shield tracks face landmarks, detects multi-person presence, recognizes tab switches, blocks clipboard copy-paste events, and alerts recruiters to secondary monitor setups—all while respecting candidate privacy and storing zero biometric identifiers beyond the active evaluation window.'
    },
    {
      question: 'What is the Resume-Calibrated Aptitude Engine?',
      answer: 'Instead of generic aptitude quizzes, HireSense parses the candidate’s uploaded resume and dynamically synthesizes questions directly targeting the tech stacks, architectural choices, and systems claimed in their project experience. This verifies authentic capability and eliminates resume inflation.'
    },
    {
      question: 'Can recruiters customize evaluation rubrics and question banks?',
      answer: 'Yes! Recruiters can create custom question banks, import technical challenges, define weighted scoring categories (e.g. 40% Coding sandbox, 30% System Architecture, 30% Behavioral Communication), or use our pre-calibrated industry standard templates for over 65+ specialized tech roles.'
    },
    {
      question: 'Is the platform compliant with anti-bias hiring regulations?',
      answer: 'Absolutely. HireSense is engineered from the ground up to comply with EEOC, GDPR, and NYC Local Law 144 AI hiring audits. Candidate assessments are blind-evaluated strictly against performance criteria and structured scoring rubrics without demographic bias.'
    },
    {
      question: 'How quickly can our team get started?',
      answer: 'You can post your first job, configure an AI assessment round, and start screening applicants in under 5 minutes. No sales call or complex IT integration required.'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pt-16 selection:bg-primary/20 selection:text-primary">
      
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. HERO SECTION */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-20 md:pb-28 border-b border-border/50">
        {/* Ambient atmospheric gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-primary/15 via-blue-500/10 to-indigo-500/0 blur-3xl pointer-events-none rounded-full -z-10" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-500/5 blur-3xl pointer-events-none rounded-full -z-10" />

        <div className="container mx-auto px-4 max-w-7xl">
          {/* Main Hero Header */}
          <div className="text-center max-w-4xl mx-auto mb-14">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-xs md:text-sm font-semibold mb-6 text-primary shadow-sm hover:bg-primary/15 transition-colors">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <Sparkles size={14} className="text-primary" />
                HireSense AI 3.0 · Autonomous Candidate Intelligence Platform
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
                Autonomous AI Hiring Platform{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-indigo-600">
                  for Engineering & Tech Teams
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                The enterprise recruitment engine combining conversational AI interviews, real-world proctored code sandboxes, and resume-calibrated aptitude testing into one unified candidate dossier.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group text-base"
                >
                  Start Hiring Free
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/jobs"
                  className="w-full sm:w-auto px-8 py-4 bg-secondary text-secondary-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-all border border-border flex items-center justify-center gap-2 text-base"
                >
                  <Search size={18} className="text-muted-foreground" />
                  Explore Active Roles
                </Link>
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl border border-border/80 hover:bg-muted/60 font-medium text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2 text-base"
                >
                  <Play size={16} className="text-primary fill-primary" />
                  Watch Interactive Tour
                </button>
              </div>

              {/* Trust Subtext */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>Zero biometric retention</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>EEOC & GDPR compliant</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ──────────────────────────────────────────────────────── */}
          {/* HERO INTERACTIVE PRODUCT SHOWCASE CANVAS */}
          {/* ──────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative mx-auto max-w-5xl rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Window header */}
            <div className="px-5 py-3.5 border-b border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                </div>
                <span className="text-xs font-mono text-muted-foreground ml-2 hidden sm:inline">
                  hiresense-console // evaluation-session #8492
                </span>
              </div>

              {/* Showcase Navigation Tabs */}
              <div className="flex items-center bg-background/80 border border-border rounded-lg p-0.5 text-xs font-medium">
                {[
                  { id: 'interview', label: 'AI Voice Interview', icon: Video },
                  { id: 'code', label: 'Proctored IDE', icon: Code2 },
                  { id: 'aptitude', label: 'Resume Aptitude', icon: Brain },
                  { id: 'dossier', label: 'Candidate Fit Dossier', icon: BarChart3 }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveHeroTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                        activeHeroTab === tab.id
                          ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon size={13} />
                      <span className="hidden md:inline">{tab.label}</span>
                      <span className="md:hidden">{tab.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Showcase Viewport Content */}
            <div className="p-5 md:p-8 min-h-[380px] bg-gradient-to-b from-card to-background">
              {/* TAB 1: AI INTERVIEW VIEW */}
              {activeHeroTab === 'interview' && (
                <div className="grid md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 bg-muted/50 rounded-xl p-4 border border-border relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Live AI Avatar Session</span>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-background border border-border">08:42 elapsed</span>
                    </div>

                    <div className="aspect-video bg-gradient-to-br from-slate-900 to-indigo-950 rounded-lg flex flex-col items-center justify-center p-4 text-center text-white relative">
                      <div className="w-16 h-16 rounded-full bg-primary/30 border-2 border-primary flex items-center justify-center mb-3">
                        <Cpu className="text-primary-foreground w-8 h-8 animate-pulse" />
                      </div>
                      <p className="text-xs font-medium text-slate-300">HireSense AI Technical Interviewer</p>
                      <p className="text-[10px] text-slate-400">Asking System Architecture & Scalability</p>

                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-center gap-1">
                        <span className="h-3 w-1 bg-primary rounded-full animate-bounce" />
                        <span className="h-5 w-1 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="h-7 w-1 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                        <span className="h-4 w-1 bg-primary rounded-full animate-bounce [animation-delay:450ms]" />
                        <span className="h-2 w-1 bg-primary rounded-full animate-bounce [animation-delay:200ms]" />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <ShieldCheck size={14} /> Eye Contact & Focus: 99%
                      </span>
                      <span>Audio Fidelity: Studio Clear</span>
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-4">
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles size={14} className="text-primary" />
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">Dynamic Follow-Up Question</span>
                      </div>
                      <p className="text-sm font-medium">
                        &quot;You mentioned using Redis for cache invalidation. How do you handle cache stampedes when 50,000 requests hit an expired key simultaneously?&quot;
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-card border border-border">
                      <div className="flex items-center justify-between mb-1.5 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Candidate Live Transcription</span>
                        <span className="text-emerald-500 font-medium">Real-time STT (0.1s lag)</span>
                      </div>
                      <p className="text-xs text-muted-foreground italic leading-relaxed">
                        &quot;I implement probabilistic early expiration with mutex locking via Redis distributed locks, ensuring only a single worker recomputes while others receive stale grace periods...&quot;
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                        <div className="text-lg font-bold text-primary">96%</div>
                        <div className="text-[11px] text-muted-foreground">Technical Depth</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                        <div className="text-lg font-bold text-emerald-500">94%</div>
                        <div className="text-[11px] text-muted-foreground">Clarity & Brevity</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                        <div className="text-lg font-bold text-indigo-500">100%</div>
                        <div className="text-[11px] text-muted-foreground">Authenticity Index</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PROCTORED CODE SANDBOX VIEW */}
              {activeHeroTab === 'code' && (
                <div className="grid md:grid-cols-12 gap-6">
                  <div className="md:col-span-8 font-mono text-xs rounded-xl bg-slate-950 text-slate-200 p-4 border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 mb-3">
                      <div className="flex items-center gap-2">
                        <Code2 size={14} className="text-blue-400" />
                        <span>solution.ts</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300">TypeScript 5.4</span>
                      </div>
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={13} /> 5/5 Unit Tests Passed
                      </span>
                    </div>

                    <pre className="overflow-x-auto text-xs leading-relaxed space-y-1">
                      <span className="text-indigo-400">class</span> <span className="text-yellow-300">DistributedRateLimiter</span> &#123;{'\n'}
                      {'  '}<span className="text-indigo-400">private</span> redis: RedisClient;{'\n'}
                      {'  '}<span className="text-indigo-400">async</span> <span className="text-blue-400">allowRequest</span>(key: <span className="text-cyan-300">string</span>, limit: <span className="text-cyan-300">number</span>, windowMs: <span className="text-cyan-300">number</span>) &#123;{'\n'}
                      {'    '}<span className="text-slate-500">// Sliding Window Counter with atomic Lua evaluation</span>{'\n'}
                      {'    '}<span className="text-indigo-400">const</span> now = Date.now();{'\n'}
                      {'    '}<span className="text-indigo-400">return await</span> <span className="text-purple-400">this</span>.evalLuaScript(key, now, windowMs, limit);{'\n'}
                      {'  '}&#125;{'\n'}
                      &#125;
                    </pre>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Execution: 12ms</span>
                      <span>Memory: 14.8MB</span>
                      <span className="text-emerald-400">Time Complexity: O(1)</span>
                    </div>
                  </div>

                  <div className="md:col-span-4 space-y-3">
                    <div className="p-3.5 rounded-xl bg-card border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold">Integrity Shield Monitor</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">Verified Clean</span>
                      </div>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Tab Switches:</span>
                          <span className="font-mono font-semibold text-foreground">0</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>External Pastes:</span>
                          <span className="font-mono font-semibold text-foreground">0</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>OpenCV Face Presence:</span>
                          <span className="font-mono font-semibold text-emerald-500">100% Locked</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Code Quality Audit</div>
                      <div className="text-sm font-bold text-foreground mb-2">Edge Cases & Concurrency Covered</div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full w-[94%]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: RESUME APTITUDE VIEW */}
              {activeHeroTab === 'aptitude' && (
                <div className="grid md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-6 space-y-3">
                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                        <FileCheck2 size={14} className="text-primary" />
                        Parsed Resume Claim
                      </div>
                      <p className="text-sm font-semibold">
                        &quot;Architected Kubernetes microservices serving 4M DAU with 99.99% uptime.&quot;
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider flex items-center gap-1.5">
                        <Brain size={14} />
                        Auto-Synthesized Verification Challenge
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        &quot;Based on candidate claims, generated a scenario testing pod affinity anti-rules, horizontal pod autoscaling threshold spikes, and persistent volume failovers during cluster node upgrades.&quot;
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-6 bg-card rounded-xl p-5 border border-border space-y-3">
                    <div className="text-sm font-bold">Resume Truth Index</div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Claimed Skill Accuracy</span>
                          <span className="font-bold text-emerald-500">97% Verified</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-emerald-500 h-2 rounded-full w-[97%]" />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Architectural Depth vs Seniority</span>
                          <span className="font-bold text-primary">Staff Caliber (Top 4%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full w-[92%]" />
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 text-xs text-muted-foreground italic border-t border-border">
                      Zero generic trivia. 100% personalized aptitude benchmark.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CANDIDATE FIT DOSSIER */}
              {activeHeroTab === 'dossier' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-lg">
                        SJ
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base">Sarah Jenkins</h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            Strong Hire (Fast-Track)
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Applied for: Staff Backend Infrastructure Engineer</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-primary">96<span className="text-xs font-normal text-muted-foreground">/100</span></div>
                        <div className="text-[11px] text-muted-foreground">Composite Fit Score</div>
                      </div>
                      <Link
                        to="/register"
                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                      >
                        Schedule Final Offer Call
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                      <div className="text-xs text-muted-foreground">AI Interview</div>
                      <div className="text-lg font-bold text-foreground">95%</div>
                      <div className="text-[10px] text-emerald-500">Exemplary Logic</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                      <div className="text-xs text-muted-foreground">Coding Sandbox</div>
                      <div className="text-lg font-bold text-foreground">98%</div>
                      <div className="text-[10px] text-emerald-500">Optimal Runtime</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                      <div className="text-xs text-muted-foreground">Resume Aptitude</div>
                      <div className="text-lg font-bold text-foreground">94%</div>
                      <div className="text-[10px] text-emerald-500">Verified Skills</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border text-center">
                      <div className="text-xs text-muted-foreground">Proctor Integrity</div>
                      <div className="text-lg font-bold text-emerald-500">100%</div>
                      <div className="text-[10px] text-muted-foreground">Zero Infractions</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. LIVE METRICS & SOCIAL PROOF BAR */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-12 border-b border-border bg-muted/20">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">
            Empowering Talent Teams at High-Growth Innovators & Global Enterprises
          </p>

          {/* Realistic monochrome corporate logos */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-75 hover:opacity-100 transition-opacity mb-12">
            {[
              { name: 'STRIPE', icon: '💳' },
              { name: 'DATADOG', icon: '🐕' },
              { name: 'SNOWFLAKE', icon: '❄️' },
              { name: 'LINEAR', icon: '⚡' },
              { name: 'RAMP', icon: '📈' },
              { name: 'VERCEL', icon: '▲' },
              { name: 'SUPABASE', icon: '⚡' },
            ].map(company => (
              <div key={company.name} className="flex items-center gap-2 text-foreground/80 hover:text-foreground font-bold tracking-tight text-lg cursor-default transition-colors">
                <span className="text-sm">{company.icon}</span>
                <span>{company.name}</span>
              </div>
            ))}
          </div>

          {/* Hard Metrics Ticker */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-border">
            {[
              { value: '72%', label: 'Reduction in Time-to-Hire', hint: 'From 34 days down to 6 days' },
              { value: '3.8x', label: 'Candidate Screen Throughput', hint: 'Without adding HR headcount' },
              { value: '99.4%', label: 'Integrity Proctor Accuracy', hint: 'Zero false-positive flags' },
              { value: '350k+', label: 'Assessments Conducted', hint: 'Across 48 countries' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center p-3">
                <div className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-foreground/90 mb-0.5">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. DUAL-AUDIENCE TOGGLE: RECRUITERS vs CANDIDATES */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Designed for Both Sides of the Interview Table
            </h2>
            <p className="text-muted-foreground text-base md:text-lg mb-8">
              Whether you are scaling an engineering department or showcasing your authentic technical depth, HireSense makes hiring faster, fairer, and transparent.
            </p>

            {/* View Switcher Pill */}
            <div className="inline-flex p-1 rounded-xl bg-muted border border-border">
              <button
                onClick={() => setAudienceView('recruiters')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  audienceView === 'recruiters'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Briefcase size={16} className={audienceView === 'recruiters' ? 'text-primary' : ''} />
                For Recruiters & Hiring Managers
              </button>
              <button
                onClick={() => setAudienceView('candidates')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  audienceView === 'candidates'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users size={16} className={audienceView === 'candidates' ? 'text-primary' : ''} />
                For Candidates & Job Seekers
              </button>
            </div>
          </div>

          {/* Dynamic Audience Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {audienceView === 'recruiters' ? (
              <>
                <div className="p-7 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-5">
                      <Zap size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Automate Screening Calls</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      Eliminate 20+ hours of repetitive phone screens each week. Let our AI conduct structured preliminary technical and cultural evaluations.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Standardized rubric-based grading
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Instant AI interview summary dossier
                    </li>
                  </ul>
                </div>

                <div className="p-7 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-5">
                      <BarChart3 size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Smart Shortlist Matrix</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      Aggregate coding performance, resume aptitude, and interview scores into a single weighted ranking to easily spot the top 5% of applicants.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Multi-vector candidate ranking
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Filter by seniority and stack fit
                    </li>
                  </ul>
                </div>

                <div className="p-7 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5">
                      <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Proctored Anti-Cheat Assurance</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      Protect your assessment integrity with OpenCV facial gaze tracking, tab-switch monitoring, and secondary screen detection.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      99.4% anti-cheat confidence rating
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Audit logs with timestamped alerts
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="p-7 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-5">
                      <Award size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">100% Bias-Free Evaluation</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      Get evaluated strictly on your code, architectural logic, and problem-solving ability without human resume screening bias or gatekeeping.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Blind evaluation on engineering merits
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Equal opportunity for non-traditional backgrounds
                    </li>
                  </ul>
                </div>

                <div className="p-7 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-5">
                      <Clock size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Interview on Your Schedule</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      No more coordinating awkward timezone slots or taking time off current jobs. Complete AI interviews 24/7 whenever you are in peak focus.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Flexible 24/7 autonomous test windows
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Zero anxiety from human interviewer interruptions
                    </li>
                  </ul>
                </div>

                <div className="p-7 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5">
                      <CheckCircle2 size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Instant Actionable Feedback</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                      Say goodbye to recruiter ghosting. Receive rich breakdown reports showing your architectural strengths, test scores, and growth areas.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs text-muted-foreground border-t border-border pt-4">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Immediate feedback after assessment
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      Verified skill credentials for profile
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 4. THE 4 PILLARS OF HIRESENSE RECRUITMENT ENGINE */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-border bg-muted/10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              End-To-End Platform Capabilities
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4 mb-4">
              Four Pillars of Candidate Intelligence
            </h2>
            <p className="text-muted-foreground text-base md:text-lg">
              Everything modern engineering and talent teams need to run rigorous, scalable, and delightful technical hiring pipelines.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* PILLAR 1 */}
            <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm group">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <Video size={28} />
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                  PILLAR 01
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                Bidirectional Conversational AI Interviews
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Unlike one-way video prompts, our AI avatar actively interacts with candidates in real time. It asks adaptive follow-ups, clarifies ambiguous answers, and scores responses across technical depth, problem decomposition, and communication.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-4 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Real-time speech-to-text</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Dynamic question trees</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Audio & video playback</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Calibrated score rubrics</span>
                </div>
              </div>
            </div>

            {/* PILLAR 2 */}
            <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm group">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-500">
                  <Terminal size={28} />
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                  PILLAR 02
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                Real-World Coding Sandbox & Compilers
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Test hands-on coding capabilities in an enterprise web IDE supporting JavaScript, TypeScript, Python, Java, C++, and Go. Run hidden edge case test suites and measure time/memory complexity automatically.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-4 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Multi-language runtime</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Custom test case suite</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Syntax highlighting & auto-complete</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Big-O runtime verification</span>
                </div>
              </div>
            </div>

            {/* PILLAR 3 */}
            <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm group">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <Brain size={28} />
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                  PILLAR 03
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                Resume-Calibrated Aptitude Engine
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Stop testing senior engineers on high-school puzzle trivia. Our proprietary engine analyzes each applicant&apos;s past projects and tech stack to generate personalized aptitude and system design challenges that verify their real experience.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-4 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Automated resume parsing</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Project claim verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Dynamic question generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Authenticity truth index</span>
                </div>
              </div>
            </div>

            {/* PILLAR 4 */}
            <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm group">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <ShieldCheck size={28} />
                </div>
                <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                  PILLAR 04
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                Integrity Shield & Anti-Cheat System
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Maintain uncompromised test validity. HireSense continuously monitors candidate gaze via OpenCV, locks browser windows, intercepts copy-paste exploits, and logs all anomaly events for recruiter audit without privacy invasion.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-4 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>OpenCV facial landmark tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Window & tab focus protection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Clipboard copy-paste block</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Full timeline audit trails</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. INTERACTIVE LIVE SIMULATOR WIDGET */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-border bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Interactive Sandbox Demo
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4 mb-3">
              Test the AI Evaluation Engine Live
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Select an engineering role archetype to see how HireSense evaluates candidate responses in real time.
            </p>
          </div>

          {/* Role selector buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {[
              { id: 'fullstack', label: 'Senior Full-Stack Engineer', icon: Code2 },
              { id: 'ml', label: 'Staff AI/ML Engineer', icon: Cpu },
              { id: 'devops', label: 'Principal Cloud Platform', icon: Layers }
            ].map(role => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => setSimulatorRole(role.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                    simulatorRole === role.id
                      ? 'bg-primary text-primary-foreground border-primary shadow-md'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  <Icon size={16} />
                  {role.label}
                </button>
              );
            })}
          </div>

          {/* Simulator Box */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border mb-6">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Benchmark Archetype</span>
                <h3 className="text-xl font-bold">{currentSim.title}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentSim.skills.map((skill, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-mono">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Question */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-primary uppercase">
                  <Brain size={14} />
                  AI Interviewer Prompt
                </div>
                <p className="text-sm md:text-base font-semibold leading-relaxed">
                  &quot;{currentSim.aiQuestion}&quot;
                </p>
              </div>

              {/* Candidate Response */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Candidate Transcribed Answer</span>
                  <span className="text-emerald-500 font-mono">Speech-to-Text Confirmed</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed italic">
                  &quot;{currentSim.candidateResponse}&quot;
                </p>
              </div>

              {/* AI Rubric Evaluation */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-card to-muted/30 border border-border">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-primary" />
                    <span className="font-bold text-sm">Automated Recruiter Evaluation Dossier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                      {currentSim.aiEvaluation.rating}
                    </span>
                    <span className="text-lg font-black text-primary font-mono">
                      {currentSim.aiEvaluation.score}/100
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  {currentSim.aiEvaluation.feedback}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {currentSim.aiEvaluation.breakdown.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-background border border-border">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-bold text-foreground">{item.score}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 6. HOW IT WORKS: 4 STEP WORKFLOW */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-border bg-muted/10">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Streamlined Deployment
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4 mb-4">
              How HireSense Works
            </h2>
            <p className="text-muted-foreground text-base">
              From open vacancy to calibrated hire in four frictionless steps.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Post Job & Define Rubric',
                desc: 'Upload a job description or choose our pre-calibrated role benchmarks. Set specific required stacks and weighting.',
                icon: Briefcase
              },
              {
                step: '02',
                title: 'AI Resume Aptitude',
                desc: 'Applicants submit resumes. Our engine automatically synthesizes customized technical checks verifying declared project skills.',
                icon: FileCheck2
              },
              {
                step: '03',
                title: 'Proctored Assessment',
                desc: 'Candidates complete conversational AI interviews & live coding sandboxes under OpenCV integrity surveillance.',
                icon: Laptop
              },
              {
                step: '04',
                title: 'Smart Shortlist & Hire',
                desc: 'Review unified Candidate Fit Dossiers, compare top performers, and extend offers with 100% confidence.',
                icon: Award
              }
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-card border border-border relative flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-black text-primary/25 font-mono">{step.step}</span>
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <Icon size={20} />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 7. LIVE ACTIVE JOBS SPOTLIGHT */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-border bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                Verified Job Market
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4">
                Explore Top Engineering Roles
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mt-2">
                Companies actively screening and hiring top candidates right now via HireSense AI.
              </p>
            </div>
            <Link
              to="/jobs"
              className="text-primary font-semibold text-sm hover:underline inline-flex items-center gap-1.5 self-start md:self-auto"
            >
              View all open vacancies <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredJobs.map(job => (
              <div
                key={job.id}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                      {job.type}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <ShieldCheck size={13} className="text-emerald-500" /> Active Role
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{job.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Building size={14} />
                    <span>{job.company}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground mb-4">
                    {job.salary}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {job.skills.map(s => (
                      <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  to="/jobs"
                  className="w-full py-2.5 px-4 bg-secondary text-secondary-foreground text-xs font-semibold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all text-center flex items-center justify-center gap-1.5"
                >
                  Apply & Take AI Assessment
                  <ChevronRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 8. ENTERPRISE COMPLIANCE & SECURITY */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border bg-muted/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
              Enterprise-Grade Trust & Compliance
            </h2>
            <p className="text-muted-foreground text-sm">
              We uphold the highest global standards for data protection, anti-bias auditing, and candidate privacy.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3">
                <Lock size={20} />
              </div>
              <h4 className="font-bold text-sm mb-1">SOC 2 Type II</h4>
              <p className="text-xs text-muted-foreground">Certified security & encryption protocols</p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck size={20} />
              </div>
              <h4 className="font-bold text-sm mb-1">EEOC Compliant</h4>
              <p className="text-xs text-muted-foreground">Audited algorithmic anti-bias models</p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-3">
                <BadgeCheck size={20} />
              </div>
              <h4 className="font-bold text-sm mb-1">GDPR & CCPA</h4>
              <p className="text-xs text-muted-foreground">Full candidate data ownership rights</p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <Activity size={20} />
              </div>
              <h4 className="font-bold text-sm mb-1">99.99% Uptime</h4>
              <p className="text-xs text-muted-foreground">Enterprise service level agreement</p>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 9. TESTIMONIALS & CASE STUDIES */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-border bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Customer Stories
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-4 mb-4">
              Loved by Engineering Leaders
            </h2>
            <p className="text-muted-foreground text-base">
              See how modern teams transform their hiring cycle with HireSense.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'HireSense reduced our engineering team’s interview burden by 65%. The AI interview follow-up questions probed system design tradeoffs better than our initial human phone screens.',
                author: 'Marcus Vance',
                role: 'VP of Engineering, CloudScale',
                rating: 5,
                metric: 'Saved 28 engineering hours/week'
              },
              {
                quote: 'The Resume Aptitude feature is genius. It caught several candidates whose real knowledge didn’t match their buzzwords, and surfaced high-potential talent that our previous ATS missed.',
                author: 'Elena Rostova',
                role: 'Head of Talent Acquisition, Hyperion FinTech',
                rating: 5,
                metric: 'Cut time-to-hire from 35d to 8d'
              },
              {
                quote: 'As a self-taught engineer, I was worried about resume screening. Taking the HireSense AI interview was transparent, objective, and landed me an offer at a top tech company in 1 week.',
                author: 'Devon Patel',
                role: 'Staff Full-Stack Engineer, Novatech',
                rating: 5,
                metric: 'Landed offer in 6 days'
              }
            ].map((testi, idx) => (
              <div key={idx} className="p-7 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 text-amber-400 mb-4">
                    {[...Array(testi.rating)].map((_, i) => (
                      <Star key={i} size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed mb-6 italic">
                    &quot;{testi.quote}&quot;
                  </p>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="font-bold text-sm">{testi.author}</div>
                  <div className="text-xs text-muted-foreground mb-2">{testi.role}</div>
                  <span className="inline-block text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {testi.metric}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 10. EXPANDABLE FAQ ACCORDION */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-24 border-b border-border bg-muted/10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Got Questions?
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Everything you need to know about our AI hiring platform and assessment integrity.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-base hover:text-primary transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      size={18}
                      className={`text-muted-foreground shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3"
                      >
                        {faq.answer}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 11. HIGH-CONVERTING BOTTOM CTA */}
      {/* ────────────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />

        <div className="container mx-auto px-4 max-w-5xl relative z-10 text-center">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white shadow-2xl relative overflow-hidden">
            {/* Ambient pattern circles */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-6">
                Start in 5 Minutes · 14-Day Free Pilot
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-6 leading-tight">
                Ready to Accelerate Your Engineering Hiring Pipeline?
              </h2>
              <p className="text-base sm:text-lg text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join forward-thinking hiring managers who save 20+ hours each week while identifying top candidates with precision.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-bold rounded-xl shadow-xl hover:bg-white/95 transition-all text-base"
                >
                  Create Free Recruiter Account
                </Link>
                <Link
                  to="/jobs"
                  className="w-full sm:w-auto px-8 py-4 bg-white/10 text-white border border-white/20 hover:bg-white/20 font-semibold rounded-xl transition-all text-base"
                >
                  Browse Candidate Portal
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/80">
                <span>✓ Zero credit card required</span>
                <span>✓ Unlimited applicant screening during trial</span>
                <span>✓ Instant self-serve setup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 12. DEMO MODAL POPUP */}
      {/* ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDemoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowDemoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Play size={18} className="text-primary" />
                  <h3 className="font-bold text-lg">HireSense Platform Walkthrough</h3>
                </div>
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Experience the full end-to-end recruitment automation pipeline:
                </p>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-start gap-3">
                    <span className="font-bold text-primary">1.</span>
                    <div>
                      <strong className="text-foreground block">Recruiter Dashboard & Job Creation</strong>
                      Post jobs with targeted skill requirements, proctoring strictness, and custom question banks.
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-start gap-3">
                    <span className="font-bold text-primary">2.</span>
                    <div>
                      <strong className="text-foreground block">Autonomous AI Interview Session</strong>
                      Candidates speak directly with the AI avatar; conversational speech is transcribed and scored instantly.
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex items-start gap-3">
                    <span className="font-bold text-primary">3.</span>
                    <div>
                      <strong className="text-foreground block">Proctored Code Sandbox & Resume Aptitude</strong>
                      Real-time test suite execution and verification of claims on candidate resumes.
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="px-4 py-2 rounded-xl text-sm border border-border hover:bg-muted"
                >
                  Dismiss
                </button>
                <Link
                  to="/register"
                  onClick={() => setShowDemoModal(false)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Try It Yourself Free
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Landing;
