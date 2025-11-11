# Winston + Fluent Bit + Datadog 로깅 설정 가이드

이 가이드는 백엔드 서버의 로그를 Winston으로 수집하고, Fluent Bit을 통해 Datadog으로 전송하는 방법을 설명합니다.

## 📋 구성 요소

1. **Winston**: NestJS 애플리케이션의 로거
   - 전체 로그: `logs/application.log`
   - 에러 로그: `logs/error.log`

2. **Fluent Bit**: 로그 수집 및 전송 에이전트
   - 로그 파일을 모니터링하고 Datadog으로 전송

3. **Datadog**: 로그 관리 및 모니터링 플랫폼

## 🚀 빠른 시작

### 1. 환경 변수 설정

`.env.example`을 복사하여 `.env.prod` 파일을 생성하고 값을 입력하세요:

```bash
cp .env.example .env.prod
```

필요한 환경 변수:
- `MONGODB_URI`: MongoDB 연결 URI
- `JWT_SECRET`: JWT 시크릿 키
- `DD_API_KEY`: Datadog API 키 (https://app.datadoghq.com/organization-settings/api-keys)
- `ENV`: 환경 이름 (예: production, staging)

### 2. Docker Compose로 실행

```bash
# 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# 중지
docker-compose down
```

### 3. 로컬 개발 환경에서 실행

로컬에서 개발할 때는 Winston만 사용하여 로그를 파일에 저장합니다:

```bash
# 개발 모드 실행
pnpm run start:dev

# 로그 파일 확인
tail -f logs/application.log
tail -f logs/error.log
```

## 📁 프로젝트 구조

```
week14_board_backend/
├── src/
│   └── common/
│       └── logger/
│           └── winston.config.ts       # Winston 설정
├── logs/                                # 로그 파일 디렉토리 (자동 생성)
│   ├── application.log                 # 전체 로그
│   └── error.log                       # 에러 로그
├── fluent-bit.conf                     # Fluent Bit 설정
├── parsers.conf                        # Fluent Bit 파서 설정
├── docker-compose.yml                  # Docker Compose 설정
└── Dockerfile                          # Docker 이미지 빌드 설정
```

## 🔧 설정 파일 설명

### Winston 설정 (`src/common/logger/winston.config.ts`)

```typescript
- 콘솔 출력: 컬러풀한 로그 (개발 환경)
- 파일 출력:
  - application.log: 모든 레벨의 로그
  - error.log: error 레벨만
- 로그 로테이션: 최대 10MB, 최대 5개 파일
```

### Fluent Bit 설정 (`fluent-bit.conf`)

```ini
[INPUT]
  - application.log 파일 모니터링
  - error.log 파일 모니터링
  - JSON 형식 파싱

[FILTER]
  - 서비스 이름 추가
  - 환경 태그 추가

[OUTPUT]
  - Datadog으로 전송
  - HTTPS + GZIP 압축
```

## 📊 Datadog에서 로그 확인

1. [Datadog 로그](https://app.datadoghq.com/logs) 페이지 접속
2. 검색 필터 사용:
   - `service:week14_board_backend` - 서비스별 필터링
   - `env:production` - 환경별 필터링
   - `level:error` - 에러 로그만 보기

## 🧪 테스트

### 로그 생성 테스트

백엔드 API를 호출하면 자동으로 로그가 생성됩니다:

```bash
# HTTP 요청 로그
curl http://localhost:3000/

# 에러 로그 생성 (존재하지 않는 엔드포인트)
curl http://localhost:3000/nonexistent
```

### 로그 파일 확인

```bash
# 로그 파일 확인
cat logs/application.log
cat logs/error.log

# 실시간 로그 모니터링
tail -f logs/application.log
```

### Fluent Bit 상태 확인

```bash
# Fluent Bit 컨테이너 로그 확인
docker logs fluent-bit

# Fluent Bit 컨테이너 상태 확인
docker ps | grep fluent-bit
```

## 🔍 트러블슈팅

### 로그 파일이 생성되지 않는 경우

1. `logs` 디렉토리 권한 확인:
```bash
mkdir -p logs
chmod 755 logs
```

2. Winston 설정이 올바르게 적용되었는지 확인:
```bash
# 서버 재시작
pnpm run start:dev
```

### Fluent Bit이 로그를 전송하지 않는 경우

1. Datadog API 키 확인:
```bash
echo $DD_API_KEY
```

2. Fluent Bit 로그 확인:
```bash
docker logs fluent-bit
```

3. 네트워크 연결 확인:
```bash
curl -I https://http-intake.logs.datadoghq.com
```

### Docker 볼륨 권한 문제

```bash
# 로그 디렉토리에 쓰기 권한 부여
chmod -R 777 logs
```

## 📝 로그 레벨

Winston은 다음 로그 레벨을 지원합니다:

- `error`: 에러 메시지 (error.log + application.log)
- `warn`: 경고 메시지 (application.log)
- `info`: 정보 메시지 (application.log)
- `debug`: 디버그 메시지 (application.log)

## 🔐 보안 고려사항

1. `.env` 파일을 `.gitignore`에 추가하여 API 키가 노출되지 않도록 하세요
2. Datadog API 키는 읽기 전용 키를 사용하는 것을 권장합니다
3. 로그에 민감한 정보(비밀번호, 토큰 등)가 포함되지 않도록 주의하세요

## 📚 참고 자료

- [Winston 공식 문서](https://github.com/winstonjs/winston)
- [Fluent Bit 공식 문서](https://docs.fluentbit.io/)
- [Datadog 로그 수집 가이드](https://docs.datadoghq.com/logs/)
