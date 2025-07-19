import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ContentDetail {
  id: string;
  title: string;
  summary: string;
  original_url: string;
  content_type: 'youtube' | 'article';
  channel_or_site: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  thumbnail?: string;
}

interface ResumarizeResponse {
  success: boolean;
  summary: string;
  updated_at: string;
}

interface EditResponse {
  success: boolean;
  summary: string;
  updated_at: string;
}

// Hook to fetch content detail
export function useContentDetail(id: string) {
  return useQuery({
    queryKey: ['content-detail', id],
    queryFn: async (): Promise<ContentDetail> => {
      const response = await fetch(`/api/content-items/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch content detail');
      }
      
      return response.json();
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook to resummarize content
export function useResumarizeContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string): Promise<ResumarizeResponse> => {
      const response = await fetch(`/api/content-items/${id}/resummarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resummarize content');
      }

      return response.json();
    },
    onSuccess: (data, id) => {
      // Update the content detail cache with new data
      queryClient.setQueryData(['content-detail', id], (oldData: ContentDetail | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          summary: data.summary,
          updated_at: data.updated_at
        };
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
      queryClient.invalidateQueries({ queryKey: ['search-content'] });
      
      toast({
        title: "재요약 완료",
        description: "콘텐츠가 성공적으로 재요약되었습니다."
      });
    },
    onError: (error) => {
      console.error('Resummarize error:', error);
      toast({
        variant: "destructive",
        title: "재요약 실패",
        description: error instanceof Error ? error.message : "콘텐츠 재요약 중 오류가 발생했습니다."
      });
    }
  });
}

// Hook to edit content
export function useEditContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, newContent }: { id: string; newContent: string }): Promise<EditResponse> => {
      const response = await fetch(`/api/content-items/${id}/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newContent })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to edit content');
      }

      return response.json();
    },
    onSuccess: (data, { id }) => {
      // Update the content detail cache with new data
      queryClient.setQueryData(['content-detail', id], (oldData: ContentDetail | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          summary: data.summary,
          updated_at: data.updated_at
        };
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
      queryClient.invalidateQueries({ queryKey: ['search-content'] });
      
      toast({
        title: "수정 완료",
        description: "콘텐츠가 성공적으로 수정되었습니다."
      });
    },
    onError: (error) => {
      console.error('Edit content error:', error);
      toast({
        variant: "destructive",
        title: "수정 실패",
        description: error instanceof Error ? error.message : "콘텐츠 수정 중 오류가 발생했습니다."
      });
    }
  });
}