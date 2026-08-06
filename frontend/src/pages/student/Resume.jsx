import React, { useCallback, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentProfile, useUploadDocument } from '../../hooks/useStudent';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';

const Resume = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useStudentProfile();
  const uploadDoc = useUploadDocument();
  
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const resumeDoc = profile?.documents?.find(d => d.type === 'RESUME');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    setError('');
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    try {
      await uploadDoc.mutateAsync({ file, type: 'RESUME' });
    } catch (err) {
      setError('Failed to upload resume. Please try again.');
    }
  };

  if (isLoading) return <div className="animate-pulse">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Resume Management</h1>
        <p className="text-muted-foreground">Upload and manage your resume to apply for jobs instantly.</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
        
        {resumeDoc ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-semibold">{resumeDoc.filename}</h3>
                  <p className="text-sm text-muted-foreground">
                    Uploaded on {new Date(resumeDoc.createdAt).toLocaleDateString()} • {(resumeDoc.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a href={resumeDoc.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">
                  View PDF
                </a>
                <button className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-xl">
              <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={16} />
              <p>Your resume is active and will be sent automatically when you apply to jobs matching your profile.</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">Upload New Resume</h2>
              <p className="text-muted-foreground text-sm">PDF format only. Maximum size 5MB.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div 
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-colors
                ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UploadCloud size={32} />
              </div>
              <p className="text-lg font-medium mb-2">Drag and drop your resume here</p>
              <p className="text-muted-foreground text-sm mb-6">or click to browse from your computer</p>
              
              <input 
                type="file" 
                id="resume-upload" 
                className="hidden" 
                accept="application/pdf"
                onChange={handleChange}
              />
              <label 
                htmlFor="resume-upload"
                className="cursor-pointer bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors inline-block"
              >
                {uploadDoc.isPending ? 'Uploading...' : 'Browse Files'}
              </label>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Resume;
