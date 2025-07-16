# **UI/UX 디자인 가이드**

이 문서는 제품의 브랜드 일관성, 사용성, 접근성 및 유지보수성을 보장하기 위한 포괄적인 디자인 가이드라인을 정의합니다. 모든 디자인 및 프론트엔드 개발은 본 가이드를 준수해야 합니다.

-----

## **디자인 시스템 개요**

본 디자인 시스템은 **'Modern', 'Minimal', 'Clean'** 키워드를 중심으로, **Notion과 유사한** 사용자 경험을 제공하는 것을 목표로 합니다. 복잡성을 최소화하고 사용자가 콘텐츠에 집중할 수 있는 직관적인 인터페이스를 지향합니다.

  - **핵심 원칙**
      - **일관성 (Consistency):** 전체 프로덕트에서 통일된 사용자 경험을 제공합니다.
      - **사용성 (Usability):** 사용자가 쉽고 효율적으로 목표를 달성할 수 있도록 설계합니다.
      - **접근성 (Accessibility):** 모든 사용자가 정보에 동등하게 접근할 수 있도록 WCAG 2.2 가이드라인을 준수합니다.
      - **유지보수성 (Maintainability):** 재사용 가능한 컴포넌트와 명확한 가이드를 통해 시스템을 쉽게 확장하고 유지보수할 수 있도록 합니다.
  - **참고 레퍼런스**
      - **Notion:** UI 구조 및 중립적인 색상 사용
      - **Supabase Dashboard:** 깔끔한 데이터 테이블 및 정보 구조
      - **shadcn/ui:** 컴포넌트 설계 패턴 및 인터랙션

-----

## **Tailwind CSS를 위한 색상 팔레트 🎨**

색상 시스템은 중립적인 라이트 모드를 기반으로 하며, 명확한 정보 전달을 위해 제한된 색상을 사용합니다. 모든 색상은 Tailwind CSS 변수로 사전 정의되어 있습니다.

### **색상 정의**

`shadcn/ui`의 관례를 따라 시맨틱(Semantic) 색상 변수를 정의합니다.

  - **Primary:** 브랜드의 핵심 색상으로, 주요 버튼 및 상호작용 요소에 사용됩니다.
  - **Neutral:** UI의 기본 텍스트, 배경, 보더 등 중립적인 요소에 사용됩니다.
  - **Destructive:** 삭제 등 파괴적인 액션에 사용됩니다.

<!-- end list -->

```javascript
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
			},
		},
	},
}
```

### **CSS 변수 및 HEX 코드**

프로젝트의 `globals.css` 파일에 아래 변수를 정의하여 사용합니다.

```css
/* styles/globals.css */
@layer base {
	:root {
		--background: 0 0% 100%; /* #FFFFFF */
		--foreground: 224 71.4% 4.1%; /* #09090B */

		--muted: 210 40% 96.1%; /* #F1F5F9 */
		--muted-foreground: 215 20.2% 65.1%; /* #A1A1AA */

		--primary: 221.2 83.2% 53.3%; /* #3B82F6 */
		--primary-foreground: 210 40% 98%; /* #F8FAFC */

		--secondary: 210 40% 96.1%; /* #F1F5F9 */
		--secondary-foreground: 222.2 47.4% 11.2%; /* #111827 */

		--destructive: 0 84.2% 60.2%; /* #EF4444 */
		--destructive-foreground: 210 40% 98%; /* #F8FAFC */

		--border: 214.3 31.8% 91.4%; /* #E2E8F0 */
		--input: 214.3 31.8% 91.4%; /* #E2E8F0 */
		--ring: 221.2 83.2% 53.3%; /* #3B82F6 */
	}
}
```

### **WCAG 2.2 명도 대비 체크리스트**

모든 텍스트는 최소 **AA 레벨(4.5:1)**, 큰 텍스트(18pt 또는 14pt bold 이상)는 **AA 레벨(3:1)** 이상을 만족해야 합니다.

| 배경 (Background)          | 텍스트 (Foreground)            | 명도 대비 비율  | WCAG 2.2 (Normal Text) | WCAG 2.2 (Large Text) |
| -------------------------- | ------------------------------ | --------------- | ---------------------- | --------------------- |
| `background` (`#FFFFFF`)   | `foreground` (`#09090B`)       | **20.21 : 1** | ✅ AAA                  | ✅ AAA                 |
| `background` (`#FFFFFF`)   | `muted-foreground` (`#A1A1AA`) | **2.53 : 1** | ❌ Fail                 | ✅ AA                  |
| `primary` (`#3B82F6`)      | `primary-foreground` (`#F8FAFC`) | **3.26 : 1** | ❌ Fail                 | ✅ AA                  |
| `destructive` (`#EF4444`)  | `destructive-foreground` (`#F8FAFC`) | **4.08 : 1** | ❌ Fail                 | ✅ AA                  |

**⚠️ 주의:**

  - `muted-foreground` 색상은 본문 텍스트로 사용하는 것을 지양하고, 플레이스홀더나 보조 정보에 제한적으로 사용합니다.
  - `primary` 및 `destructive` 버튼의 텍스트는 가독성을 위해 **Bold** 처리하거나 폰트 크기를 키우는 것을 권장합니다.

-----

## **페이지 구현**

각 페이지는 명확한 목적을 가지며, 일관된 레이아웃 구조와 컴포넌트를 사용합니다.

### **1. 데이터 테이블 페이지 (Data Table Page)**

  - **페이지의 핵심 목적**
      - Supabase 대시보드와 같이 정제된 데이터를 테이블 형태로 사용자에게 제공합니다. 사용자는 데이터를 쉽게 검색, 필터링, 정렬할 수 있습니다.
  - **주요 컴포넌트**
      - `Header`: 페이지 제목과 핵심 액션 버튼 (e.g., "새 항목 추가") 포함
      - `Input (Search)`: 데이터 검색 필드
      - `DataTable`: 데이터 표시 그리드
      - `Pagination`: 페이지네이션 컨트롤
  - **레이아웃 구조**
      - 상단에 `Header`와 검색/필터 영역을 배치하고, 하단에 `DataTable`과 `Pagination`을 배치합니다. 콘텐츠 영역은 좌우 패딩을 가집니다.

```jsx
// src/pages/users.jsx
import { Header } from "@/components/Header";
import { DataTable } from "@/components/DataTable";
import { Input } from "@/components/ui/input";

export default function UsersPage() {
	return (
		<div className="p-4 md:p-8">
			<Header
				title="사용자 목록"
				description="모든 사용자의 목록을 확인하고 관리합니다."
				action={<Button>새 사용자 추가</Button>}
			/>
			<div className="mt-4">
				<Input placeholder="사용자 검색..." className="max-w-sm" />
			</div>
			<div className="mt-4">
				{/* DataTable 컴포넌트는 데이터와 컬럼 정의를 props로 받습니다. */}
				<DataTable data={users} columns={columns} />
			</div>
		</div>
	);
}
```

### **2. 설정 페이지 (Settings Page)**

  - **페이지의 핵심 목적**
      - 사용자가 자신의 프로필, 알림, 계정 정보 등 다양한 설정을 변경할 수 있도록 합니다.
  - **주요 컴포넌트**
      - `Tabs`: 프로필, 계정, 알림 등 설정 카테고리 전환
      - `Card`: 각 설정 섹션을 그룹화하는 컨테이너
      - `Input`, `Label`: 텍스트 기반 입력 필드
      - `Switch`: On/Off 토글 설정
      - `Button`: 변경 사항 저장
  - **레이아웃 구조**
      - 좌측에 `Tabs` 또는 수직 네비게이션을 배치하고, 우측에 선택된 탭의 콘텐츠를 `Card` 내부에 표시합니다.

```jsx
// src/pages/settings.jsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
	return (
		<div className="p-4 md:p-8">
			<h2 className="text-2xl font-bold tracking-tight">설정</h2>
			<p className="text-muted-foreground">계정 설정을 관리하세요.</p>
			<Tabs defaultValue="profile" className="mt-6">
				<TabsList>
					<TabsTrigger value="profile">프로필</TabsTrigger>
					<TabsTrigger value="account">계정</TabsTrigger>
				</TabsList>
				<TabsContent value="profile">
					<Card>
						<CardHeader>
							<CardTitle>프로필</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-1">
								<Label htmlFor="name">이름</Label>
								<Input id="name" defaultValue="홍길동" />
							</div>
							<Button>저장</Button>
						</CardContent>
					</Card>
				</TabsContent>
				{/* ... 다른 탭 콘텐츠 ... */}
			</Tabs>
		</div>
	);
}
```

-----

## **레이아웃 컴포넌트**

레이아웃은 페이지 콘텐츠를 감싸는 구조적 셸(Shell)입니다.

### **1. 메인 레이아웃 (Main Layout)**

  - **적용 경로**
      - 로그인 후 접근하는 모든 페이지 (e.g., `/dashboard`, `/users`, `/settings`)
  - **핵심 컴포넌트**
      - `Sidebar`: 수직 네비게이션 메뉴. 데스크탑에서는 항상 표시, 모바일에서는 햄버거 메뉴로 토글됩니다.
      - `Header`: 페이지 상단 바. 모바일에서는 햄버거 메뉴 아이콘, 데스크탑에서는 사용자 프로필 등을 포함할 수 있습니다.
      - `Main`: 실제 페이지 콘텐츠가 렌더링되는 영역.
  - **반응형 동작**
      - **Mobile (`<768px`):** `Sidebar`는 숨겨지고, `Header`의 햄버거 버튼으로 열고 닫을 수 있습니다.
      - **Tablet/Desktop (`>=768px`):** `Sidebar`가 좌측에 고정되고, `Main` 영역이 우측 공간을 모두 차지합니다.

<!-- end list -->

```jsx
// src/components/layout/MainLayout.jsx
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function MainLayout({ children }) {
	return (
		<div className="min-h-screen w-full flex">
			{/* Sidebar는 반응형으로 처리됩니다. */}
			<Sidebar />
			<div className="flex flex-col flex-1">
				<Header />
				<main className="flex-1 p-4 bg-muted/40">{children}</main>
			</div>
		</div>
	);
}
```

### **2. 중앙 정렬 레이아웃 (Centered Layout)**

  - **적용 경로**
      - 로그인, 회원가입, 비밀번호 찾기 등 인증 관련 페이지 (`/login`, `/signup`)
  - **핵심 컴포넌트**
      - `Card`: 폼 요소를 감싸는 컨테이너.
  - **반응형 동작**
      - 모든 화면 크기에서 콘텐츠가 수직/수평 중앙에 위치합니다.

<!-- end list -->

```jsx
// src/components/layout/CenteredLayout.jsx
export function CenteredLayout({ children }) {
	return (
		<div className="min-h-screen w-full flex items-center justify-center bg-muted/40">
			{/* Card 컴포넌트나 div로 콘텐츠를 감쌀 수 있습니다. */}
			<div className="w-full max-w-sm">{children}</div>
		</div>
	);
}
```

-----

## **인터랙션 패턴**

"Human Smelling Design" 원칙에 따라, 모든 인터랙션은 즉각적이고 명확해야 합니다. **불필요한 전환(transition) 효과나 애니메이션은 제거**하여 사용자가 인터페이스의 반응성을 직관적으로 느낄 수 있도록 합니다.

  - **아이콘:** 기능적 아이콘(화살표, 쉐브론 등)만 제한적으로 사용합니다.
  - **색상:** `primary`, `foreground`, `muted-foreground` 색상 중심으로 상태 변화를 표현합니다.
  - **애니메이션:** `hover`, `reveal` 등 시각적 피드백 외 애니메이션은 사용하지 않습니다.

### **컴포넌트 상태: Button**

| 상태 (State)  | 배경 (Background) | 텍스트 (Text)          | 테두리 (Border) | 비고                                  |
| ------------- | ----------------- | ---------------------- | --------------- | ------------------------------------- |
| **Default** | `primary`         | `primary-foreground`   | `none`          | 기본 버튼                              |
| **Hover** | `primary/90`      | `primary-foreground`   | `none`          | `opacity: 0.9` 또는 약간 어두운 색상  |
| **Focus** | `primary`         | `primary-foreground`   | `2px solid ring`| `ring` 색상으로 포커스 링 표시         |
| **Active** | `primary/80`      | `primary-foreground`   | `none`          | 클릭 시                               |
| **Disabled** | `muted`           | `muted-foreground`     | `none`          | `pointer-events: none`, `opacity: 0.5` |

```jsx
// src/components/ui/button.jsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

// CVA를 사용하여 버튼 스타일 변형을 관리
const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90",
				outline:
					"border border-input bg-background hover:bg-accent hover:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
			},
			// ... size variants
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);

const Button = React.forwardRef(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={buttonVariants({ variant, size, className })}
				ref={ref}
				{...props}
			/>
		);
	}
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

-----

## **Breakpoints (중단점)**

반응형 디자인을 위해 4개의 주요 중단점을 정의합니다.

| 이름 (Name) | 최소 너비 (Min-width) | 대상 디바이스             |
| ----------- | --------------------- | ------------------------- |
| `mobile`    | `320px`               | 소형 모바일 기기          |
| `tablet`    | `768px`               | 태블릿 및 대형 모바일 기기 |
| `desktop`   | `1024px`              | 일반적인 데스크탑 모니터  |
| `wide`      | `1440px`              | 와이드 데스크탑 모니터    |

### **Tailwind CSS 설정**

```javascript
// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
	theme: {
		screens: {
			mobile: "320px",
			tablet: "768px",
			desktop: "1024px",
			wide: "1440px",
		},
		// ... 나머지 설정
	},
};
```

### **사용 예시**

```html
<div class="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
  <div>항목 1</div>
  <div>항목 2</div>
  <div>항목 3</div>
</div>
```