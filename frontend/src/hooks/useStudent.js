import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

export const useStudentProfile = () => {
  return useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      const { data } = await api.get('/student/profile');
      return data;
    }
  });
};

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ file, type }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const { data } = await api.post('/student/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] });
    }
  });
};
