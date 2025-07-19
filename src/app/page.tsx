"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { useContentItems, useSearchContent, useSubmitUrl } from '@/hooks/useContentItems';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  Menu, 
  X, 
  Search, 
  Plus, 
  Grid3X3, 
  List, 
  Filter, 
  MoreHorizontal,
  FileText,
  Calendar,
  User,
  Settings,
  Bell,
  Home,
  Youtube,
  Link,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

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

interface DashboardProps {
  className?: string;
}


function SummaRiseDashboard({ className = "" }: DashboardProps) {
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [urlInput, setUrlInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [contentType, setContentType] = useState<'youtube' | 'article' | null>(null);

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch content items or search results
  const { data: contentData, isLoading: isLoadingContent, error: contentError } = useContentItems();
  const { data: searchData, isLoading: isSearching } = useSearchContent(
    debouncedSearchQuery, 
    !!debouncedSearchQuery.trim()
  );

  // URL submission mutation
  const submitUrlMutation = useSubmitUrl();

  // URL validation and content type detection
  useEffect(() => {
    if (!urlInput.trim()) {
      setIsValidUrl(false);
      setContentType(null);
      return;
    }

    try {
      const urlObj = new URL(urlInput);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check if valid URL
      setIsValidUrl(true);
      
      // Detect content type
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
        setContentType('youtube');
      } else {
        setContentType('article');
      }
    } catch {
      setIsValidUrl(false);
      setContentType(null);
    }
  }, [urlInput]);

  // Determine which data to display
  const isSearchMode = !!debouncedSearchQuery.trim();
  const currentData = isSearchMode ? searchData : contentData;
  const currentContent = currentData?.data || [];
  const isLoading = isSearchMode ? isSearching : isLoadingContent;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!urlInput.trim() || !isValidUrl || !contentType) {
      toast({
        variant: "destructive",
        title: "잘못된 URL",
        description: "올바른 URL을 입력해주세요."
      });
      return;
    }

    submitUrlMutation.mutate({
      url: urlInput,
      content_type: contentType
    });

    // Clear the form
    setUrlInput('');
  };

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
              <span className="font-semibold text-lg">SummaRise</span>
            </div>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="콘텐츠 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-30 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0
        `}>
          <div className="flex h-full flex-col">
            <div className="p-4 pt-20 md:pt-4">
              <nav className="space-y-2">
                <Button variant="default" className="w-full justify-start gap-2">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  Content Library
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent
                </Button>
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black/50 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Title */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Content Summarizer</h1>
              <p className="text-muted-foreground mt-2">
                YouTube 링크나 웹 아티클 URL을 입력하여 자동으로 요약을 생성하고 관리하세요
              </p>
            </div>

            {/* URL Input Form */}
            <Card className="p-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">새 콘텐츠 요약하기</h2>
                <form onSubmit={handleSubmit}>
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="YouTube 링크 또는 웹 아티클 URL을 입력하세요..."
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="pl-10"
                          disabled={submitUrlMutation.isPending}
                        />
                      </div>
                      
                      {/* URL Validation Feedback */}
                      <div className="flex items-center gap-2 min-h-[20px]">
                        {urlInput && !isValidUrl && (
                          <div className="flex items-center gap-1 text-destructive text-sm">
                            <AlertCircle className="w-3 h-3" />
                            올바른 URL 형식이 아닙니다
                          </div>
                        )}
                        {urlInput && isValidUrl && contentType && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {contentType === 'youtube' ? (
                              <>
                                <Youtube className="w-3 h-3" />
                                YouTube 영상
                              </>
                            ) : (
                              <>
                                <FileText className="w-3 h-3" />
                                웹 아티클
                              </>
                            )}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={!urlInput.trim() || !isValidUrl || submitUrlMutation.isPending}
                      className="px-8"
                    >
                      {submitUrlMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          요약 중...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          요약하기
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </Card>

            {/* Content Library Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold">
                  {isSearchMode ? `"${debouncedSearchQuery}" 검색 결과` : '콘텐츠 라이브러리'}
                </h2>
                <Badge variant="secondary">
                  {isLoading ? 'Loading...' : `${currentContent.length} items`}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search on mobile */}
            <div className="md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="콘텐츠 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Content Grid/List */}
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold mb-2">
                  {isSearchMode ? '검색 중...' : '콘텐츠를 불러오는 중...'}
                </h3>
                <p className="text-muted-foreground">잠시만 기다려주세요</p>
              </div>
            ) : contentError ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">콘텐츠를 불러올 수 없습니다</h3>
                <p className="text-muted-foreground">네트워크 연결을 확인하고 다시 시도해주세요</p>
              </div>
            ) : currentContent.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isSearchMode ? '검색 결과가 없습니다' : '아직 요약된 콘텐츠가 없습니다'}
                </h3>
                <p className="text-muted-foreground">
                  {isSearchMode ? '다른 검색어를 시도해보세요' : '위에서 URL을 입력하여 첫 번째 콘텐츠를 요약해보세요'}
                </p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentContent.map((item) => (
                      <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        {item.thumbnail && (
                          <div className="aspect-video overflow-hidden">
                            <img 
                              src={item.thumbnail} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {item.content_type === 'youtube' ? (
                                <Youtube className="w-4 h-4 text-red-600 flex-shrink-0" />
                              ) : (
                                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              )}
                              <span className="text-sm text-muted-foreground truncate">
                                {item.channel_or_site}
                              </span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                          <h3 className="font-semibold line-clamp-2">{item.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {item.summary}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.created_at)}
                            </div>
                            <a 
                              href={item.original_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-foreground transition-colors flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3" />
                              원본
                            </a>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentContent.map((item) => (
                      <Card key={item.id} className="p-4 hover:shadow-sm transition-shadow cursor-pointer">
                        <div className="flex items-start gap-4">
                          {item.thumbnail && (
                            <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0">
                              <img 
                                src={item.thumbnail} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {item.content_type === 'youtube' ? (
                                  <Youtube className="w-4 h-4 text-red-600" />
                                ) : (
                                  <FileText className="w-4 h-4 text-blue-600" />
                                )}
                                <h3 className="font-semibold">{item.title}</h3>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.summary}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-1">
                                {item.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {item.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{item.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{item.channel_or_site}</span>
                                <span>•</span>
                                <span>{formatDate(item.created_at)}</span>
                                <a 
                                  href={item.original_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:text-foreground transition-colors flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  원본
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return <SummaRiseDashboard />;
}
