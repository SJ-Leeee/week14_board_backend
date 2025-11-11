# Fluent Bit 로컬 설정 가이드

이 가이드는 로컬 환경에서 Fluent Bit을 설치하고 실행하여 로그를 자체 로그 수신 서버(localhost:3001)로 전송하는 방법을 설명합니다.

## 📋 프로세스 흐름

```
백엔드 서버 (NestJS)
    ↓
Winston Logger
    ↓
logs/application.log + logs/error.log
    ↓
Fluent Bit (파일 모니터링)
    ↓
HTTP POST → localhost:3001/api/v1/logs/batch
```

## 🔧 Fluent Bit 설치 (macOS)

### Homebrew를 사용한 설치

```bash
# Fluent Bit 설치
brew install fluent-bit

# 설치 확인
fluent-bit --version
```

## ⚙️ 설정 파일 확인

프로젝트에 이미 다음 설정 파일들이 있습니다:

### `fluent-bit.conf`
- **INPUT**: `logs/application.log`, `logs/error.log` 모니터링
- **FILTER**: 서비스 이름 및 환경 태그 추가
- **OUTPUT**: `localhost:3001/api/v1/logs/batch`로 HTTP POST

### `parsers.conf`
- JSON 형식의 로그 파싱

## 🚀 실행 방법

### 1. 백엔드 서버 실행

먼저 백엔드 서버를 실행하여 로그 파일이 생성되도록 합니다:

```bash
cd /Users/iseungjun/Code/Submit/week14_board/week14_board_backend

# 개발 모드 실행
pnpm run start:dev
```

### 2. 로그 수신 서버 실행

로그를 받을 서버를 localhost:3001에서 실행합니다.
(이미 실행 중이라면 이 단계는 건너뛰세요)

### 3. Fluent Bit 실행

새 터미널 창을 열고 다음 명령어를 실행합니다:

```bash
cd /Users/iseungjun/Code/Submit/week14_board/week14_board_backend

# Fluent Bit 실행
fluent-bit -c fluent-bit.conf
```

### 실행 스크립트 사용 (선택사항)

편의를 위해 스크립트를 사용할 수 있습니다:

```bash
# 실행 권한 부여
chmod +x start-fluent-bit.sh

# Fluent Bit 실행
./start-fluent-bit.sh
```

## 📝 로그 형식

Fluent Bit이 로그 수신 서버로 전송하는 데이터 형식:

```json
[
  {
    "timestamp": "2025-10-30 16:50:00",
    "level": "info",
    "message": "📥 GET /api/posts",
    "context": "HTTP",
    "service": "week14_board_backend",
    "env": "local"
  },
  {
    "timestamp": "2025-10-30 16:50:01",
    "level": "error",
    "message": "Database connection failed",
    "context": "DatabaseService",
    "service": "week14_board_backend",
    "env": "local",
    "stack": "Error: Connection timeout..."
  }
]
```

## 🧪 테스트

### 1. 로그 생성 테스트

백엔드 API를 호출하여 로그를 생성합니다:

```bash
# 일반 로그 생성
curl http://localhost:3000/

# 여러 요청 생성
for i in {1..5}; do curl http://localhost:3000/; done
```

### 2. 로그 파일 확인

```bash
# 로그 파일 실시간 모니터링
tail -f logs/application.log

# 에러 로그 확인
tail -f logs/error.log
```

### 3. Fluent Bit 로그 확인

Fluent Bit 실행 터미널에서 다음과 같은 로그를 확인할 수 있습니다:

```
[2025/10/30 16:50:00] [ info] [input:tail:tail.0] inotify_fs_add(): inode=12345 watch_fd=1 name=logs/application.log
[2025/10/30 16:50:01] [ info] [output:http:http.0] localhost:3001, HTTP status=200
```

### 4. 로그 수신 서버 확인

로그 수신 서버(localhost:3001)에서 POST 요청이 수신되는지 확인합니다.

## 🔧 설정 커스터마이징

### Flush 간격 변경

더 자주 전송하려면 `fluent-bit.conf`의 `Flush` 값을 변경하세요:

```ini
[SERVICE]
    Flush        1    # 1초마다 전송 (기본값: 5초)
```

### 단일 로그 API 사용

배치 API 대신 단일 로그 API를 사용하려면:

```ini
[OUTPUT]
    Name              http
    Match             app.*
    Host              localhost
    Port              3001
    URI               /api/v1/logs    # batch → logs로 변경
    Format            json
```

### 특정 로그만 전송

에러 로그만 전송하려면:

```ini
[OUTPUT]
    Name              http
    Match             app.errors    # app.* → app.errors로 변경
    ...
```

## 🛠️ 트러블슈팅

### 1. Fluent Bit이 로그 파일을 찾지 못하는 경우

```bash
# 현재 디렉토리 확인
pwd
# 출력: /Users/iseungjun/Code/Submit/week14_board/week14_board_backend

# 로그 파일 존재 확인
ls -la logs/
```

**해결책**: Fluent Bit을 백엔드 프로젝트 루트 디렉토리에서 실행하세요.

### 2. 로그 수신 서버로 전송되지 않는 경우

```bash
# 로그 수신 서버 포트 확인
curl http://localhost:3001/api/v1/logs/batch

# Fluent Bit 로그 레벨을 debug로 변경
fluent-bit -c fluent-bit.conf -v
```

### 3. JSON 파싱 오류

Winston 로그가 JSON 형식이 아닌 경우 `parsers.conf` 수정이 필요할 수 있습니다.

```bash
# 로그 파일 형식 확인
head -n 5 logs/application.log
```

### 4. 권한 오류

```bash
# 로그 파일 권한 확인
ls -la logs/

# 권한 부여
chmod 644 logs/*.log
```

## 🔄 백그라운드 실행

Fluent Bit을 백그라운드에서 실행하려면:

```bash
# 백그라운드 실행
nohup fluent-bit -c fluent-bit.conf > fluent-bit.log 2>&1 &

# 프로세스 확인
ps aux | grep fluent-bit

# 중지
pkill fluent-bit
```

## 📊 모니터링

### Fluent Bit 상태 확인

```bash
# 실행 중인지 확인
ps aux | grep fluent-bit

# 로그 출력 확인
tail -f fluent-bit.log
```

### 로그 전송 통계

Fluent Bit 콘솔 출력에서 다음 정보를 확인할 수 있습니다:
- 읽은 로그 수
- 전송 성공/실패 횟수
- HTTP 응답 상태 코드

## 🎯 다음 단계

1. ✅ 백엔드 서버 실행 → 로그 파일 생성
2. ✅ Fluent Bit 실행 → 로그 파일 모니터링 시작
3. ✅ 로그 수신 서버에서 로그 수신 확인
4. 🔄 프로덕션 환경 설정 (필요시)

## 📚 참고 자료

- [Fluent Bit 공식 문서](https://docs.fluentbit.io/)
- [Fluent Bit HTTP Output](https://docs.fluentbit.io/manual/pipeline/outputs/http)
- [Fluent Bit Tail Input](https://docs.fluentbit.io/manual/pipeline/inputs/tail)
