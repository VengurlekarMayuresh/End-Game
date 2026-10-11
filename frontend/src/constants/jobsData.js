export const CURATED_JOBS = [
  {
    id: 'curated-job-1',
    title: 'Senior Backend Engineer (Distributed Systems)',
    employmentType: 'Full-time',
    location: 'San Francisco, CA',
    isRemote: true,
    salaryMin: 165000,
    salaryMax: 195000,
    salaryCurrency: '$',
    experienceLevel: 'Senior (4-7 yrs)',
    department: 'Core Infrastructure',
    skills: ['Go', 'Kafka', 'Kubernetes', 'PostgreSQL', 'Distributed Systems'],
    matchScore: 96,
    isUrgent: true,
    isFeatured: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    recruiter: {
      companyName: 'CloudScale Systems',
      companyLogo: null,
      industry: 'Cloud Infrastructure & Developer Tools',
      website: 'https://cloudscale.example.com',
      companySize: '250-500 employees',
      fundingStage: 'Series C ($65M raised)',
      about: 'CloudScale builds high-throughput serverless telemetry platforms processing over 40 billion events per day for enterprise engineering teams.'
    },
    description: 'We are seeking an experienced Senior Backend Engineer to design and scale our distributed event ingestion engine. You will own core microservices written in Go and Rust, optimize database partitioning in PostgreSQL and ClickHouse, and collaborate with our platform reliability architects.',
    responsibilities: [
      'Architect, develop, and maintain high-volume distributed data pipelines handling 100k+ RPS.',
      'Optimize database queries, sharding topologies, and low-latency in-memory cache backplanes.',
      'Collaborate with Site Reliability Engineers to ensure 99.99% uptime across multi-region Kubernetes clusters.',
      'Lead technical design discussions, write comprehensive RFCs, and mentor mid-level software engineers.'
    ],
    requirements: [
      '4+ years of professional backend engineering experience with Go, Rust, or modern C++.',
      'Deep understanding of distributed consensus, message brokers (Kafka/Pulsar), and transactional ACID guarantees.',
      'Hands-on experience deploying and profiling workloads on Kubernetes and AWS/GCP infrastructure.',
      'Strong problem-solving fundamentals and passion for low-latency systems engineering.'
    ],
    benefits: [
      'Competitive equity package with liquidity windows',
      'Comprehensive health, dental, and vision insurance with 100% premium coverage',
      '$3,000 annual home office & continuous learning stipend',
      'Flexible remote-first work environment with unlimited PTO'
    ],
    interviewProcess: [
      { step: '1', title: 'Resume Fit & Claim Verification', duration: 'Instant AI' },
      { step: '2', title: 'HireSense Conversational AI Voice Screen', duration: '20 mins' },
      { step: '3', title: 'Proctored Coding Sandbox (Go/Distributed)', duration: '45 mins' },
      { step: '4', title: 'System Architecture Discussion with VP', duration: '45 mins' }
    ]
  },
  {
    id: 'curated-job-2',
    title: 'Staff Full-Stack Architect (React & Node.js)',
    employmentType: 'Full-time',
    location: 'New York, NY',
    isRemote: true,
    salaryMin: 180000,
    salaryMax: 220000,
    salaryCurrency: '$',
    experienceLevel: 'Staff / Lead (7+ yrs)',
    department: 'Product Engineering',
    skills: ['React 19', 'TypeScript', 'Node.js', 'Next.js', 'GraphQL', 'TailwindCSS'],
    matchScore: 94,
    isUrgent: false,
    isFeatured: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    recruiter: {
      companyName: 'Synthetix Interactive',
      companyLogo: null,
      industry: 'AI Productivity & Enterprise SaaS',
      website: 'https://synthetix.example.com',
      companySize: '100-250 employees',
      fundingStage: 'Series B ($35M raised)',
      about: 'Synthetix builds real-time collaborative workspace software powered by generative intelligence, serving over 1.2M monthly active professionals.'
    },
    description: 'We are looking for a Staff Full-Stack Architect to spearhead the frontend and API modernization of our collaborative desktop and web suites. You will set architectural standards for React 19, server components, and WebSockets sync protocols.',
    responsibilities: [
      'Lead the front-end architecture roadmap across multiple web applications using React 19 and TypeScript.',
      'Design idempotent GraphQL and REST APIs backed by resilient Node.js and Redis caching layers.',
      'Champion performance optimizations targeting sub-100ms Core Web Vitals and 60fps animations.',
      'Partner closely with Product Designers and Engineering Directors to shape high-impact product roadmaps.'
    ],
    requirements: [
      '7+ years building enterprise SaaS web applications with React, TypeScript, and modern Node.js.',
      'Proven track record of designing large-scale component design systems and monorepos (Turborepo/Nx).',
      'Deep mastery of real-time state synchronization, WebSockets, and optimistic client UI updates.',
      'Exceptional architectural communication and cross-functional leadership.'
    ],
    benefits: [
      'Top-tier salary with early exercisable stock options',
      '401(k) matching up to 5% with immediate vesting',
      'Annual company retreats in international locations',
      'Comprehensive family leave and wellness subscriptions'
    ],
    interviewProcess: [
      { step: '1', title: 'AI Profile & Portfolio Benchmark', duration: 'Instant' },
      { step: '2', title: 'HireSense Interactive System Design Screen', duration: '25 mins' },
      { step: '3', title: 'Proctored Code Sandbox (React & Node)', duration: '60 mins' },
      { step: '4', title: 'Executive Engineering Leadership Chat', duration: '30 mins' }
    ]
  },
  {
    id: 'curated-job-3',
    title: 'Machine Learning Infrastructure Engineer',
    employmentType: 'Full-time',
    location: 'Austin, TX',
    isRemote: true,
    salaryMin: 190000,
    salaryMax: 235000,
    salaryCurrency: '$',
    experienceLevel: 'Senior (4-8 yrs)',
    department: 'AI Platform Group',
    skills: ['Python', 'PyTorch', 'vLLM', 'CUDA', 'Docker', 'Triton'],
    matchScore: 98,
    isUrgent: true,
    isFeatured: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    recruiter: {
      companyName: 'Hyperion AI Labs',
      companyLogo: null,
      industry: 'Artificial Intelligence & Large Models',
      website: 'https://hyperion.example.com',
      companySize: '80-150 employees',
      fundingStage: 'Series A ($24M raised)',
      about: 'Hyperion AI builds low-latency inference orchestration engines for foundation language and multimodal model deployments.'
    },
    description: 'Join our AI Platform team to build ultra-fast model serving infrastructure. You will optimize inference latency for 70B+ open models using vLLM, TensorRT-LLM, custom CUDA kernels, and distributed GPU clusters.',
    responsibilities: [
      'Deploy and optimize multi-node GPU inference pipelines with continuous batching and PagedAttention.',
      'Implement model quantization strategies (AWQ, GPTQ, FP8) to minimize inference latency and VRAM footprint.',
      'Monitor GPU cluster health, CUDA memory fragmentation, and automated node failovers.',
      'Collaborate with ML research scientists to bridge prototype models into high-throughput production services.'
    ],
    requirements: [
      'Strong proficiency in Python, C++, and deep learning runtimes (PyTorch, Triton Inference Server).',
      'Experience optimizing distributed GPU memory, NCCL communication, and modern inference engines.',
      'Familiarity with container orchestration (K8s, Slurm) on AWS GPU instances (H100/A100).',
      'Passionate about open-source AI tooling and frontier model scalability.'
    ],
    benefits: [
      'High-growth equity grant with tier-1 venture backing',
      'Generous hardware allowance (H100 cloud cluster access for pet research projects)',
      'Full premium healthcare and dependent coverage',
      'Flexible remote schedule with monthly wellness budget'
    ],
    interviewProcess: [
      { step: '1', title: 'HireSense AI ML Concepts Assessment', duration: '25 mins' },
      { step: '2', title: 'Proctored Python / CUDA Optimization Test', duration: '45 mins' },
      { step: '3', title: 'Technical Deep-Dive with Head of AI Platform', duration: '45 mins' },
      { step: '4', title: 'Fast-Track Final Offer Call', duration: '20 mins' }
    ]
  },
  {
    id: 'curated-job-4',
    title: 'Lead DevOps & Cloud Security Engineer',
    employmentType: 'Full-time',
    location: 'Seattle, WA',
    isRemote: true,
    salaryMin: 155000,
    salaryMax: 185000,
    salaryCurrency: '$',
    experienceLevel: 'Lead (5+ yrs)',
    department: 'Site Reliability Engineering',
    skills: ['Kubernetes', 'Terraform', 'AWS', 'eBPF', 'ArgoCD', 'CI/CD'],
    matchScore: 92,
    isUrgent: false,
    isFeatured: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    recruiter: {
      companyName: 'AeroGuard Cloud',
      companyLogo: null,
      industry: 'Cybersecurity & Cloud Security',
      website: 'https://aeroguard.example.com',
      companySize: '300-600 employees',
      fundingStage: 'Series D ($120M raised)',
      about: 'AeroGuard provides zero-trust runtime protection and automated cloud security posture management for Fortune 500 banks.'
    },
    description: 'We are hiring a Lead DevOps & Cloud Security Engineer to establish automated zero-trust infrastructure as code. You will build resilient GitOps pipelines, enforce eBPF security monitoring, and manage multi-region AWS environments.',
    responsibilities: [
      'Architect resilient AWS infrastructure using Terraform and Terragrunt modular configurations.',
      'Maintain Kubernetes clusters across staging, production, and disaster recovery VPCs.',
      'Automate canary deployments and progressive rollouts using ArgoCD and Prometheus.',
      'Enforce least-privilege IAM policies, secret management with Vault, and automated vulnerability scanning.'
    ],
    requirements: [
      '5+ years in DevOps, SRE, or Cloud Infrastructure roles managing production AWS environments.',
      'Expertise in Kubernetes administration, networking (CNI/Cilium), and container runtime security.',
      'Strong programming experience in Go, Python, or Bash for platform automation.',
      'Experience with SOC 2 compliance auditing and infrastructure hardening.'
    ],
    benefits: [
      'Competitive compensation with annual performance bonus',
      'Comprehensive medical, dental, and optical insurance',
      '401(k) retirement plan with 4% employer matching',
      'Annual home office and fitness stipends'
    ],
    interviewProcess: [
      { step: '1', title: 'HireSense Cloud Infrastructure Screen', duration: '20 mins' },
      { step: '2', title: 'Proctored Linux & Terraform Sandbox', duration: '40 mins' },
      { step: '3', title: 'Live Incident Response & Architecture Interview', duration: '45 mins' },
      { step: '4', title: 'Director of Security Chat', duration: '30 mins' }
    ]
  },
  {
    id: 'curated-job-5',
    title: 'Senior Frontend Engineer (Design Systems & WebGL)',
    employmentType: 'Full-time',
    location: 'Boston, MA',
    isRemote: true,
    salaryMin: 145000,
    salaryMax: 175000,
    salaryCurrency: '$',
    experienceLevel: 'Senior (3-6 yrs)',
    department: 'Design Engineering',
    skills: ['React', 'TypeScript', 'Three.js', 'WebGL', 'TailwindCSS', 'Figma'],
    matchScore: 91,
    isUrgent: false,
    isFeatured: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    recruiter: {
      companyName: 'Lumina Creative',
      companyLogo: null,
      industry: 'Design Tech & 3D Web Tools',
      website: 'https://lumina.example.com',
      companySize: '50-100 employees',
      fundingStage: 'Series A ($18M raised)',
      about: 'Lumina creates interactive 3D visualization and creative canvas software for next-generation brand designers.'
    },
    description: 'Bring creative visions to life. We are seeking a Senior Frontend Engineer who obsesses over visual aesthetics, fluid micro-interactions, and performant 3D WebGL experiences using React and Three.js.',
    responsibilities: [
      'Build modular, accessible UI design components used across our web canvas suite.',
      'Implement shaders and 3D scenes using Three.js and React Three Fiber.',
      'Benchmark frontend performance for buttery 60fps canvas dragging, zooming, and rendering.',
      'Bridge the gap between Figma design prototypes and pixel-perfect production code.'
    ],
    requirements: [
      '3+ years building modern client-side applications with React and TypeScript.',
      'Experience with 3D canvas libraries (Three.js, Pixi.js, or Canvas API).',
      'Eye for micro-interactions, layout physics, and modern typography.',
      'Experience authoring component libraries with Tailwind CSS and Radix UI primitives.'
    ],
    benefits: [
      'Top-of-market equity grant with early strike prices',
      'Unlimited book, course, and conference budget',
      'Flexible working hours with async team workflows',
      'Premium health coverage with zero deductible'
    ],
    interviewProcess: [
      { step: '1', title: 'HireSense UI Engineering Assessment', duration: '20 mins' },
      { step: '2', title: 'Interactive Frontend Coding Sandbox', duration: '45 mins' },
      { step: '3', title: 'Design System & UI Architecture Interview', duration: '40 mins' },
      { step: '4', title: 'Founder & Team Culture Meet', duration: '25 mins' }
    ]
  },
  {
    id: 'curated-job-6',
    title: 'Lead Data Engineer (Streaming & Lakehouse)',
    employmentType: 'Full-time',
    location: 'Denver, CO',
    isRemote: true,
    salaryMin: 160000,
    salaryMax: 190000,
    salaryCurrency: '$',
    experienceLevel: 'Lead (5+ yrs)',
    department: 'Data Platform',
    skills: ['Spark', 'Apache Iceberg', 'Python', 'Kafka', 'SQL', 'Snowflake'],
    matchScore: 95,
    isUrgent: true,
    isFeatured: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    recruiter: {
      companyName: 'Apex Data Mesh',
      companyLogo: null,
      industry: 'Enterprise Data Lakehouse & Analytics',
      website: 'https://apexdata.example.com',
      companySize: '150-300 employees',
      fundingStage: 'Series B ($42M raised)',
      about: 'Apex Data Mesh delivers unified streaming lakehouse infrastructure enabling sub-second analytical queries across petabyte datasets.'
    },
    description: 'We are looking for a Lead Data Engineer to govern our real-time streaming data ingestion engine. You will architect Apache Iceberg lakehouses, optimize Spark streaming jobs, and provide clean data models for analytics and ML consumers.',
    responsibilities: [
      'Architect streaming pipelines processing over 250 million records daily using Kafka and Spark Streaming.',
      'Design Iceberg table partitioning strategies to minimize small file compaction overhead.',
      'Implement data quality observability frameworks and automated anomaly alert thresholds.',
      'Collaborate with business intelligence analysts to model dimensional star schemas in Snowflake.'
    ],
    requirements: [
      '5+ years building production data lakes and streaming infrastructure.',
      'Expertise in Apache Spark, PySpark, SQL query optimization, and modern lakehouse formats (Iceberg/Delta).',
      'Familiarity with workflow orchestration tools (Airflow, Dagster, Prefect).',
      'Strong software engineering fundamentals and clean code practices.'
    ],
    benefits: [
      'Equity compensation with competitive base salary',
      'Generous parental leave policy (16 weeks fully paid)',
      'Comprehensive medical, vision, and mental wellness coverage',
      'Dedicated annual personal development budget'
    ],
    interviewProcess: [
      { step: '1', title: 'HireSense Data Architecture Assessment', duration: '20 mins' },
      { step: '2', title: 'Proctored SQL & Python Sandbox Challenge', duration: '45 mins' },
      { step: '3', title: 'Lakehouse Design & Data Modeling Deep-Dive', duration: '45 mins' },
      { step: '4', title: 'Final Team Alignment Chat', duration: '20 mins' }
    ]
  }
];
