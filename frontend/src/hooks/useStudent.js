import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

// ─── PROFILE ─────────────────────────────────────────────────────────────────

export const useStudentProfile = () =>
  useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => { const { data } = await api.get('/student/profile'); return data; },
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { const { data: res } = await api.put('/student/profile', data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, type }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      const { data } = await api.post('/student/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/student/documents/${id}`); return data; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

// ─── EDUCATION ────────────────────────────────────────────────────────────────

export const useAddEducation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { const { data: res } = await api.post('/student/education', data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useUpdateEducation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => { const { data: res } = await api.put(`/student/education/${id}`, data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useDeleteEducation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/student/education/${id}`); return data; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

// ─── SKILLS ───────────────────────────────────────────────────────────────────

export const useAddSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { const { data: res } = await api.post('/student/skills', data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useUpdateSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => { const { data: res } = await api.put(`/student/skills/${id}`, data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useDeleteSkill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/student/skills/${id}`); return data; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

// ─── PROJECTS ─────────────────────────────────────────────────────────────────

export const useAddProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { const { data: res } = await api.post('/student/projects', data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => { const { data: res } = await api.put(`/student/projects/${id}`, data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/student/projects/${id}`); return data; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

// ─── CERTIFICATIONS ───────────────────────────────────────────────────────────

export const useAddCertification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { const { data: res } = await api.post('/student/certifications', data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useUpdateCertification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => { const { data: res } = await api.put(`/student/certifications/${id}`, data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useDeleteCertification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/student/certifications/${id}`); return data; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

// ─── EXPERIENCE ───────────────────────────────────────────────────────────────

export const useAddExperience = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { const { data: res } = await api.post('/student/experience', data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useUpdateExperience = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => { const { data: res } = await api.put(`/student/experience/${id}`, data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useDeleteExperience = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/student/experience/${id}`); return data; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

// ─── LANGUAGES ────────────────────────────────────────────────────────────────

export const useAddLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { const { data: res } = await api.post('/student/languages', data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useUpdateLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => { const { data: res } = await api.put(`/student/languages/${id}`, data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

export const useDeleteLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => { const { data } = await api.delete(`/student/languages/${id}`); return data; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

// ─── SOCIAL LINKS ─────────────────────────────────────────────────────────────

export const useUpdateSocialLinks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { const { data: res } = await api.put('/student/social-links', data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};

// ─── PREFERENCES ──────────────────────────────────────────────────────────────

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => { const { data: res } = await api.put('/student/preferences', data); return res; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studentProfile'] }),
  });
};
