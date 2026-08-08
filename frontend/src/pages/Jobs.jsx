import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';
import { Briefcase, MapPin, DollarSign, Clock, Building2, Search, FileText } from 'lucide-react';

const fmtSalary = (min, max, currency) => {
  if (!min && !max) return 'Not Specified';
  const fmt = n => n >= 100000 ? `${(n/100000).toFixed(1)}L` : `${(n/1000).toFixed(0)}K`;
  if (min && max) return `${currency} ${fmt(min)}–${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  return `Up to ${currency} ${fmt(max)}`;
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/student/jobs')
      .then(res => setJobs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchSearch = searchQuery
      ? job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;
    const matchLocation = locationQuery
      ? job.location.toLowerCase().includes(locationQuery.toLowerCase())
      : true;
    return matchSearch && matchLocation;
  });

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Discover Your Next Role</h1>
          <p className="text-xl text-muted-foreground">Browse through active job postings matching your skills.</p>
        </div>

        {/* Search Bar */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Job title or skills (React, Node...)"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-input focus:ring-2 focus:ring-primary outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Location (Mumbai, Remote...)"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-input focus:ring-2 focus:ring-primary outline-none"
              value={locationQuery}
              onChange={e => setLocationQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded-2xl" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-14 text-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={28} />
            </div>
            <h3 className="font-semibold text-lg mb-2">No active jobs found</h3>
            <p className="text-muted-foreground text-sm">
              Try modifying your search or location query to find jobs.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const companyName = job.recruiter?.companyName || 'Confidential';
              const logoInitial = companyName.charAt(0);
              const salaryStr = fmtSalary(job.salaryMin, job.salaryMax, job.salaryCurrency);

              return (
                <div key={job.id} className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:border-primary/50 transition-colors group">
                  <div className="flex flex-col md:flex-row gap-6">
                    {job.recruiter?.companyLogo ? (
                      <img src={job.recruiter.companyLogo} alt={companyName} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center rounded-xl shrink-0">
                        {logoInitial}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row justify-between items-start mb-2 gap-4">
                        <div>
                          <Link to={`/jobs/${job.id}`} className="text-xl font-bold group-hover:text-primary transition-colors">
                            {job.title}
                          </Link>
                          <div className="flex items-center text-muted-foreground mt-1 font-medium">
                            <Building2 size={16} className="mr-1" /> {companyName}
                          </div>
                        </div>
                        <Link to={`/jobs/${job.id}`} className="bg-secondary/20 text-secondary font-medium px-6 py-2 rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-colors shrink-0">
                          View Details
                        </Link>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center"><MapPin size={16} className="mr-1" /> {job.location} {job.isRemote && '(Remote)'}</div>
                        <div className="flex items-center text-green-600 font-medium"><DollarSign size={16} className="mr-1" /> {salaryStr}</div>
                        <div className="flex items-center"><Briefcase size={16} className="mr-1" /> {job.employmentType}</div>
                        <div className="flex items-center"><Clock size={16} className="mr-1" /> {new Date(job.createdAt).toLocaleDateString()}</div>
                      </div>

                      {job.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map(tag => (
                            <span key={tag} className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
