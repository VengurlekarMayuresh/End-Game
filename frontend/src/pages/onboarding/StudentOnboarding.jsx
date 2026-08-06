import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/axios';

const studentSchema = z.object({
  phone: z.string().min(10, 'Valid phone number is required'),
  college: z.string().min(2, 'College name is required'),
  university: z.string().min(2, 'University name is required'),
  degree: z.string().min(2, 'Degree is required'),
  branch: z.string().min(2, 'Branch is required'),
  graduationYear: z.string().regex(/^20\d{2}$/, 'Valid graduation year required'),
  cgpa: z.string().min(1, 'CGPA is required'),
  github: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  linkedin: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  portfolio: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

const StudentOnboarding = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      phone: '', college: '', university: '', degree: '',
      branch: '', graduationYear: '', cgpa: '', github: '', linkedin: '', portfolio: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      const res = await api.post('/auth/complete-profile', {
        role: 'STUDENT',
        profileData: data
      });
      
      updateUser(res.data.user);
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile');
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-card p-8 rounded-2xl border border-border shadow-sm">
        <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
        <p className="text-muted-foreground mb-8">Tell us about your academic background</p>

        {error && <div className="p-3 mb-6 bg-destructive/10 text-destructive rounded-md">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number *</label>
              <input {...register('phone')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="e.g. +1 234 567 890" />
              {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Graduation Year *</label>
              <input {...register('graduationYear')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="e.g. 2026" />
              {errors.graduationYear && <p className="text-destructive text-sm mt-1">{errors.graduationYear.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">College *</label>
              <input {...register('college')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="College Name" />
              {errors.college && <p className="text-destructive text-sm mt-1">{errors.college.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">University *</label>
              <input {...register('university')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="University Name" />
              {errors.university && <p className="text-destructive text-sm mt-1">{errors.university.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Degree *</label>
              <input {...register('degree')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="e.g. B.Tech" />
              {errors.degree && <p className="text-destructive text-sm mt-1">{errors.degree.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Branch / Major *</label>
              <input {...register('branch')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="e.g. Computer Science" />
              {errors.branch && <p className="text-destructive text-sm mt-1">{errors.branch.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">CGPA / Percentage *</label>
              <input {...register('cgpa')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="e.g. 8.5" />
              {errors.cgpa && <p className="text-destructive text-sm mt-1">{errors.cgpa.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">GitHub Profile</label>
              <input {...register('github')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="https://github.com/..." />
              {errors.github && <p className="text-destructive text-sm mt-1">{errors.github.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">LinkedIn Profile</label>
              <input {...register('linkedin')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="https://linkedin.com/in/..." />
              {errors.linkedin && <p className="text-destructive text-sm mt-1">{errors.linkedin.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Portfolio Website</label>
              <input {...register('portfolio')} className="w-full p-3 rounded-md bg-background border border-input focus:ring-2 focus:ring-primary" placeholder="https://..." />
              {errors.portfolio && <p className="text-destructive text-sm mt-1">{errors.portfolio.message}</p>}
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentOnboarding;
