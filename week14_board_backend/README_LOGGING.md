# 로깅 시스템 전체 가이드

Winston → Fluent Bit → 로그 수신 서버 (localhost:3001)

## 🎯 빠른 시작

### 1단계: Fluent Bit 설치

```bash
brew install fluent-bit
```

### 2단계: 백엔드 서버 실행 (터미널 1)

```bash
cd /Users/iseungjun/Code/Submit/week14_board/week14_board_backend
pnpm run start:dev
```

### 3단계: 로그 수신 서버 실행 (터미널 2)

```bash
# 로그 수신 서버를 localhost:3001에서 실행
# (이미 실행 중이라면 건너뛰기)
```

### 4단계: Fluent Bit 실행 (터미널 3)

```bash
cd /Users/iseungjun/Code/Submit/week14_board/week14_board_backend
./start-fluent-bit.sh
```

### 5단계: 테스트

```bash
# 터미널 4에서 API 호출하여 로그 생성
curl http://localhost:3000/

# 여러 요청 생성
for i in {1..10}; do curl http://localhost:3000/; done
```

## 📁 파일 구조

```
week14_board_backend/
├── src/
│   └── common/
│       └── logger/
│           └── winston.config.ts      # Winston 로거 설정
├── logs/                               # 로그 파일 (자동 생성)
│   ├── application.log                # 전체 로그
│   └── error.log                      # 에러 로그
├── fluent-bit.conf                    # Fluent Bit 메인 설정
├── parsers.conf                       # JSON 파서 설정
├── start-fluent-bit.sh                # Fluent Bit 실행 스크립트
├── FLUENT_BIT_LOCAL_SETUP.md          # 상세 가이드
└── README_LOGGING.md                  # 이 파일
```

## 🔄 데이터 흐름

```
1. NestJS 애플리케이션
   ↓ (Winston Logger)

2. 로그 파일 생성
   - logs/application.log (전체 로그)
   - logs/error.log (에러 로그만)
   ↓ (Fluent Bit - tail input)

3. Fluent Bit 처리
   - JSON 파싱
   - 메타데이터 추가 (service, env)
   ↓ (HTTP POST)

4. 로그 수신 서버
   - http://localhost:3001/api/v1/logs/batch
   - 또는 http://localhost:3001/api/v1/logs
```

## 📊 로그 형식

### Winston이 생성하는 로그 (JSON)

```json
{
  "timestamp": "2025-10-30 16:50:00",
  "level": "info",
  "message": "GET /api/posts",
  "context": "HTTP"
}
```

### Fluent Bit이 전송하는 데이터

```json
[
  {
    "timestamp": "2025-10-30 16:50:00",
    "level": "info",
    "message": "GET /api/posts",
    "context": "HTTP",
    "service": "week14_board_backend",
    "env": "local"
  }
]
```

## 🛠️ 주요 명령어

### 로그 파일 확인

```bash
# 실시간 로그 모니터링
tail -f logs/application.log
tail -f logs/error.log

# 최근 20줄 확인
tail -n 20 logs/application.log
```

### Fluent Bit 제어

```bash
# 실행
./start-fluent-bit.sh

# 백그라운드 실행
nohup ./start-fluent-bit.sh > fluent-bit.log 2>&1 &

# 프로세스 확인
ps aux | grep fluent-bit

# 중지
pkill fluent-bit
```

### 로그 생성 테스트

```bash
# GET 요청
curl http://localhost:3000/

# POST 요청
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'

# 연속 요청
for i in {1..50}; do
  curl http://localhost:3000/
  sleep 0.5
done
```

## ⚙️ 설정 커스터마이징

### Fluent Bit 전송 간격 변경

`fluent-bit.conf` 파일의 `Flush` 값을 수정:

```ini
[SERVICE]
    Flush        1    # 1초마다 전송 (기본: 5초)
```

### 단일 로그 API 사용

배치가 아닌 단일 로그 API를 사용하려면:

```ini
[OUTPUT]
    URI               /api/v1/logs    # /api/v1/logs/batch → /api/v1/logs
```

### 에러 로그만 전송

`fluent-bit.conf`의 OUTPUT Match를 변경:

```ini
[OUTPUT]
    Match             app.errors    # app.* → app.errors
```

## 🐛 트러블슈팅

### 1. Fluent Bit이 시작되지 않음

```bash
# Fluent Bit 설치 확인
fluent-bit --version

# 설치되지 않았다면
brew install fluent-bit
```

### 2. 로그 파일을 찾지 못함

```bash
# 올바른 디렉토리에서 실행 확인
pwd
# 출력: /Users/iseungjun/Code/Submit/week14_board/week14_board_backend

# 로그 디렉토리 존재 확인
ls -la logs/
```

### 3. 로그 수신 서버로 전송되지 않음

```bash
# 로그 수신 서버 실행 확인
curl http://localhost:3001/api/v1/logs/batch

# Fluent Bit 디버그 모드
fluent-bit -c fluent-bit.conf -v
```

### 4. JSON 파싱 에러

```bash
# 로그 파일 형식 확인
head -n 5 logs/application.log

# JSON 형식이어야 함
# 올바른 예: {"timestamp":"2025-10-30 16:50:00","level":"info",...}
```

## 📈 성능 최적화

### 메모리 사용량 제한

`fluent-bit.conf`에서 설정:

```ini
[INPUT]
    Mem_Buf_Limit     5MB    # 기본값, 필요시 조정
```

### 로그 파일 로테이션

Winston이 자동으로 처리:

- 최대 파일 크기: 10MB
- 최대 파일 개수: 5개

## 🔒 보안 고려사항

1. **민감 정보 마스킹**: 로그에 비밀번호, 토큰 등이 포함되지 않도록 주의
2. **로그 파일 권한**: `chmod 644 logs/*.log`로 적절한 권한 설정
3. **로그 보관 정책**: 오래된 로그는 정기적으로 삭제

## 📚 추가 문서

- `FLUENT_BIT_LOCAL_SETUP.md` - Fluent Bit 상세 설정 가이드
- `LOGGING_SETUP.md` - Docker 환경 가이드 (Datadog)

## 🆘 도움말

### Fluent Bit 공식 문서

- [메인 문서](https://docs.fluentbit.io/)
- [HTTP Output](https://docs.fluentbit.io/manual/pipeline/outputs/http)
- [Tail Input](https://docs.fluentbit.io/manual/pipeline/inputs/tail)

### Winston 문서

- [Winston GitHub](https://github.com/winstonjs/winston)
- [nest-winston](https://github.com/gremo/nest-winston)
