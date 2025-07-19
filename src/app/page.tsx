"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { useContentItems, useSearchContent, useSubmitUrl } from '@/hooks/useContentItems';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { 
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
  ExternalLink,
  BookOpen,
  Clock,
  Archive
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

// Menu items for sidebar
const menuItems = [
  {
    title: "대시보드",
    url: "/",
    icon: Home,
    isActive: true,
  },
  {
    title: "콘텐츠 라이브러리",
    url: "/library",
    icon: BookOpen,
  },
  {
    title: "최근 항목",
    url: "/recent", 
    icon: Clock,
  },
  {
    title: "아카이브",
    url: "/archive",
    icon: Archive,
  },
];

function AppSidebar() {
  const router = useRouter();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <Image
            src="/app-logo.png"
            alt="SummaRise"
            width={222}
            height={11}
            className="rounded-md"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>애플리케이션</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    isActive={item.isActive}
                  >
                    <button 
                      onClick={() => router.push(item.url)}
                      className="flex items-center gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarMenuButton 
            className="w-full justify-start gap-2 h-10"
            onClick={() => router.push('/settings')}
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">설정</span>
          </SidebarMenuButton>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}

function SummaRiseDashboard({ className = "" }: DashboardProps) {
  const { toast } = useToast();
  const router = useRouter();
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

  const handleSubmitUrl = async () => {
    if (!isValidUrl || !urlInput.trim()) {
      toast({
        title: "잘못된 URL",
        description: "올바른 URL을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitUrlMutation.mutateAsync({
        url: urlInput.trim(),
        content_type: contentType || 'article'
      });
      
      setUrlInput('');
      toast({
        title: "요약 요청 완료",
        description: "콘텐츠 요약이 시작되었습니다.",
      });
    } catch (error) {
      toast({
        title: "요약 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleContentClick = (contentId: string) => {
    router.push(`/content/${contentId}`);
  };

  // Determine which data to display
  const isSearchMode = !!debouncedSearchQuery.trim();
  const displayData = isSearchMode ? searchData : contentData;
  const isLoading = isSearchMode ? isSearching : isLoadingContent;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          
          <div className="flex flex-1 items-center gap-2">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="콘텐츠 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 space-y-4 p-4 pt-6">
          {/* Hero Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Content Summarizer</h1>
            <p className="text-muted-foreground">
              YouTube 링크나 웹 아티클 URL을 입력하여 자동으로 요약을 생성하고 관리하세요
            </p>
          </div>

          {/* URL Input Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">새 콘텐츠 요약하기</h2>
            
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {contentType === 'youtube' ? (
                    <Youtube className="h-4 w-4 text-red-500" />
                  ) : contentType === 'article' ? (
                    <Link className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Link className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Input
                  placeholder="YouTube 링크 또는 웹 아티클 URL을 입력하세요..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={handleSubmitUrl}
                disabled={!isValidUrl || submitUrlMutation.isPending}
                className="px-6"
              >
                {submitUrlMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    처리중...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    요약하기
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Content Library Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                콘텐츠 라이브러리
                {displayData?.data && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {displayData.data.length} items
                  </span>
                )}
              </h2>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content Grid/List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-medium">콘텐츠를 불러오는 중...</h3>
                  <p className="text-muted-foreground">잠시만 기다려주세요</p>
                </div>
              </div>
            ) : contentError ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-3">
                  <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
                  <h3 className="text-lg font-medium text-destructive">콘텐츠를 불러올 수 없습니다</h3>
                  <p className="text-muted-foreground">네트워크 연결을 확인하고 다시 시도해주세요</p>
                </div>
              </div>
            ) : !displayData?.data || displayData.data.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-3">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-medium">
                    {isSearchMode ? '검색 결과가 없습니다' : '저장된 콘텐츠가 없습니다'}
                  </h3>
                  <p className="text-muted-foreground">
                    {isSearchMode 
                      ? '다른 검색어를 시도해보세요' 
                      : '첫 번째 링크를 추가해보세요'}
                  </p>
                </div>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                : "space-y-4"
              }>
                {displayData.data.map((item: ContentItem) => (
                  <Card 
                    key={item.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleContentClick(item.id)}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="aspect-video relative">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="object-cover w-full h-full rounded-t-lg"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {item.content_type === 'youtube' ? (
                                <Youtube className="h-4 w-4 text-red-500" />
                              ) : (
                                <Link className="h-4 w-4 text-blue-500" />
                              )}
                              <span>{item.channel_or_site}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                            {item.summary}
                          </p>
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              원본
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 flex gap-4">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-24 h-16 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {item.content_type === 'youtube' ? (
                              <Youtube className="h-4 w-4 text-red-500" />
                            ) : (
                              <Link className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="text-sm text-muted-foreground">{item.channel_or_site}</span>
                          </div>
                          <h3 className="font-semibold mb-1 line-clamp-1">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {item.summary}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              원본
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Dashboard() {
  return <SummaRiseDashboard />;
}