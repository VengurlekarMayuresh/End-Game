import React, { useState } from 'react';
import { useStudentProfile, useUploadDocument, useDeleteDocument } from '../../hooks/useStudent';
import { Files, UploadCloud, FileText, Image, File, Trash2, Download, AlertCircle, Plus } from 'lucide-react';

const TYPE_LABELS = { RESUME: 'Resume', PICTURE: 'Profile Picture', CERTIFICATE: 'Certificate', OTHER: 'Other' };
const TYPE_COLORS = {
  RESUME: 'bg-blue-500/10 text-blue-500',
  PICTURE: 'bg-green-500/10 text-green-500',
  CERTIFICATE: 'bg-yellow-500/10 text-yellow-600',
  OTHER: 'bg-muted text-muted-foreground',
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const UploadZone = ({ type, label, accept, onUpload, uploading }) => {
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file, type);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${drag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
      onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDrag(false); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-3">
        <UploadCloud size={22} />
      </div>
      <p className="font-medium mb-1">{label}</p>
      <p className="text-xs text-muted-foreground mb-4">Drag & drop or click to browse · Max 5MB</p>
      <input id={`upload-${type}`} type="file" className="hidden" accept={accept} onChange={e => e.target.files[0] && onUpload(e.target.files[0], type)} />
      <label htmlFor={`upload-${type}`} className="cursor-pointer px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-all inline-block">
        {uploading ? 'Uploading...' : 'Choose File'}
      </label>
    </div>
  );
};

const Documents = () => {
  const { data: profile, isLoading } = useStudentProfile();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  const [uploadType, setUploadType] = useState(null);
  const [error, setError] = useState('');

  const handleUpload = async (file, type) => {
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB'); return; }
    setError('');
    try {
      await uploadDoc.mutateAsync({ file, type });
    } catch { setError('Upload failed. Please try again.'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this document?')) await deleteDoc.mutateAsync(id);
  };

  if (isLoading) return <div className="animate-pulse space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-2xl" />)}</div>;

  const documents = profile?.documents || [];
  const grouped = documents.reduce((acc, doc) => {
    acc[doc.type] = acc[doc.type] || [];
    acc[doc.type].push(doc);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Documents</h1>
          <p className="text-muted-foreground">Upload and manage your resume, certificates, and other files</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive text-sm rounded-xl">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Upload Zones */}
      <div className="grid sm:grid-cols-2 gap-4">
        <UploadZone type="RESUME" label="Upload Resume" accept="application/pdf" onUpload={handleUpload} uploading={uploadDoc.isPending} />
        <UploadZone type="CERTIFICATE" label="Upload Certificate" accept="application/pdf,image/*" onUpload={handleUpload} uploading={uploadDoc.isPending} />
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Files size={28} />
          </div>
          <h3 className="font-semibold text-lg mb-2">No documents yet</h3>
          <p className="text-muted-foreground text-sm">Upload your resume and certificates above to get started</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold">Uploaded Documents ({documents.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[doc.type]}`}>
                  {doc.mimetype === 'application/pdf' ? <FileText size={18} /> : <Image size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.filename}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[doc.type]}`}>{TYPE_LABELS[doc.type]}</span>
                    <span className="text-xs text-muted-foreground">{formatSize(doc.size)}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={`http://localhost:5000${doc.url}`} target="_blank" rel="noreferrer"
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                    <Download size={16} />
                  </a>
                  <button onClick={() => handleDelete(doc.id)} disabled={deleteDoc.isPending}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
