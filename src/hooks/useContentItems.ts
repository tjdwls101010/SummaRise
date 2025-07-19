import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: string;
  title: string;
  summary: string;
  original_url: string;
  content_type: 'youtube' | 'article';
  channel_or_site: string;
  created_at: string;
  tags: string[];
  thumbnail?: string;
}

interface ContentItemsResponse {
  data: ContentItem[];
  count: number;
  hasMore: boolean;
}

interface SearchResponse extends ContentItemsResponse {
  query: string;
}

// Hook to fetch content items
export function useContentItems(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['content-items', limit, offset],
    queryFn: async (): Promise<ContentItemsResponse> => {
      const response = await fetch(`/api/content-items?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch content items');
      }
      
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook to search content items
export function useSearchContent(query: string, enabled = true) {
  return useQuery({
    queryKey: ['search-content', query],
    queryFn: async (): Promise<SearchResponse> => {
      const searchParams = new URLSearchParams();
      if (query) searchParams.set('q', query);
      
      const response = await fetch(`/api/search?${searchParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search content');
      }
      
      return response.json();
    },
    enabled: enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    refetchOnWindowFocus: false,
  });
}

// Hook to submit URL for summarization
export function useSubmitUrl() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ url, content_type }: { url: string; content_type: 'youtube' | 'article' }) => {
      const response = await fetch('/api/summaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token' // TODO: Replace with actual auth token
        },
        body: JSON.stringify({
          url,
          content_type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API 요청 실패');
      }

      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "요약 요청 완료",
        description: "콘텐츠 요약이 진행 중입니다. 잠시 후 결과가 표시됩니다."
      });
      
      // Invalidate and refetch content items to show the new item
      queryClient.invalidateQueries({ queryKey: ['content-items'] });
      queryClient.invalidateQueries({ queryKey: ['search-content'] });
    },
    onError: (error) => {
      console.error('Submit error:', error);
      toast({
        variant: "destructive",
        title: "요약 실패", 
        description: error instanceof Error ? error.message : "콘텐츠 요약 중 오류가 발생했습니다."
      });
    }
  });
}