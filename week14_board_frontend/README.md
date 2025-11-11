# 정글 게시판 프론트엔드

React + TypeScript + Vite로 구축된 게시판 애플리케이션 프론트엔드입니다.

## 🛠 기술 스택

- **React 19.2** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **React Router v6** - 라우팅
- **Tailwind CSS** - 스타일링
- **axios** - API 통신
- **Context API** - 전역 상태 관리

## 🎨 디자인

- **포인트 컬러**: #82b553 (크래프톤 정글 그린)
- **스타일**: 깔끔한 공지사항 게시판 스타일

## 📁 프로젝트 구조

```
src/
├── api/              # API 호출 함수
│   ├── axios.ts      # axios 인스턴스 + JWT 인터셉터
│   ├── auth.api.ts   # 인증 API
│   ├── posts.api.ts  # 게시글 API
│   └── comments.api.ts
├── components/       # 재사용 컴포넌트
│   ├── common/       # 공통 컴포넌트
│   ├── layout/       # 레이아웃 (Header, Layout)
│   └── posts/        # 게시글 관련 컴포넌트
├── pages/            # 페이지 컴포넌트
│   ├── Auth/         # 로그인/회원가입
│   ├── Posts/        # 게시글 목록/상세/작성/수정
│   └── NotFound.tsx
├── context/          # Context API
│   └── AuthContext.tsx  # 로그인 상태 관리
├── hooks/            # 커스텀 훅
├── types/            # TypeScript 타입 정의
├── utils/            # 유틸 함수
├── App.tsx           # 라우팅 설정
└── main.tsx          # 엔트리 포인트
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 개발 서버 실행

```bash
pnpm devπ
```

브라우저에서 http://localhost:5173 으로 접속

### 3. 빌드

```bash
pnpm build
```

## 📋 주요 기능

- [x] 회원가입 / 로그인
- [x] JWT 인증 (자동 토큰 관리)
- [ ] 게시글 목록 조회 (페이징)
- [ ] 게시글 상세 조회
- [ ] 게시글 작성/수정/삭제 (인증 필요)
- [ ] 댓글 작성/조회

## 🔌 백엔드 연동

백엔드 API 주소: `http://localhost:3000`

axios 인스턴스에서 자동으로 JWT 토큰을 헤더에 추가합니다.
로그인 시 토큰은 localStorage에 저장되며, 401 에러 시 자동으로 로그아웃 처리됩니다.

## 📝 초보자 가이드

### React 기본 개념

- **컴포넌트**: UI를 구성하는 독립적인 블록 (함수처럼 재사용 가능)
- **State**: 컴포넌트의 데이터 (변경되면 자동으로 화면 갱신)
- **Props**: 부모에서 자식으로 전달하는 데이터

### TypeScript를 사용하는 이유

- 타입 에러를 미리 발견 (런타임 에러 감소)
- 자동완성 지원으로 개발 속도 향상
- 코드 가독성과 유지보수성 향상

### 주요 파일 설명

- `App.tsx`: 라우팅 설정 (URL별로 어떤 페이지를 보여줄지 결정)
- `AuthContext.tsx`: 로그인 상태를 전역으로 관리 (어느 컴포넌트에서든 접근 가능)
- `api/axios.ts`: API 호출 공통 설정 (JWT 토큰 자동 추가)
- `types/`: 백엔드와 주고받는 데이터의 타입 정의

## 🎯 다음 단계

뼈대 구축이 완료되었습니다! 이제 각 페이지에 실제 기능을 구현하면 됩니다.

1. PostListPage: getPosts API 연동 + 페이징
2. PostDetailPage: getPost, getComments API 연동
3. PostFormPage: createPost, updatePost API 연동
4. 댓글 컴포넌트 구현

## 📚 참고 자료

- [React 공식 문서](https://react.dev)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs/)
- [React Router 문서](https://reactrouter.com)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
