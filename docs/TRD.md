# 기술 요구사항 명세서 (TRD): 콘텐츠 요약 및 라이브러리

## 시스템 개요 및 아키텍처 다이어그램

본 문서는 "콘텐츠 요약 및 라이브러리" 웹 애플리케이션의 기술적 요구사항을 정의합니다. 이 시스템은 사용자가 제공한 URL(YouTube 영상 또는 일반 웹페이지)의 콘텐츠를 추출하고, Gemini LLM을 통해 핵심 내용을 요약하여 개인 라이브러리에 저장 및 검색하는 기능을 제공하는 단일 사용자용 웹 앱입니다.

본 시스템은 최신 웹 기술 스택을 활용하여 빠른 성능, 높은 안정성, 그리고 향후 확장성을 염두에 두고 설계되었습니다.

```mermaid
graph TD
    subgraph "사용자 환경 (Browser)"
        A[사용자]
    end

    subgraph "Vercel Platform"
        B[Next.js 15 Frontend]
        C[Next.js API Route Handlers]
    end

    subgraph "Supabase Cloud"
        D[Supabase PostgreSQL DB]
        E[Storage]
        F[Auth]
        G[Summarization Worker<br>(Scheduled Edge Function)]
    end

    subgraph "외부 서비스 (External Services)"
        H[Google AI API<br>(Gemini 1.5 Pro)]
        I[OpenAI API<br>(GPT-4o Fallback)]
        J[YouTube Transcript API]
        K[HTML → Markdown 변환 서비스]
    end

    A -- URL 제출/검색 --> B
    B -- API 요청 --> C
    C -- 작업 등록/데이터 조회 --> D
    C -- 인증 확인 --> F
    G -- Job 큐 조회 (pending) --> D
    G -- 콘텐츠 추출 --> J & K
    G -- 요약 요청 --> H
    H -- 실패 시 --> I
    I -- 요약 결과 --> G
    G -- 요약 결과 저장 --> D
    G -- 이미지/파일 저장 --> E
```

-----

## 서비스별 요구사항

### 프론트엔드 (Next.js)

  - **프레임워크/라이브러리:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
  - **주요 기능:**
      - URL 입력을 위한 반응형 폼 제공.
      - 요약된 콘텐츠를 갤러리 및 리스트 형태로 조회.
      - 콘텐츠 상세 페이지에서 요약문, 원문 링크, 메타데이터 확인.
      - 재요약(Re-summarize) 기능 및 이전 버전과의 변경 사항을 비교하는 Diff 뷰 제공.
      - URL 제출 시, 즉각적인 UI 피드백을 위한 낙관적 UI(Optimistic UI) 적용.
      - 실시간 검색어 제안 기능이 포함된 검색 인터페이스.
  - **상태 관리:** React Server Components (RSC)를 우선적으로 활용하며, 클라이언트 측 상태는 `useState`, `useReducer` 등 React 기본 훅으로 관리.

### API/백엔드 (Route Handlers)

  - **런타임:** Vercel Edge Runtime (Next.js Route Handlers)
  - **인증:**
      - 단일 사용자를 가정하여, 환경 변수에 저장된 고정 Bearer 토큰 또는 API 키를 통해 API 접근 제어.
      - 향후 다중 사용자 확장을 위해 모든 데이터 모델에 `user_id` 필드를 포함하고, API 로직은 `user_id`를 기반으로 동작하도록 설계.
  - **주요 엔드포인트:** URL 제출, 요약 목록 조회, 상세 조회, 검색, 재요약 요청 API.

### 요약 워커 / 작업 큐 (Summarization Worker / Job Queue)

  - **구현:** Supabase Scheduled Edge Function을 사용하여 비동기 작업 처리.
  - **작동 방식:**
    1.  API는 URL 제출 요청을 받으면 `summaries` 테이블에 `status='pending'` 상태로 레코드를 즉시 생성하고 202 Accepted 응답을 반환.
    2.  스케줄된 워커(예: 1분 간격 실행)는 `pending` 상태의 작업을 조회하여 처리 시작.
    3.  작업 처리 시, `status`를 `'processing'`으로 변경.
    4.  URL 유형에 따라 YouTube Transcript API 또는 HTML-to-Markdown 서비스를 호출하여 원문 콘텐츠 추출.
    5.  추출된 콘텐츠를 Gemini 1.5 Pro API로 전송하여 요약.
    6.  LLM API 호출 실패 시, 정의된 재시도 로직(e.g., exponential backoff) 수행 후 OpenAI GPT-4o로 폴백(fallback).
    7.  성공 시, 요약 결과를 DB에 저장하고 `status`를 `'completed'`로 변경.
    8.  최종 실패 시, `status`를 `'failed'`로 변경하고 오류 로그를 기록.

### 데이터베이스 (Supabase PostgreSQL)

  - **데이터 모델:** 주요 테이블로 `summaries`, `summary_versions`, `tags` 등을 포함. (상세 내용은 ERD 참조)
  - **검색 성능:** 전문(Full-text) 검색 성능 확보를 위해 `pg_trgm` 확장을 활성화하고, 관련 컬럼에 GIN 인덱스 생성.
  - **백업 및 복구:** Supabase Cloud의 일일 자동 백업 기능 활용. Point-in-Time Recovery (PITR)를 통해 제로 데이터 손실(Zero Data Loss) 목표 달성.
  - **확장성:** 초기 트래픽(일 50건, 연 1.8만 건)을 무리 없이 처리할 수 있는 사양으로 시작하며, 필요시 스케일업 플랜을 적용.

### 외부 통합 (External Integrations)

  - **LLM APIs:** Google AI (Gemini), OpenAI API 키는 Supabase Vault 또는 Vercel 환경 변수를 통해 안전하게 관리.
  - **콘텐츠 추출:**
      - YouTube Transcript API: 자막이 있는 영상의 텍스트 스크립트 추출.
      - MarkItDown (가칭): 일반 웹페이지의 HTML을 의미 있는 마크다운으로 변환. ❗ 특정 사이트의 스크래핑 방지 정책에 대한 대응 전략 필요.
  - **API 관리:** 모든 외부 API 호출에 대해 합리적인 타임아웃(Timeout) 및 재시도(Retry) 로직을 구현.

-----

## 비기능적 요구사항

### 성능 및 확장성 목표

| 지표 (Metric) | 목표 (Target) | 측정 방법 (Measurement) |
| --- | --- | --- |
| P95 요약 소요 시간 (Time-to-Summary) | ≤ 30초 | 사용자가 URL을 제출한 시점부터 UI에 요약 완료가 표시될 때까지의 시간 |
| 검색 API 응답 시간 | ≤ 200ms | 5명의 동시 사용자가 쿼리하는 부하 테스트 환경에서 P99 응답 시간 측정 |
| 요약 성공률 | ≥ 95% | (성공적으로 요약된 작업 수 / 자막 또는 HTML 추출이 가능한 총 시도 수) \* 100 |
| 일일 처리량 | ≥ 50개 URL/일 | 초기 목표치이며, 아키텍처는 향후 10배 이상 증가에 대비해야 함 |

### 보안 및 규정 준수

  - **인증:** API 요청은 Bearer 토큰으로 보호.
  - **시크릿 관리:** API 키, DB 연결 문자열 등 모든 민감 정보는 Vercel 및 Supabase 환경 변수를 통해 관리하며, 코드에 하드코딩하지 않음.
  - **데이터 보호:** 현재 개인식별정보(PII)를 수집하지 않으나, 향후 사용자 정보 추가 시 암호화 등 관련 규정 준수.
  - **의존성 관리:** Dependabot 또는 Snyk을 CI 파이프라인에 통합하여 오픈소스 라이브러리의 보안 취약점 자동 스캔 및 알림.

### 가용성 및 내결함성

  - **서비스 가용성:** Vercel 및 Supabase의 SLA에 따라 목표 가동률 99.9% 이상.
  - **LLM 장애 극복:** 주력 LLM(Gemini) API의 응답 지연 또는 오류 발생 시, 예비 LLM(GPT-4o)으로 자동 전환하는 로직 구현.
  - **데이터베이스 복구:** 제로 데이터 손실을 목표로 Supabase의 일일 백업 및 PITR 정책을 활성화.

### 접근성 및 국제화

  - **웹 접근성:** 모든 UI 컴포넌트와 사용자 흐름은 **WCAG 2.2 Level AA** 표준을 준수. (키보드 탐색, 스크린 리더 호환성, 명암비 등)
  - **국제화 (i18n):** 초기 버전은 한국어(ko) 단일 언어로 제공. 단, UI 텍스트는 향후 다국어 지원이 용이하도록 메시지 번들(JSON 파일 등) 형태로 관리.

-----

## API 명세 (API Specifications)

  - **스타일:** RESTful API
  - **데이터 형식:** JSON

### `POST /api/summaries`

URL을 제출하여 요약 작업을 시작합니다.

```shell
curl -X POST 'https://<your-domain>/api/summaries' \
-H 'Authorization: Bearer <your-api-key>' \
-H 'Content-Type: application/json' \
-d '{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}'
```

  - **성공 응답 (202 Accepted):**

<!-- end list -->

```json
{
  "id": "cuid_12345",
  "status": "pending",
  "message": "Summary job accepted."
}
```

### `GET /api/search?q={query}`

키워드로 요약된 콘텐츠를 검색합니다.

```shell
curl -X GET 'https://<your-domain>/api/search?q=Next.js%2015' \
-H 'Authorization: Bearer <your-api-key>'
```

  - **성공 응답 (200 OK):**

<!-- end list -->

```json
{
  "data": [
    {
      "id": "cuid_67890",
      "title": "Next.js 15: Deep Dive",
      "summary_snippet": "Next.js 15 introduces React Compiler support, partial pre-rendering...",
      "original_url": "https://some-blog/nextjs-15",
      "created_at": "2025-07-17T10:00:00Z"
    }
  ],
  "count": 1
}
```

-----

## 데이터 모델 참조 (Data Model References)

상세한 데이터베이스 스키마와 관계는 별도의 ERD(Entity-Relationship Diagram) 문서에서 관리합니다.

  - **ERD 위치:** [dbdiagram.io/d/your\_project\_erd\_link](https://www.google.com/search?q=https://dbdiagram.io/d/your_project_erd_link) (Placeholder)
  - **주요 테이블:**
      - `summaries`: 요약의 핵심 정보를 저장 (id, user\_id, original\_url, title, summary, status, content\_type).
      - `summary_versions`: 재요약 시 이전 버전의 요약문을 저장하여 히스토리 관리.
      - `tags`: 요약 콘텐츠를 분류하기 위한 태그 정보.

-----

## 배포 및 CI/CD 파이프라인

  - **플랫폼:** Vercel (프론트엔드/API), Supabase (데이터베이스/백엔드 함수)
  - **파이프라인:**
    1.  개발자가 `feature` 브랜치에서 작업 후 `main` 브랜치로 Pull Request(PR) 생성.
    2.  PR 생성 시 Vercel이 자동으로 Preview 환경에 배포.
    3.  CI 파이프라인(GitHub Actions)에서 유닛/통합 테스트, Linter, 타입 체크 실행.
    4.  모든 체크 통과 및 코드 리뷰 승인 후 `main` 브랜치에 병합(merge).
    5.  `main` 브랜치 병합 시 Production 환경으로 자동 배포.
  - **롤백:** Vercel의 Immutable Deployments 기능을 통해 이전 배포 버전으로 5분 내 즉시 롤백 가능.

-----

## 모니터링 및 관측 가능성 (Monitoring & Observability)

  - **메트릭:**
      - **Vercel Analytics:** 웹 바이탈(LCP, FID, CLS), 페이지뷰, 방문자 수 등 프론트엔드 성능 지표 수집.
      - **Supabase Reports:** 데이터베이스 상태, API 호출 수, 쿼리 성능, 함수 실행 시간 등 백엔드 지표 모니터링.
  - **로깅:**
      - Vercel Functions 및 Supabase Edge Functions의 실시간 로그를 통해 오류 디버깅.
      - ❗ 클라이언트 측 에러 로깅을 위해 Sentry 또는 LogRocket과 같은 서드파티 서비스 도입 고려.
  - **알림 (Alerting):**
      - Supabase의 내장 기능을 사용하거나 외부 모니터링 툴(e.g., Better Uptime)과 연동하여 주요 지표에 대한 임계치 기반 알림 설정. (예: API 에러율 5% 초과, P95 요약 시간 30초 초과 시 Slack 알림)

-----

## 테스트 전략 (Testing Strategy)

  - **유닛 테스트 (Unit Tests):**
      - **도구:** Vitest, React Testing Library
      - **범위:** 개별 UI 컴포넌트, 유틸리티 함수, 핵심 비즈니스 로직.
  - **통합 테스트 (Integration Tests):**
      - **도구:** Vitest, Supertest
      - **범위:** API 라우트 핸들러와 Supabase 로컬 개발 환경 DB 간의 상호작용 테스트.
  - **엔드투엔드 테스트 (E2E Tests):**
      - **도구:** Playwright
      - **범위:** URL 제출 → 요약 확인 → 검색 등 핵심 사용자 시나리오 자동화 테스트.
  - **부하 테스트 (Load Tests):**
      - **도구:** k6, Locust
      - **범위:** ❗ 검색 API에 대해 동시 사용자 5명 조건에서 200ms 응답 시간 목표를 검증하기 위한 부하 테스트 필수.

-----

## 마이그레이션 및 롤백 절차

  - **데이터베이스 마이그레이션:**
      - Supabase CLI를 사용하여 마이그레이션 파일을 생성하고 버전 관리.
      - 모든 스키마 변경은 마이그레이션 스크립트를 통해 CI/CD 파이프라인에서 자동 적용.
  - **애플리케이션 롤백:**
      - **프론트엔드/API (Vercel):** Vercel 대시보드 또는 CLI를 통해 이전 배포 버전으로 즉시 롤백.
      - **데이터베이스 (Supabase):** DB 롤백은 파괴적인 작업이므로 신중해야 함. 문제가 발생한 마이그레이션을 되돌리는 새로운 마이그레이션 스크립트를 작성하여 적용하는 것을 원칙으로 함. 심각한 경우, 백업에서 복원.

-----

## 미해결 질문 및 리스크 (Open Questions & Risks)

  - ❗ **LLM 비용 관리:** Gemini 및 OpenAI API 사용량 급증에 따른 비용을 어떻게 효과적으로 모니터링하고 통제할 것인가? 예산 초과 방지를 위한 알림 및 사용량 제한(rate limiting) 정책 수립 필요.
  - ❗ **콘텐츠 추출 안정성:** 동적 컨텐츠, SPA(Single Page Application), 또는 스크래핑 방지 기술이 적용된 웹사이트에서 'MarkItDown' 서비스가 얼마나 안정적으로 본문을 추출할 수 있는가? 95% 요약 성공률 달성의 가장 큰 변수.
  - ❗ **작업 큐 확장성:** 현재의 Supabase Scheduled Function 기반 큐가 향후 트래픽 증가(예: 일 500개 이상) 시 병목 현상 없이 확장될 수 있는가? 필요시 RabbitMQ, SQS 등 전문 메시지 큐 서비스 도입 검토.
  - ❗ **Diff 뷰의 구체적인 요구사항:** '이전 버전과의 Diff' 기능이 단순 텍스트 비교인지, 아니면 문맥적/의미적 차이를 시각화하는 복잡한 기능인지 명확한 정의 필요.