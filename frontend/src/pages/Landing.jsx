import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle, Search, Users, 
  BarChart, Zap, Shield, PlayCircle 
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const Landing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col pt-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-sm font-medium mb-8 text-muted-foreground">
              <span className="flex h-2 w-2 rounded-full bg-primary"></span>
              Introducing the Future of Hiring
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Hire Smarter, Faster, and Fairer with AI
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The end-to-end recruitment automation platform that brings precision to hiring. AI-powered interviews, coding sandboxes, and intelligent evaluation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group">
                Start Hiring Now
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/jobs" className="w-full sm:w-auto px-8 py-4 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all border border-border flex items-center justify-center gap-2">
                <Search size={18} />
                Find Jobs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Companies */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-muted-foreground mb-8 uppercase tracking-widest">Trusted by innovative teams worldwide</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {['Acme Corp', 'GlobalNet', 'TechFlow', 'Innovatech', 'Nexus'].map((company) => (
              <div key={company} className="text-2xl font-bold font-serif">{company}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A Complete Recruitment Ecosystem</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to source, evaluate, and hire top talent in one unified platform.</p>
          </div>
          
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { icon: <Zap className="text-yellow-500" size={32}/>, title: 'AI Interviews', desc: 'Conduct automated, conversational interviews with context-aware follow-ups.' },
              { icon: <Shield className="text-green-500" size={32}/>, title: 'Proctored Assessments', desc: 'Ensure integrity with OpenCV face monitoring and browser lock technology.' },
              { icon: <BarChart className="text-blue-500" size={32}/>, title: 'Intelligent Evaluation', desc: 'Aggregate scores from coding, aptitude, and interviews into a single metric.' },
            ].map((feature, idx) => (
              <motion.div key={idx} variants={fadeInUp} className="p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-6 p-4 rounded-xl bg-muted w-fit inline-block">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '1M+', label: 'Candidates Assessed' },
              { value: '500+', label: 'Companies Hiring' },
              { value: '80%', label: 'Time Saved' },
              { value: '99.9%', label: 'Platform Uptime' },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-4xl md:text-5xl font-extrabold mb-2">{stat.value}</div>
                <div className="text-primary-foreground/80 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">Ready to transform your hiring?</h2>
          <p className="text-xl text-muted-foreground mb-10">Join hundreds of companies that have already upgraded their recruitment pipeline.</p>
          <Link to="/register" className="px-8 py-4 bg-foreground text-background font-semibold rounded-lg hover:bg-foreground/90 transition-all inline-block shadow-xl">
            Create Your Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
