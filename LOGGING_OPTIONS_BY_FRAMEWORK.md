# 프레임워크별 로그 수집 방식

현재 구현된 Winston + Fluent-bit Forward 방식은 **NestJS 특화**입니다.
이 문서는 다양한 백엔드 환경에서 로그를 수집하는 방법을 설명합니다.

---

## 📊 로그 수집 방식 비교

| 방식 | 사용 환경 | 장점 | 단점 |
|------|----------|------|------|
| **stdout/stderr** | 모든 환경 | 범용적, 설정 불필요 | 구조화 어려움 |
| **Winston Forward** | NestJS, Express | 구조화된 로그 | Winston 의존 |
| **HTTP 직접 전송** | 모든 환경 | 간단, 유연함 | 애플리케이션 수정 필요 |
| **파일 → Tail** | 모든 환경 | 안정적 | 실시간성 낮음 |
| **Syslog** | 전통적 인프라 | 표준 프로토콜 | 설정 복잡 |

---

## 1️⃣ stdout/stderr 방식 (가장 범용적) ⭐ 추천

### 개념

**모든 애플리케이션의 표준 출력을 Fluent-bit이 수집**

```
애플리케이션 (어떤 언어든)
  ↓ console.log() / print() / System.out.println()
  ↓ stdout
Docker/K8s 로그 파일
  ↓ /var/log/containers/*.log
Fluent-bit (Tail INPUT)
  ↓
Producer
```

### Fluent-bit 설정 변경

```conf
# fluent-bit.conf
[INPUT]
    Name              tail
    Path              /var/log/containers/*.log
    Parser            docker
    Tag               kube.*
    Refresh_Interval  5
    Mem_Buf_Limit     5MB
    Skip_Long_Lines   On

[FILTER]
    Name                parser
    Match               kube.*
    Key_Name            log
    Parser              json
    Reserve_Data        On
    Preserve_Key        On

[OUTPUT]
    Name       http
    Match      *
    Host       ${PRODUCER_HOST}
    Port       ${PRODUCER_PORT}
    URI        /ingest/logs
    Format     json
```

### 애플리케이션 코드 (모든 프레임워크)

#### Node.js (Express, Fastify, 등)

```javascript
// 구조화된 JSON 로그 출력
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  message: '사용자 로그인',
  userId: 123
}));
```

#### Python (Django, Flask, FastAPI)

```python
import json
import logging

# JSON 포매터 설정
class JsonFormatter(logging.Formatter):
    def format(self, record):
        return json.dumps({
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'message': record.getMessage(),
        })

# 사용
logging.info('사용자 로그인', extra={'userId': 123})
```

#### Go (Gin, Echo, 등)

```go
import (
    "encoding/json"
    "log"
)

type LogEntry struct {
    Timestamp string `json:"timestamp"`
    Level     string `json:"level"`
    Message   string `json:"message"`
}

func main() {
    entry := LogEntry{
        Timestamp: time.Now().Format(time.RFC3339),
        Level:     "INFO",
        Message:   "사용자 로그인",
    }
    jsonLog, _ := json.Marshal(entry)
    log.Println(string(jsonLog))
}
```

#### Java (Spring Boot)

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

// Logback JSON 설정 (logback-spring.xml)
// <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>

logger.info("사용자 로그인", keyValue("userId", 123));
```

### 장점
- ✅ **모든 언어/프레임워크 지원**
- ✅ 애플리케이션 코드 최소 수정
- ✅ Fluent-bit 다운되어도 애플리케이션 영향 없음
- ✅ 컨테이너 표준 (Docker, K8s)

### 단점
- ❌ 로그 파일 디스크 I/O
- ❌ 실시간성 약간 낮음 (5초 간격)

---

## 2️⃣ Winston은 Node.js 전용

### Winston 사용 환경

Winston은 **Node.js 생태계에서만** 사용됩니다:

| 환경 | Winston 사용 여부 | 일반적인 로거 |
|------|------------------|--------------|
| NestJS | ✅ 자주 사용 | Winston, Pino |
| Express | ✅ 자주 사용 | Winston, Morgan, Pino |
| Fastify | ⚠️ 선택 사항 | Pino (기본) |
| Koa | ⚠️ 선택 사항 | Winston, Bunyan |
| Python | ❌ 사용 불가 | logging, loguru |
| Java | ❌ 사용 불가 | Log4j, Logback, SLF4J |
| Go | ❌ 사용 불가 | zap, logrus, zerolog |
| Ruby | ❌ 사용 불가 | Logger, Semantic Logger |

### Node.js에서 Winston 대신 사용하는 로거

#### 1. Pino (가장 빠름)

```javascript
const pino = require('pino');
const logger = pino();

logger.info({ userId: 123 }, '사용자 로그인');
```

**Pino → Fluent-bit Forward 연동:**

```javascript
// pino-fluent 사용
const pino = require('pino');
const pinoFluent = require('pino-fluent');

const logger = pino(pinoFluent({
  host: 'fluent-bit',
  port: 24224,
  tag: 'app'
}));
```

#### 2. Bunyan

```javascript
const bunyan = require('bunyan');
const logger = bunyan.createLogger({ name: 'myapp' });

logger.info({ userId: 123 }, '사용자 로그인');
```

---

## 3️⃣ HTTP 직접 전송 방식

### 개념

**애플리케이션에서 Producer로 HTTP 직접 전송**
Fluent-bit을 거치지 않고 바로 전송합니다.

```
애플리케이션
  ↓ HTTP POST
Producer (/ingest/logs)
  ↓
Kafka
```

### 장점
- ✅ Fluent-bit 불필요
- ✅ 실시간 전송
- ✅ 간단한 구조

### 단점
- ❌ Producer 다운 시 로그 손실 가능
- ❌ 애플리케이션 성능 영향
- ❌ 재시도 로직 직접 구현 필요

### 구현 예시

#### Node.js

```javascript
const axios = require('axios');

async function sendLog(level, message, context) {
  try {
    await axios.post(`${process.env.PRODUCER_HOST}/ingest/logs`, {
      timestamp: new Date().toISOString(),
      level,
      message,
      service_name: process.env.SERVICE_NAME,
      environment: process.env.NODE_ENV,
      ...context
    }, {
      timeout: 3000,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // 실패 시 fallback (console.error)
    console.error('Failed to send log', error.message);
  }
}

// 사용
await sendLog('INFO', '사용자 로그인', { userId: 123 });
```

#### Python

```python
import requests
import json
from datetime import datetime

def send_log(level, message, **context):
    try:
        requests.post(
            f"{os.getenv('PRODUCER_HOST')}/ingest/logs",
            json={
                'timestamp': datetime.utcnow().isoformat(),
                'level': level,
                'message': message,
                'service_name': os.getenv('SERVICE_NAME'),
                'environment': os.getenv('ENV'),
                **context
            },
            timeout=3
        )
    except Exception as e:
        print(f"Failed to send log: {e}")

# 사용
send_log('INFO', '사용자 로그인', userId=123)
```

---

## 4️⃣ 프레임워크별 권장 방식

### Node.js 기반

| 프레임워크 | 권장 방식 | 이유 |
|-----------|----------|------|
| **NestJS** | Winston Forward | 이미 Winston 내장 |
| **Express** | Winston Forward 또는 stdout | 선택 가능 |
| **Fastify** | stdout (Pino) | Pino가 기본 로거 |
| **Next.js** | stdout | 서버리스 환경 고려 |

### 다른 언어

| 언어 | 권장 방식 | 이유 |
|------|----------|------|
| **Python** | stdout | 표준 logging 모듈 |
| **Java** | stdout | Logback JSON encoder |
| **Go** | stdout | zap/zerolog JSON |
| **Ruby** | stdout | Semantic Logger |
| **.NET** | stdout | Serilog |

---

## 5️⃣ k8s 환경에서의 최적 방식

### 권장: stdout/stderr + Fluent-bit DaemonSet

```yaml
# fluent-bit-daemonset.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: logging
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush        1
        Log_Level    info

    [INPUT]
        Name              tail
        Path              /var/log/containers/*.log
        Parser            docker
        Tag               kube.*
        Refresh_Interval  5
        Mem_Buf_Limit     5MB

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Merge_Log           On
        Keep_Log            Off

    [OUTPUT]
        Name       http
        Match      *
        Host       producer.panopticon.svc.cluster.local
        Port       8080
        URI        /ingest/logs
        Format     json
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: logging
spec:
  selector:
    matchLabels:
      app: fluent-bit
  template:
    metadata:
      labels:
        app: fluent-bit
    spec:
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit:2.2
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
        - name: fluent-bit-config
          mountPath: /fluent-bit/etc/
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
      - name: fluent-bit-config
        configMap:
          name: fluent-bit-config
```

### 애플리케이션 배포 (어떤 언어든)

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: app
        image: myapp:latest
        # stdout으로 JSON 로그 출력만 하면 됨!
        # Fluent-bit DaemonSet이 자동으로 수집
```

---

## 6️⃣ 최종 권장 사항

### 로컬 개발 (Docker Compose)

**옵션 A: Winston Forward (현재 구현)** ✅
- NestJS 환경에 최적
- 구조화된 로그
- 실시간 전송

**옵션 B: stdout + Fluent-bit Tail**
```conf
# fluent-bit.conf 수정
[INPUT]
    Name              tail
    Path              /var/lib/docker/containers/*/*.log
    Parser            docker
```

### 프로덕션 (k8s)

**무조건 stdout + Fluent-bit DaemonSet** ⭐
- 모든 언어/프레임워크 지원
- 컨테이너 표준
- 확장성 우수
- 유지보수 간편

---

## 7️⃣ 현재 구현 개선 방안

### 제안: Hybrid 방식 지원

```typescript
// winston.config.ts
const transports: any[] = [
  new winston.transports.Console({ format: consoleFormat }),  // stdout
  new winston.transports.File({ filename: 'application.log' })
];

// Fluent-bit Forward는 선택사항
if (process.env.ENABLE_FLUENTBIT === 'true') {
  transports.push(new FluentTransport({ tag: 'week14.backend' }));
  console.log('✅ Fluent-bit Forward 활성화');
} else {
  console.log('ℹ️  stdout 로그 모드 (Fluent-bit이 파일에서 수집)');
}
```

### Fluent-bit 설정 선택

```bash
# .env
# 방식 1: Forward 프로토콜 (NestJS + Winston)
LOG_COLLECTION_MODE=forward

# 방식 2: stdout Tail (범용)
LOG_COLLECTION_MODE=tail
```

### docker-compose.yml

```yaml
fluent-bit:
  image: fluent/fluent-bit:2.2
  volumes:
    # Forward 방식
    - ./fluent-bit/fluent-bit-forward.conf:/fluent-bit/etc/fluent-bit.conf
    # 또는 Tail 방식
    # - ./fluent-bit/fluent-bit-tail.conf:/fluent-bit/etc/fluent-bit.conf
    - /var/lib/docker/containers:/var/lib/docker/containers:ro
```

---

## 📚 결론

| 사용 환경 | 권장 방식 | 설정 복잡도 |
|----------|----------|------------|
| **NestJS (현재)** | Winston Forward | ⭐⭐⭐ |
| **다른 Node.js** | stdout + Tail | ⭐⭐ |
| **다른 언어** | stdout + Tail | ⭐⭐ |
| **k8s 프로덕션** | stdout + DaemonSet | ⭐⭐⭐⭐ |

**최종 권장**:
1. 로컬 개발: 현재 Winston Forward 유지 (NestJS 환경)
2. k8s 배포: stdout + Fluent-bit DaemonSet으로 전환
3. 다른 언어 지원: stdout 방식 가이드 추가

---

**작성일**: 2025-11-11
**버전**: 1.0.0
**문서 위치**: `/Users/iseungjun/Code/Submit/week14_board/LOGGING_OPTIONS_BY_FRAMEWORK.md`
