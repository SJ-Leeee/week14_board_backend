FROM node:20-alpine

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 의존성 파일 복사
COPY package.json pnpm-lock.yaml* ./

# 의존성 설치
RUN pnpm install --frozen-lockfile

# 소스 코드 복사
COPY . .

EXPOSE 5173

# Vite 개발 서버 실행 (--host로 외부 접근 허용)
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
