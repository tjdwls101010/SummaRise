"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Settings, 
  Key, 
  MessageSquare, 
  Save, 
  RotateCcw,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react';

interface SettingsData {
  systemPrompt: string;
  geminiApiKey: string;
  openaiApiKey: string;
  defaultLlmProvider: 'gemini' | 'openai';
}

const DEFAULT_SYSTEM_PROMPT = `당신은 콘텐츠 요약 전문가입니다. 사용자가 제공하는 YouTube 비디오나 웹 아티클의 내용을 명확하고 구조화된 방식으로 요약해주세요.

요약 규칙:
1. 핵심 내용을 3-5개의 주요 포인트로 정리
2. 중요한 데이터나 수치가 있다면 포함
3. 실용적인 팁이나 조언이 있다면 별도로 언급
4. 한국어로 자연스럽게 작성
5. 간결하면서도 이해하기 쉽게 작성

형식:
## 주요 내용
- [핵심 포인트 1]
- [핵심 포인트 2]
- [핵심 포인트 3]

## 핵심 인사이트
[가장 중요한 통찰이나 결론]`;

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<SettingsData>({
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    geminiApiKey: '',
    openaiApiKey: '',
    defaultLlmProvider: 'gemini'
  });

  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  React.useEffect(() => {
    const savedSettings = localStorage.getItem('summarise-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const handleInputChange = (field: keyof SettingsData, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('summarise-settings', JSON.stringify(settings));
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHasChanges(false);
      toast({
        title: "설정 저장 완료",
        description: "모든 설정이 성공적으로 저장되었습니다.",
      });
    } catch (error) {
      toast({
        title: "설정 저장 실패",
        description: "설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      geminiApiKey: '',
      openaiApiKey: '',
      defaultLlmProvider: 'gemini'
    });
    setHasChanges(true);
    toast({
      title: "설정 초기화",
      description: "모든 설정이 기본값으로 초기화되었습니다.",
    });
  };

  const getApiKeyStatus = (apiKey: string) => {
    if (!apiKey) return 'none';
    if (apiKey.length < 20) return 'invalid';
    return 'valid';
  };

  const renderApiKeyStatus = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />설정됨</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />유효하지 않음</Badge>;
      default:
        return <Badge variant="secondary">미설정</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h1 className="text-xl font-semibold">설정</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600">
                저장되지 않은 변경사항
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              초기화
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <>저장 중...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  저장
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          {/* System Prompt Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <CardTitle>시스템 프롬프트</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                LLM이 콘텐츠를 요약할 때 사용할 기본 지침을 설정합니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="system-prompt">프롬프트 내용</Label>
                <Textarea
                  id="system-prompt"
                  placeholder="시스템 프롬프트를 입력하세요..."
                  value={settings.systemPrompt}
                  onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {settings.systemPrompt.length} 글자
                </p>
              </div>
            </CardContent>
          </Card>

          {/* API Key Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                <CardTitle>API 키 설정</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                외부 LLM 서비스 사용을 위한 API 키를 설정합니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Provider Selection */}
              <div className="space-y-3">
                <Label>기본 LLM 제공자</Label>
                <div className="flex gap-2">
                  <Button
                    variant={settings.defaultLlmProvider === 'gemini' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('defaultLlmProvider', 'gemini')}
                  >
                    Google Gemini
                  </Button>
                  <Button
                    variant={settings.defaultLlmProvider === 'openai' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('defaultLlmProvider', 'openai')}
                  >
                    OpenAI
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Gemini API Key */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gemini-api-key">Google Gemini API 키</Label>
                  {renderApiKeyStatus(getApiKeyStatus(settings.geminiApiKey))}
                </div>
                <div className="relative">
                  <Input
                    id="gemini-api-key"
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder="AIza..."
                    value={settings.geminiApiKey}
                    onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                  >
                    {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Google AI Studio에서 API 키를 발급받을 수 있습니다.
                </p>
              </div>

              <Separator />

              {/* OpenAI API Key */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="openai-api-key">OpenAI API 키</Label>
                  {renderApiKeyStatus(getApiKeyStatus(settings.openaiApiKey))}
                </div>
                <div className="relative">
                  <Input
                    id="openai-api-key"
                    type={showOpenaiKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    value={settings.openaiApiKey}
                    onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  >
                    {showOpenaiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  OpenAI 플랫폼에서 API 키를 발급받을 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>일반 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">언어 설정</p>
                  <p className="text-sm text-muted-foreground">인터페이스 언어</p>
                </div>
                <Badge variant="outline">한국어</Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">테마</p>
                  <p className="text-sm text-muted-foreground">화면 테마 설정</p>
                </div>
                <Badge variant="outline">시스템</Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">기본 보기 모드</p>
                  <p className="text-sm text-muted-foreground">콘텐츠 목록 표시 방식</p>
                </div>
                <Badge variant="outline">갤러리</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}