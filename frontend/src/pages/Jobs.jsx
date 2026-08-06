import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, Clock, Building2 } from 'lucide-react';

const STATIC_JOBS = [
  {
    id: "job-1",
    title: "Senior Frontend Engineer",
    company: "TechNova Solutions",
    location: "San Francisco, CA (Hybrid)",
    salary: "$140k - $180k",
    type: "Full-time",
    postedAt: "2 days ago",
    logo: "https://ui-avatars.com/api/?name=TN&background=0D8ABC&color=fff",
    tags: ["React", "TypeScript", "Tailwind"],
  },
  {
    id: "job-2",
    title: "Machine Learning Researcher",
    company: "DeepMind AI",
    location: "London, UK (Remote)",
    salary: "£90k - £130k",
    type: "Full-time",
    postedAt: "5 hours ago",
    logo: "https://ui-avatars.com/api/?name=DM&background=4F46E5&color=fff",
    tags: ["Python", "PyTorch", "NLP"],
  },
  {
    id: "job-3",
    title: "Product Designer (UI/UX)",
    company: "Creative Studio",
    location: "New York, NY (On-site)",
    salary: "$110k - $140k",
    type: "Full-time",
    postedAt: "1 day ago",
    logo: "https://ui-avatars.com/api/?name=CS&background=EC4899&color=fff",
    tags: ["Figma", "Prototyping", "User Research"],
  },
  {
    id: "job-4",
    title: "DevOps Engineer",
    company: "CloudScale Inc",
    location: "Remote (Global)",
    salary: "$130k - $160k",
    type: "Contract",
    postedAt: "3 days ago",
    logo: "https://ui-avatars.com/api/?name=CS&background=10B981&color=fff",
    tags: ["AWS", "Kubernetes", "Docker", "CI/CD"],
  },
];

const Jobs = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Discover Your Next Role</h1>
          <p className="text-xl text-muted-foreground">Browse through hundreds of AI-curated job postings.</p>
        </div>

        {/* Search Bar Placeholder */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4 mb-10">
          <input type="text" placeholder="Job title or keyword" className="flex-1 p-3 rounded-xl bg-background border border-input focus:ring-2 focus:ring-primary outline-none" />
          <input type="text" placeholder="Location" className="flex-1 p-3 rounded-xl bg-background border border-input focus:ring-2 focus:ring-primary outline-none" />
          <button className="bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-xl hover:bg-primary/90 transition-colors">Search</button>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {STATIC_JOBS.map((job) => (
            <div key={job.id} className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:border-primary/50 transition-colors group">
              <div className="flex flex-col md:flex-row gap-6">
                <img src={job.logo} alt={job.company} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-2 gap-4">
                    <div>
                      <Link to={`/jobs/${job.id}`} className="text-xl font-bold group-hover:text-primary transition-colors">
                        {job.title}
                      </Link>
                      <div className="flex items-center text-muted-foreground mt-1">
                        <Building2 size={16} className="mr-1" /> {job.company}
                      </div>
                    </div>
                    <Link to={`/jobs/${job.id}`} className="bg-secondary/20 text-secondary font-medium px-6 py-2 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-colors shrink-0">
                      View Details
                    </Link>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center"><MapPin size={16} className="mr-1" /> {job.location}</div>
                    <div className="flex items-center"><DollarSign size={16} className="mr-1" /> {job.salary}</div>
                    <div className="flex items-center"><Briefcase size={16} className="mr-1" /> {job.type}</div>
                    <div className="flex items-center"><Clock size={16} className="mr-1" /> {job.postedAt}</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {job.tags.map(tag => (
                      <span key={tag} className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
