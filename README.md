# 정글 게시판 (Jungle Board)

풀스택 게시판 애플리케이션으로 NestJS와 React를 사용하여 구현했습니다.

## 프로젝트 구조

```
week14_board/
├── week14_board_backend/   # NestJS 백엔드
└── week14_board_frontend/  # React + Vite 프론트엔드
```

## 기술 스택

### Backend
- **Framework**: NestJS 10.x
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (Passport)
- **API Documentation**: Swagger
- **Validation**: class-validator, class-transformer
- **Password Hashing**: bcrypt
- **Testing**: Jest, Supertest

### Frontend
- **Framework**: React 19.x
- **Build Tool**: Vite 7.x
- **Routing**: React Router DOM 7.x
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Notifications**: react-hot-toast
- **Language**: TypeScript

### DevOps & CI/CD
- **CI**: GitHub Actions
- **Backend Deployment**: AWS EC2 + PM2
- **Frontend Deployment**: Vercel (예정)
- **Package Manager**: pnpm

## 주요 기능

- 사용자 인증 (회원가입, 로그인)
- JWT 기반 인증 시스템
- 게시글 CRUD (작성, 조회, 수정, 삭제)
- 댓글 기능
- 페이지네이션
- 반응형 UI

## 시작하기

### 사전 요구사항

- Node.js 18.x 이상
- pnpm
- MongoDB

### 설치 및 실행

#### 1. 백엔드 설정

```bash
cd week14_board_backend
pnpm install

# 개발 모드 실행
pnpm run start:dev

# 프로덕션 빌드
pnpm run build
pnpm run start:prod
```

백엔드는 기본적으로 `http://localhost:3000`에서 실행됩니다.

**환경 변수 설정** (`.env` 파일 생성)
```env
MONGODB_URI=mongodb://localhost:27017/jungle-board
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d
```

#### 2. 프론트엔드 설정

```bash
cd week14_board_frontend
pnpm install

# 개발 서버 실행
pnpm run dev

# 프로덕션 빌드
pnpm run build
pnpm run preview
```

프론트엔드는 기본적으로 `http://localhost:5173`에서 실행됩니다.

## API 문서

백엔드 서버 실행 후 Swagger 문서를 확인할 수 있습니다:
- `http://localhost:3000/api`

## 프로젝트 구조 상세

### Backend (`week14_board_backend/src`)
```
src/
├── auth/           # 인증 모듈 (회원가입, 로그인, JWT)
├── users/          # 사용자 모듈
├── posts/          # 게시글 모듈
├── comments/       # 댓글 모듈
└── main.ts         # 애플리케이션 엔트리 포인트
```

### Frontend (`week14_board_frontend/src`)
```
src/
├── api/            # API 호출 함수
├── components/     # 재사용 가능한 컴포넌트
├── context/        # React Context (인증 등)
├── pages/          # 페이지 컴포넌트
├── types/          # TypeScript 타입 정의
└── App.tsx         # 메인 앱 컴포넌트
```

## 테스트

### Backend
```bash
cd week14_board_backend

# 단위 테스트
pnpm run test

# E2E 테스트
pnpm run test:e2e

# 테스트 커버리지
pnpm run test:cov

# 모듈별 테스트
pnpm run test:auth      # 인증 모듈 테스트
pnpm run test:posts     # 게시글 모듈 테스트
pnpm run test:users     # 사용자 모듈 테스트
pnpm run test:comments  # 댓글 모듈 테스트
```

### Frontend
```bash
cd week14_board_frontend

# 린트 검사
pnpm run lint

# 타입 체크
pnpm run build  # TypeScript 타입 검사 포함
```

## GIT 커밋 컨벤션

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정 (코드와 관련 없음, 주석 포함)
- `style`: 공백, 세미콜론 등 스타일 수정
- `refactor`: 코드 리팩토링 (기능 변화 없음)
- `test`: 테스트 관련 수정
- `chore`: 빌드, 보조 도구 수정

## 라이센스

이 프로젝트는 학습 목적으로 만들어졌습니다.
