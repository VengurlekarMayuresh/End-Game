import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, DollarSign, Briefcase, Clock, Building2, CheckCircle2 } from 'lucide-react';

const STATIC_JOB_DETAILS = {
  "job-1": {
    title: "Senior Frontend Engineer",
    company: "TechNova Solutions",
    location: "San Francisco, CA (Hybrid)",
    salary: "$140k - $180k",
    type: "Full-time",
    postedAt: "2 days ago",
    logo: "https://ui-avatars.com/api/?name=TN&background=0D8ABC&color=fff",
    description: "We are looking for a Senior Frontend Engineer to join our core product team. You will be responsible for building complex, highly-interactive user interfaces that power our next-generation analytics platform. You'll work closely with product managers and designers to iterate quickly and deliver incredible user experiences.",
    requirements: [
      "5+ years of experience building scalable single-page applications.",
      "Expertise in React, TypeScript, and modern CSS (Tailwind, CSS-in-JS).",
      "Deep understanding of web performance optimization and browser rendering.",
      "Experience with state management libraries (Redux, Zustand, or React Query).",
      "Strong communication skills and ability to mentor junior engineers."
    ],
    benefits: [
      "Competitive base salary and equity package.",
      "Unlimited PTO and flexible working hours.",
      "Comprehensive health, dental, and vision insurance.",
      "$2,000 annual learning & development stipend.",
      "State-of-the-art equipment (MacBook Pro + Accessories)."
    ]
  },
  // Adding a fallback for the rest
  "default": {
    title: "Software Engineer",
    company: "Innovative Tech Corp",
    location: "Remote",
    salary: "$100k - $150k",
    type: "Full-time",
    postedAt: "Just now",
    logo: "https://ui-avatars.com/api/?name=IT&background=333&color=fff",
    description: "Join our dynamic team to build scalable software solutions. We are a fast-paced startup looking for self-starters who are passionate about technology and want to make a real impact.",
    requirements: [
      "Proven software development experience.",
      "Familiarity with agile development methodologies.",
      "Strong problem-solving skills."
    ],
    benefits: [
      "Remote-first culture.",
      "Health benefits.",
      "Flexible schedule."
    ]
  }
};

const JobDetails = () => {
  const { id } = useParams();
  const job = STATIC_JOB_DETAILS[id] || STATIC_JOB_DETAILS["default"];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link to="/jobs" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to Jobs
        </Link>

        {/* Header Section */}
        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex items-center gap-6">
              <img src={job.logo} alt={job.company} className="w-24 h-24 rounded-2xl object-cover shadow-sm" />
              <div>
                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                <div className="flex items-center text-xl text-muted-foreground font-medium">
                  <Building2 size={24} className="mr-2" /> {job.company}
                </div>
              </div>
            </div>
            <button className="w-full md:w-auto bg-primary text-primary-foreground font-bold px-10 py-4 rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1">
              Apply Now
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-8 border-t border-border">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1 flex items-center"><MapPin size={14} className="mr-1"/> Location</p>
              <p className="font-semibold">{job.location}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1 flex items-center"><DollarSign size={14} className="mr-1"/> Salary</p>
              <p className="font-semibold">{job.salary}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1 flex items-center"><Briefcase size={14} className="mr-1"/> Job Type</p>
              <p className="font-semibold">{job.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1 flex items-center"><Clock size={14} className="mr-1"/> Posted</p>
              <p className="font-semibold">{job.postedAt}</p>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8 bg-card p-8 rounded-3xl border border-border shadow-sm">
            <section>
              <h2 className="text-2xl font-bold mb-4">Job Description</h2>
              <p className="text-muted-foreground leading-relaxed">{job.description}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">Requirements</h2>
              <ul className="space-y-3">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start text-muted-foreground">
                    <CheckCircle2 size={20} className="text-primary mr-3 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="md:col-span-1 space-y-8">
            <div className="bg-card p-8 rounded-3xl border border-border shadow-sm">
              <h2 className="text-xl font-bold mb-6">Benefits & Perks</h2>
              <ul className="space-y-4">
                {job.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 mr-3 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
