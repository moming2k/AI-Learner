# AI 학습 위키

[English](README.md) | [繁體中文](README.zh-TW.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md)

사용자가 AI 생성 위키 페이지와 지능형 질문 답변을 통해 지식을 탐색할 수 있는 현대적이고 몰입감 있으며 고도로 상호작용적인 학습 플랫폼입니다.

## 기능

### 동적 위키 시스템
- 풍부한 서식을 갖춘 AI 생성 포괄적 위키 페이지
- 관련 개념을 탐색하기 위한 지능형 "관련 주제" 사이드바
- 스마트 링크 및 점진적 지식 구축
- 컨텍스트 인식 콘텐츠 생성

### AI 기반 상호작용
- 모든 페이지에서 자연어 질문 입력
- 현재 주제 및 학습 경로를 기반으로 한 컨텍스트 인식 답변
- 관련 질문에 대한 스마트 제안
- 중복을 방지하기 위한 기존 주제와 새 주제의 자동 감지

### 사용자 경험
- 학습 세션 및 맞춤 지식 베이스 저장
- 학습 경로 기록을 표시하는 탐색 경로 내비게이션
- 즐겨찾는 위키 페이지 북마크
- 생성된 모든 콘텐츠 검색
- 데스크톱 및 태블릿에 최적화된 반응형 디자인
- 우아한 그라데이션과 부드러운 전환이 있는 깔끔하고 미니멀한 디자인

### 지식 관리
- 지식 그래프를 구성하는 백그라운드 마인드맵 구조
- 지식 구조에 의해 안내되는 지능형 콘텐츠 생성
- 모든 페이지 및 세션에 대한 영구 SQLite 데이터베이스 저장소
- 다양한 학습 라이브러리를 구성하기 위한 다중 데이터베이스 지원
- 내보내기 가능한 위키 페이지

## 시작하기

### 전제 조건
- Node.js 18+ 설치됨
- [OpenAI Platform](https://platform.openai.com/api-keys)에서 받은 OpenAI API 키

### 설치

1. 저장소를 복제하고 종속성을 설치합니다:
```bash
npm install
```

2. OpenAI API를 구성합니다:
   - 샘플 환경 파일을 복사합니다:
```bash
cp .env.sample .env.local
```
   - `.env.local`을 편집하고 OpenAI API 키를 추가합니다:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```
   - 선택 사항: 모델을 사용자 정의합니다(기본값: gpt-5):
```env
OPENAI_MODEL=gpt-4o  # 옵션: gpt-5, gpt-4o, gpt-4o-mini, gpt-4-turbo-preview, gpt-3.5-turbo
```
   - 선택 사항: 다른 API 엔드포인트를 사용합니다(Azure OpenAI 또는 다른 공급자용):
```env
OPENAI_API_BASE_URL=https://api.openai.com/v1  # 기본 OpenAI 엔드포인트
```

3. 개발 서버를 실행합니다:
```bash
npm run dev
```

4. 브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다

## 사용 방법

1. **학습 시작**: 검색 상자에 주제를 입력하여 포괄적인 위키 페이지를 생성합니다
2. **질문하기**: 질문 입력을 사용하여 개념을 더 깊이 파고듭니다
3. **관련 주제 탐색**: 사이드바 또는 페이지 콘텐츠의 관련 주제를 클릭합니다
4. **페이지 북마크**: 나중에 빠르게 액세스하기 위해 중요한 페이지를 저장합니다
5. **진행 상황 추적**: 사이드바 탐색 경로에서 학습 경로를 확인합니다
6. **검색**: 검색 기능을 사용하여 이전에 생성된 콘텐츠를 찾습니다

## 기술 스택

- **프론트엔드**: Next.js 16, React 19, TypeScript
- **스타일링**: 커스텀 그라데이션 및 애니메이션이 있는 Tailwind CSS 4
- **아이콘**: Lucide React
- **Markdown**: 풍부한 콘텐츠 렌더링을 위한 React Markdown
- **AI**: OpenAI API(GPT-5, GPT-4o, GPT-4o-mini, GPT-3.5-turbo 지원)
- **스토리지**: better-sqlite3를 사용한 서버 측 SQLite 데이터베이스

## 아키텍처

### 컴포넌트
- `TopicSearch`: 초기 주제 입력 인터페이스
- `WikiPage`: markdown 렌더링이 있는 풍부한 위키 페이지 표시
- `QuestionInput`: 모든 페이지의 눈에 띄는 질문 입력
- `Sidebar`: 내비게이션, 북마크 및 학습 경로

### 핵심 시스템
- `lib/ai-service.ts`: AI 기반 위키 생성 및 질문 답변
- `lib/storage.ts`: 페이지, 세션, 북마크 및 마인드맵을 위한 스토리지 API 클라이언트 계층
- `lib/db.ts`: better-sqlite3를 사용한 SQLite 데이터베이스 계층
- `lib/types.ts`: TypeScript 타입 정의
- `app/api/generate/route.ts`: AI 콘텐츠 생성을 위한 API 엔드포인트
- `app/api/pages/route.ts`: 위키 페이지용 CRUD 엔드포인트
- `app/api/sessions/route.ts`: 학습 세션 관리
- `app/api/bookmarks/route.ts`: 북마크 관리
- `app/api/mindmap/route.ts`: 지식 그래프 관리

### 데이터 흐름
1. 사용자가 주제 또는 질문을 입력
2. API를 통해 SQLite 데이터베이스에 콘텐츠가 이미 있는지 확인
3. 없으면 AI API를 통해 새 콘텐츠 생성
4. 지식 그래프를 유지하기 위해 마인드맵 구조 업데이트
5. API를 통해 SQLite 데이터베이스에 저장하고 UI 업데이트
6. 내비게이션을 위해 학습 세션에서 추적

## 사용자 정의

### API 구성
`.env.local`을 편집하여 사용자 정의합니다:
- 모델 선택: `OPENAI_MODEL` (기본값: gpt-5)
  - 옵션: gpt-5, gpt-4o, gpt-4o-mini, gpt-4-turbo-preview, gpt-3.5-turbo
  - 참고: gpt-5는 OpenAI의 특별 액세스가 필요합니다
- API 엔드포인트: `OPENAI_API_BASE_URL` (Azure OpenAI 또는 다른 공급자용)

`app/api/generate/route.ts`를 편집하여 고급 설정을 구성합니다:
- Temperature(기본값: GPT-5가 아닌 모델의 경우 0.7)
- 최대 완료 토큰(기본값: 16000)
- 응답 형식(JSON 객체)
- 요청 시간 제한(기본값: 2분)

### 스타일링
- `app/globals.css`를 수정하여 전역 스타일 설정
- 컴포넌트의 Tailwind 클래스를 업데이트하여 시각적 변경
- 그라데이션은 파랑-인디고-보라 팔레트를 사용

### 콘텐츠 생성
`lib/ai-service.ts`의 프롬프트를 편집하여 사용자 정의합니다:
- 위키 페이지 구조 및 톤
- 관련 주제 제안
- 질문 답변 스타일

## 상세 기능

### 마인드맵 지식 구조
- 모든 주제를 구성하는 보이지 않는 그래프 구조
- 페이지 간의 부모-자식 관계
- 지식 계층의 깊이 추적
- 컨텍스트 기반 스마트 링크

### 학습 세션
- 첫 번째 주제에서 자동 세션 생성
- 탐색 경로 내비게이션(마지막 10페이지)
- 페이지 수 추적
- SQLite 데이터베이스의 세션 지속성
- 브라우저 재시작 및 페이지 새로 고침 후에도 유지

### 스마트 중복 제거
- 주제의 정확한 일치 감지
- 유사한 질문 감지
- 가능한 경우 기존 콘텐츠 재사용
- 제목 + 타임스탬프 기반의 일관된 페이지 ID

## 개발

```bash
# 개발 서버 실행
npm run dev

# 프로덕션용 빌드
npm run build

# 프로덕션 서버 시작
npm start

# 코드 린트
npm run lint
```

## 브라우저 지원

다음을 지원하는 최신 브라우저:
- ES6+ JavaScript 지원
- CSS Grid 및 Flexbox
- Fetch API
- 권장: 최신 Chrome, Firefox, Safari 또는 Edge

## 라이선스

MIT

## 기여

기여를 환영합니다! 언제든지 Pull Request를 제출해 주세요.
