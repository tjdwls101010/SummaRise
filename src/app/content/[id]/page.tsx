"use client";

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { DiffMatchPatch } from 'diff-match-patch';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import { useContentDetail, useResumarizeContent, useEditContent } from '@/hooks/useContentDetail';
import { 
  ArrowLeft, 
  Youtube, 
  FileText, 
  Calendar, 
  ExternalLink, 
  RefreshCw, 
  Edit3, 
  Save, 
  X,
  Loader2,
  Clock,
  Tag,
  Globe
} from 'lucide-react';

interface ContentDetailProps {
  className?: string;
}

function ContentDetailPage({ className = "" }: ContentDetailProps) {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showDiff, setShowDiff] = useState(false);

  // Fetch content detail
  const { data: content, isLoading, error } = useContentDetail(id);
  
  // Mutations
  const resumarizeMutation = useResumarizeContent();
  const editMutation = useEditContent();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEdit = () => {
    if (!content) return;
    setEditedContent(content.summary);
    setIsEditing(true);
    setShowDiff(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent('');
    setShowDiff(false);
  };

  const handleShowDiff = () => {
    if (!content || editedContent === content.summary) {
      toast({
        variant: "destructive",
        title: "변경사항 없음",
        description: "수정된 내용이 없습니다."
      });
      return;
    }
    setShowDiff(true);
  };

  const generateDiff = () => {
    if (!content) return null;
    
    const dmp = new DiffMatchPatch();
    const diffs = dmp.diff_main(content.summary, editedContent);
    dmp.diff_cleanupSemantic(diffs);
    
    return diffs.map((diff, index) => {
      const [operation, text] = diff;
      let className = '';
      let bgColor = '';
      
      if (operation === 1) { // Insert
        className = 'text-green-800 bg-green-100';
        bgColor = 'bg-green-50';
      } else if (operation === -1) { // Delete
        className = 'text-red-800 bg-red-100 line-through';
        bgColor = 'bg-red-50';
      } else { // Equal
        className = 'text-gray-800';
      }
      
      return (
        <span key={index} className={`${className} ${bgColor} px-1 rounded`}>
          {text}
        </span>
      );
    });
  };

  const handleSaveEdit = () => {
    if (!content) return;
    
    editMutation.mutate({
      id,
      newContent: editedContent
    }, {
      onSuccess: () => {
        setIsEditing(false);
        setEditedContent('');
        setShowDiff(false);
        toast({
          title: "수정 완료",
          description: "콘텐츠가 성공적으로 수정되었습니다."
        });
      }
    });
  };

  const handleResumarize = () => {
    if (!content) return;
    
    resumarizeMutation.mutate(id, {
      onSuccess: () => {
        toast({
          title: "재요약 완료",
          description: "콘텐츠가 성공적으로 재요약되었습니다."
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-background ${className}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold mb-2">콘텐츠를 불러오는 중...</h3>
              <p className="text-muted-foreground">잠시만 기다려주세요</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className={`min-h-screen bg-background ${className}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <FileText className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">콘텐츠를 찾을 수 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                요청하신 콘텐츠가 존재하지 않거나 오류가 발생했습니다.
              </p>
              <Button onClick={() => router.push('/')} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                홈으로 돌아가기
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${className}`}>
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로가기
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2">
              {content.content_type === 'youtube' ? (
                <Youtube className="w-5 h-5 text-red-600" />
              ) : (
                <FileText className="w-5 h-5 text-blue-600" />
              )}
              <span className="font-medium text-sm text-muted-foreground">
                {content.content_type === 'youtube' ? 'YouTube 영상' : '웹 아티클'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResumarize}
                  disabled={resumarizeMutation.isPending}
                  className="gap-2"
                >
                  {resumarizeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      재요약 중...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      재요약
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  수정하기
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-4">
                  {content.title}
                </h1>
              </div>

              {/* Content */}
              <Card className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">콘텐츠 수정</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShowDiff}
                          disabled={editedContent === content.summary}
                        >
                          차이점 보기
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4 mr-2" />
                          취소
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={editMutation.isPending || editedContent === content.summary}
                        >
                          {editMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              저장 중...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              저장
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="min-h-[400px] font-mono text-sm"
                      placeholder="콘텐츠를 수정하세요..."
                    />
                  </div>
                ) : showDiff ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">변경사항 미리보기</h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDiff(false)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          닫기
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={editMutation.isPending}
                        >
                          {editMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              저장 중...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              변경사항 저장
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm mb-2 text-muted-foreground">
                        <span className="inline-block w-4 h-4 bg-red-100 rounded mr-2"></span>
                        삭제된 텍스트
                        <span className="inline-block w-4 h-4 bg-green-100 rounded ml-4 mr-2"></span>
                        추가된 텍스트
                      </div>
                      <div className="prose prose-sm max-w-none leading-relaxed">
                        {generateDiff()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-gray max-w-none">
                    <ReactMarkdown>{content.summary}</ReactMarkdown>
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Metadata */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">정보</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">출처</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {content.channel_or_site}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">생성일</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(content.created_at)}
                      </p>
                    </div>
                  </div>

                  {content.updated_at && content.updated_at !== content.created_at && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">수정일</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(content.updated_at)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">원본 링크</p>
                      <a 
                        href={content.original_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        바로가기
                      </a>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold">태그</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContentDetailPageWrapper() {
  return <ContentDetailPage />;
}