# 로그 수집 시스템 최종 가이드

## 🎯 핵심: 사용자는 아무것도 안 해도 됨!

**그냥 기본 Logger만 사용하면 Fluent-bit이 자동으로 수집합니다.**

---

## 📊 최종 아키텍처

```
애플리케이션 (모든 언어/프레임워크)
  ↓
console.log() / logger.log() / print()
  ↓
stdout (표준 출력)
  ↓
Docker가 파일로 저장
  ↓
/var/lib/docker/containers/<id>/<id>-json.log
  ↓
Fluent-bit (Tail, 5초마다 읽기)
  ↓
Producer (HTTP)
  ↓
Kafka
```

---

## 1️⃣ 사용자 코드 (초간단!)

### NestJS (현재 프로젝트)

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  async findAll() {
    this.logger.log('게시글 목록 조회');  // ← 끝!
    this.logger.warn('경고 메시지');
    this.logger.error('에러 발생', error.stack);
  }
}
```

**설정 없음! NestJS 기본 Logger 사용**

### Node.js (Express, Fastify, 등)

```javascript
console.log('사용자 로그인');
console.error('에러 발생:', error);
```

### Python

```python
print('사용자 로그인')
print(f'ERROR: {error}')
```

### Java

```java
System.out.println("사용자 로그인");
logger.info("사용자 로그인");
```

### Go

```go
log.Println("사용자 로그인")
fmt.Println("사용자 로그인")
```

---

## 2️⃣ Fluent-bit 자동 수집

### Docker 로그 수집 흐름

```conf
# fluent-bit.conf
[INPUT]
    Name    tail
    Path    /var/lib/docker/containers/*/*.log
    Parser  docker

[FILTER]
    Name     modify
    Add      type log
    Add      service_name week14-backend
    Add      environment dev

[OUTPUT]
    Name    http
    Host    ${PRODUCER_HOST}
    Port    ${PRODUCER_PORT}
    URI     /ingest/logs
```

**사용자는 신경 쓸 필요 없음!**

---

## 3️⃣ 트레이스 자동 수집 (OpenTelemetry)

```typescript
// 사용자 코드 수정 불필요!
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.service.findOne(id);  // ← OpenTelemetry가 자동 추적
}
```

**HTTP, DB 쿼리 모두 자동 추적됨**

---

## 4️⃣ 로컬 테스트

### 실행

```bash
# 1. .env 파일 설정
cp .env.example .env
vim .env  # Producer 주소 입력

# 2. 시작
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f fluent-bit
```

### 테스트

```bash
# API 호출
curl http://localhost:3000/posts

# Fluent-bit이 수집했는지 확인
docker-compose logs fluent-bit | grep "http.0"
# 출력: [output:http:http.0] producer:8080, HTTP status=200 ✅
```

---

## 5️⃣ k8s 배포 (DaemonSet)

### Fluent-bit DaemonSet

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluent-bit
  namespace: logging
spec:
  template:
    spec:
      containers:
      - name: fluent-bit
        image: fluent/fluent-bit:2.2
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: containers
          mountPath: /var/lib/docker/containers
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: containers
        hostPath:
          path: /var/lib/docker/containers
```

### Fluent-bit ConfigMap (k8s용)

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
data:
  fluent-bit.conf: |
    [INPUT]
        Name              tail
        Path              /var/log/containers/*.log
        Parser            cri        # k8s는 CRI 파서 사용
        Tag               kube.*

    [FILTER]
        Name              kubernetes  # k8s 메타데이터 추가
        Match             kube.*
        Merge_Log         On

    [OUTPUT]
        Name       http
        Match      *
        Host       producer.panopticon.svc.cluster.local
        Port       8080
        URI        /ingest/logs
```

**차이점:**
- Docker: `/var/lib/docker/containers/*/*.log` + `docker` parser
- k8s: `/var/log/containers/*.log` + `cri` parser + `kubernetes` filter

---

## 6️⃣ 수집되는 데이터 예시

### 로그

```json
{
  "type": "log",
  "timestamp": "2025-11-11 21:30:45",
  "level": "INFO",
  "message": "[PostsService] 게시글 목록 조회",
  "service_name": "week14-backend",
  "environment": "dev"
}
```

### 트레이스

```json
{
  "type": "span",
  "timestamp": "2025-11-11T21:30:45.100Z",
  "trace_id": "8e3b9f5bcf214ea7",
  "span_id": "a1b2c3d4e5f6g7h8",
  "name": "GET /posts/:id",
  "kind": "SERVER",
  "duration_ms": 45.3,
  "http_method": "GET",
  "http_status_code": 200,
  "service_name": "week14-backend",
  "environment": "dev"
}
```

---

## 7️⃣ 왜 이 방식인가?

### ✅ 장점

1. **Zero Configuration**
   - 사용자는 기본 Logger만 사용
   - 특별한 설정 불필요

2. **Universal**
   - 모든 언어/프레임워크 지원
   - Docker든 k8s든 동일한 방식

3. **Decoupled**
   - 애플리케이션과 로그 수집 완전 분리
   - Fluent-bit 다운되어도 앱 영향 없음

4. **Standard**
   - 12-Factor App 원칙
   - 컨테이너 로깅 표준

### ❌ 제거된 불필요한 것들

- ~~Winston 설정~~
- ~~fluent-logger 패키지~~
- ~~Forward 프로토콜~~
- ~~커스텀 Transport 구현~~
- ~~복잡한 설정 파일~~

---

## 8️⃣ 체크리스트

### 로컬 테스트

- [ ] `.env` 파일 설정 (Producer 주소)
- [ ] `docker-compose up -d` 실행
- [ ] Backend 정상 실행 확인 (`http://localhost:3000`)
- [ ] Fluent-bit 실행 확인 (`docker-compose ps fluent-bit`)
- [ ] API 호출 테스트 (`curl http://localhost:3000/posts`)
- [ ] Fluent-bit → Producer 전송 확인 (HTTP 200)
- [ ] Producer 관리자에게 데이터 수신 확인

### k8s 배포

- [ ] Fluent-bit DaemonSet 배포
- [ ] ConfigMap 생성 (CRI parser 사용)
- [ ] Pod 로그 확인 (`kubectl logs`)
- [ ] Fluent-bit 수집 확인
- [ ] Producer 데이터 수신 확인

---

## 🎉 결론

**사용자가 해야 할 일:**
1. 기본 Logger 사용 (`console.log()`, `logger.log()`)
2. 끝!

**Fluent-bit이 자동으로:**
1. Docker 로그 파일 읽기
2. JSON 파싱 및 정제
3. Producer로 전송

**간단하고, 범용적이고, 안정적입니다!** 🚀

---

## 📞 문의

문제 발생 시:

```bash
# Fluent-bit 로그 확인
docker-compose logs fluent-bit

# Backend 로그 확인
docker-compose logs backend

# Docker 로그 직접 확인
sudo tail -f /var/lib/docker/containers/$(docker ps -qf "name=backend")*/*.log
```

---

**작성일**: 2025-11-11
**버전**: 3.0.0 (Zero Configuration)
**문서 위치**: `/Users/iseungjun/Code/Submit/week14_board/FINAL_SETUP.md`
