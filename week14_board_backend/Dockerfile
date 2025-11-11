# Dockerfile
# 1단계: 빌드 스테이지
FROM node:18-alpine AS builder

# pnpm 설치
RUN npm install -g pnpm

WORKDIR /app

# 의존성 설치
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 소스 복사 & 빌드
COPY . .
RUN pnpm run build

# 2단계: 실행 스테이지 (훨씬 가벼움)
FROM node:18-alpine

RUN npm install -g pnpm

WORKDIR /app

# 빌드된 파일만 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 포트 노출
EXPOSE 3000

# 실행
CMD ["node", "dist/main"]