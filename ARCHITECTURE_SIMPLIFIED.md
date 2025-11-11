# 로그 수집 아키텍처 (최종 버전)

## 🎯 핵심 원칙: **stdout + Tail 방식**

모든 언어/프레임워크 지원을 위해 **가장 범용적인 방식**을 선택했습니다.

---

## 📊 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│              애플리케이션 (모든 언어 지원)                     │
│                                                               │
│  NestJS / Express / Python / Java / Go / 등등                │
│  console.log() / logger.info() / print()                    │
│         ↓                                                     │
│      stdout                                                   │
└──────────┬────────────────────────────────────────────────────┘
           │
           ↓ Docker가 파일로 저장
/var/lib/docker/containers/<id>/<id>-json.log
           │
           ↓ Fluent-bit이 파일 읽기 (Tail INPUT)
   ┌───────────────┐
   │  Fluent-bit   │
   │  - Tail INPUT │
   │  - JSON 파싱  │
   └───────┬───────┘
           │ HTTP POST
           ↓
    [외부 Producer 서버]
           │
           ↓
        [Kafka]
```

---

## 1️⃣ 로그 수집: stdout → Docker logs → Fluent-bit

### Docker가 하는 일

Docker는 **모든 컨테이너의 stdout/stderr을 자동으로 파일에 저장**합니다:

```bash
# 컨테이너 로그 위치
/var/lib/docker/containers/<container-id>/<container-id>-json.log
```

**예시 파일 내용:**
```json
{"log":"2025-11-11 21:30:45 [PostsService] INFO: 게시글 조회\n","stream":"stdout","time":"2025-11-11T21:30:45.123456789Z"}
{"log":"{\"timestamp\":\"2025-11-11 21:30:45\",\"level\":\"INFO\",\"message\":\"게시글 조회\"}\n","stream":"stdout","time":"2025-11-11T21:30:45.123456789Z"}
```

### Fluent-bit Tail INPUT

```conf
[INPUT]
    Name                tail
    Path                /var/lib/docker/containers/*/*.log
    Parser              docker     # Docker JSON 파싱
    Tag                 docker.*
    Refresh_Interval    5          # 5초마다 체크
```

**동작 방식:**
1. Fluent-bit이 5초마다 로그 파일 확인
2. 새로운 줄이 있으면 읽기
3. `docker` Parser로 JSON 파싱
4. `log` 필드 추출

### 파싱 결과

```json
// Winston에서 출력한 JSON (Backend)
{
  "timestamp": "2025-11-11 21:30:45",
  "level": "INFO",
  "message": "게시글 조회",
  "context": "PostsService"
}

// Fluent-bit이 정제한 후
{
  "type": "log",
  "timestamp": "2025-11-11 21:30:45",
  "level": "INFO",
  "message": "게시글 조회",
  "service_name": "week14-backend",
  "environment": "dev",
  "context": "PostsService"
}
```

---

## 2️⃣ 트레이스 수집: OpenTelemetry (변경 없음)

트레이스는 이미 최적화되어 있습니다 (자동 수집):

```
Backend (NestJS)
  ↓ 자동 계측 (코드 수정 없음)
OpenTelemetry SDK
  ↓ OTLP HTTP
OpenTelemetry Collector
  ↓ Batch (10초 또는 1024개)
  ↓ gzip 압축
Producer 서버
```

---

## 3️⃣ 왜 stdout + Tail 방식인가?

### ✅ 장점

1. **모든 언어/프레임워크 지원**
   - Node.js (NestJS, Express, Fastify)
   - Python (Django, Flask, FastAPI)
   - Java (Spring Boot)
   - Go (Gin, Echo)
   - Ruby, .NET, PHP, 등등

2. **애플리케이션과 완전히 분리**
   - Fluent-bit 다운 → 앱 영향 없음
   - 로그는 Docker가 저장 (손실 없음)
   - 설정 변경 시 앱 재시작 불필요

3. **컨테이너 표준**
   - Docker 기본 기능 사용
   - k8s에서도 동일한 방식
   - 12-Factor App 원칙 준수

4. **간단한 코드**
   ```typescript
   // 사용자 코드
   console.log(JSON.stringify({
     level: 'INFO',
     message: '게시글 조회'
   }));
   // 끝!
   ```

### ❌ 이전 방식 (Winston Forward)의 문제점

1. ❌ **Node.js만 지원** (Python, Java 등 불가)
2. ❌ **Winston 의존성** (다른 로거 사용 불가)
3. ❌ **복잡한 설정** (fluent-logger 패키지, Transport 구현)
4. ❌ **Fluent-bit 다운 시 로그 전송 실패**

---

## 4️⃣ 사용자는 무엇을 해야 하나?

### NestJS (현재 프로젝트)

```typescript
// 이미 설정됨! 아무것도 안 해도 됨
logger.log('게시글 조회');
logger.error('에러 발생', error);
```

Winston이 자동으로 JSON 형식으로 stdout 출력 → Fluent-bit이 수집

### 다른 프레임워크

#### Python (FastAPI)

```python
import json
import logging

logging.basicConfig()
logger = logging.getLogger(__name__)

# JSON 포맷으로 출력
print(json.dumps({
    'level': 'INFO',
    'message': '사용자 로그인',
    'userId': 123
}))
```

#### Go

```go
import (
    "encoding/json"
    "log"
)

logEntry := map[string]interface{}{
    "level": "INFO",
    "message": "사용자 로그인",
    "userId": 123,
}
jsonLog, _ := json.Marshal(logEntry)
log.Println(string(jsonLog))
```

#### Java (Spring Boot)

```java
// application.yml에 JSON 로깅 설정
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

Logger logger = LoggerFactory.getLogger(MyClass.class);
logger.info("사용자 로그인");
// Logback JSON encoder가 자동으로 JSON 변환
```

---

## 5️⃣ k8s 환경에서도 동일!

### k8s에서 로그 저장 위치

```bash
# k8s는 다른 경로에 저장
/var/log/pods/<namespace>_<pod>_<uid>/<container>/*.log
```

### Fluent-bit DaemonSet 설정

```yaml
[INPUT]
    Name              tail
    Path              /var/log/containers/*.log
    Parser            cri         # k8s CRI 로그 포맷
    Tag               kube.*

[FILTER]
    Name              kubernetes   # k8s 메타데이터 추가
    Match             kube.*
    Merge_Log         On
```

**차이점:**
- Docker: `/var/lib/docker/containers/*/*.log`
- k8s: `/var/log/containers/*.log`
- Parser: `docker` → `cri`
- Filter: `kubernetes` 필터 추가 (Pod 이름, 네임스페이스 등)

**나머지는 동일!**

---

## 6️⃣ 비교표

| 항목 | Winston Forward (이전) | stdout + Tail (현재) |
|------|----------------------|---------------------|
| **지원 언어** | Node.js만 | 모든 언어 ⭐ |
| **의존성** | fluent-logger 필요 | 불필요 ⭐ |
| **설정 복잡도** | 높음 (Transport 구현) | 낮음 (console.log) ⭐ |
| **안정성** | Fluent-bit 다운 시 영향 | 영향 없음 ⭐ |
| **실시간성** | 즉시 | 5초 간격 |
| **k8s 이관** | 변경 필요 | 동일 방식 ⭐ |
| **표준 준수** | 특화 방식 | 컨테이너 표준 ⭐ |

---

## 7️⃣ 설정 파일 요약

### winston.config.ts (간소화됨)

```typescript
// stdout으로 JSON 로그 출력만!
new winston.transports.Console({
  format: winston.format.json()  // JSON 형식
})
```

### fluent-bit.conf (Tail 방식)

```conf
[INPUT]
    Name    tail
    Path    /var/lib/docker/containers/*/*.log
    Parser  docker

[FILTER]
    Name     modify
    Match    *
    Add      type log
    Add      service_name week14-backend

[OUTPUT]
    Name    http
    Match   *
    Host    ${PRODUCER_HOST}
    Port    ${PRODUCER_PORT}
    URI     /ingest/logs
```

### docker-compose.yml

```yaml
fluent-bit:
  volumes:
    # Docker 로그 읽기
    - /var/lib/docker/containers:/var/lib/docker/containers:ro
```

---

## 8️⃣ 테스트 방법

### 1. 로그 파일 확인

```bash
# Docker 로그 파일 직접 확인
sudo tail -f /var/lib/docker/containers/$(docker ps -qf "name=backend")*/*.log
```

### 2. Fluent-bit 수집 확인

```bash
# Fluent-bit 로그 확인
docker-compose logs -f fluent-bit

# 다음과 같은 로그가 보여야 함:
# [input:tail:tail.0] inode=12345 /var/lib/docker/containers/.../xxx.log
```

### 3. Producer 전송 확인

```bash
# Fluent-bit → Producer 전송 성공
docker-compose logs fluent-bit | grep "http.0"
# [output:http:http.0] producer:8080, HTTP status=200
```

---

## 🎉 결론

### 이전: Winston Forward
- 복잡하고 Node.js만 지원
- 불필요한 의존성과 커스텀 Transport
- k8s 이관 시 변경 필요

### 현재: stdout + Tail
- ✅ **간단하고 모든 언어 지원**
- ✅ **표준 방식 (컨테이너 로깅)**
- ✅ **안정적 (앱과 분리)**
- ✅ **k8s 이관 간편 (동일 방식)**

**확장성이 좋고, 유지보수가 쉬운 구조가 되었습니다!** 🚀

---

**작성일**: 2025-11-11
**버전**: 2.0.0 (stdout + Tail 방식)
**문서 위치**: `/Users/iseungjun/Code/Submit/week14_board/ARCHITECTURE_SIMPLIFIED.md`
