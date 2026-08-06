import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';

const recruiterSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  designation: z.string().min(2, 'Designation is required'),
  industry: z.string().min(2, 'Industry is required'),
  companySize: z.string().min(1, 'Company size is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  companyWebsite: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  companyDescription: z.string().optional(),
});

const RecruiterOnboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(recruiterSchema),
    defaultValues: {
      companyName: '', designation: '', industry: '', companySize: '',
      phone: '', companyWebsite: '', companyDescription: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      const res = await api.post('/auth/complete-profile', {
        role: 'RECRUITER',
        profileData: data
      });
      
      updateUser(res.data.user);
      navigate('/recruiter');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile');
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-card p-8 rounded-2xl border border-border shadow-sm">
        <h1 className="text-3xl font-bold mb-2">Recruiter Details</h1>
        <p className="text-muted-foreground mb-8">Set up your organization to start hiring</p>

        {error && <div className="p-3 mb-6 bg-destructive/10 text-destructive rounded-md">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Company Name *</label>
              <input {...register('companyName')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="Company Name" />
              {errors.companyName && <p className="text-destructive text-sm mt-1">{errors.companyName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Your Designation *</label>
              <input {...register('designation')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="e.g. HR Manager" />
              {errors.designation && <p className="text-destructive text-sm mt-1">{errors.designation.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Industry *</label>
              <input {...register('industry')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="e.g. Technology" />
              {errors.industry && <p className="text-destructive text-sm mt-1">{errors.industry.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Company Size *</label>
              <select {...register('companySize')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary">
                <option value="">Select Size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
              {errors.companySize && <p className="text-destructive text-sm mt-1">{errors.companySize.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number *</label>
              <input {...register('phone')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="+1 234 567 890" />
              {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Company Website</label>
              <input {...register('companyWebsite')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="https://..." />
              {errors.companyWebsite && <p className="text-destructive text-sm mt-1">{errors.companyWebsite.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Company Description</label>
            <textarea {...register('companyDescription')} rows="3" className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="Brief description of what your company does..."></textarea>
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-4 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RecruiterOnboarding;
