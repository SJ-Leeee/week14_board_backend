# Panopticon - 로그 수집 분석 통합 서비스

## 📋 개요

이 프로젝트는 분산 환경의 로그와 트레이스 데이터를 수집, 정제하여 Kafka로 전송하는 시스템입니다.

### 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                로컬 사용자 쿠버네티스 환경                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │Frontend  │  │Backend   │  │MongoDB   │                  │
│  │(React)   │  │(NestJS)  │  │          │                  │
│  └────┬─────┘  └────┬─────┘  └──────────┘                  │
│       │             │                                        │
│       │ logs        │ logs + traces                         │
│       ↓             ↓                                        │
│  ┌─────────────┐  ┌──────────────────┐                     │
│  │ Fluent-bit  │  │ OpenTelemetry    │                     │
│  │  (로그수집)  │  │   Collector      │                     │
│  └──────┬──────┘  └────────┬─────────┘                     │
└─────────┼──────────────────┼───────────────────────────────┘
          │                  │
          │  HTTP            │  OTLP HTTP
          ↓                  ↓
┌─────────────────────────────────────────────────────────────┐
│                    외부 인프라 (이미 배포됨)                   │
│    ┌─────────────────────────────┐                          │
│    │   Producer 서버              │                          │
│    │   (데이터 정제 및 변환)        │                          │
│    └──────────┬──────────────────┘                          │
│               │ JSON                                         │
│               ↓                                              │
│         ┌──────────┐                                         │
│         │  Kafka   │                                         │
│         └────┬─────┘                                         │
│              │                                               │
│              ↓                                               │
│    [Consumer → Elasticsearch/분석]                           │
└─────────────────────────────────────────────────────────────┘
```

**주의**: Producer 서버와 Kafka는 이미 외부 인프라에 배포되어 있습니다.
로컬 환경에서는 Fluent-bit과 OpenTelemetry Collector만 실행하여
외부 Producer로 데이터를 전송합니다.

### 데이터 타입

#### 1. 로그 (Log)
```json
{
  "type": "log",
  "timestamp": "2025-11-10T12:00:12.123Z",
  "service_name": "order-service",
  "environment": "prod",
  "level": "INFO",
  "message": "Created order successfully",
  "trace_id": "8e3b9f5bcf214ea7",
  "span_id": "a1b2c3d4e5f6g7h8"
}
```

#### 2. 스팬 (Span)
```json
{
  "type": "span",
  "timestamp": "2025-11-10T12:00:12.100Z",
  "service_name": "order-service",
  "environment": "prod",
  "trace_id": "8e3b9f5bcf214ea7",
  "span_id": "a1b2c3d4e5f6g7h8",
  "parent_span_id": null,
  "name": "POST /orders",
  "kind": "SERVER",
  "duration_ms": 45.3,
  "status": "OK",
  "http_method": "POST",
  "http_path": "/orders",
  "http_status_code": 201
}
```

## 🚀 로컬 개발 환경 (Docker Compose)

### 사전 준비

```bash
# Docker와 Docker Compose 설치 필요
docker --version
docker-compose --version
```

### 환경 설정

```bash
# 1. .env 파일 생성
cp .env.example .env

# 2. Producer 서버 주소 설정
# .env 파일을 열어서 외부 Producer 서버 주소 입력
vim .env

# 예시:
# PRODUCER_HOST=producer.your-domain.com
# PRODUCER_PORT=8080
# PRODUCER_OTLP_ENDPOINT=http://producer.your-domain.com:4319
```

### 실행

```bash
# 1. 프로젝트 루트로 이동
cd /Users/iseungjun/Code/Submit/week14_board

# 2. 모든 서비스 시작
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f

# 4. 특정 서비스만 로그 확인
docker-compose logs -f backend
docker-compose logs -f fluent-bit
docker-compose logs -f otel-collector
```

### 서비스 접근

| 서비스 | URL | 설명 |
|--------|-----|------|
| Frontend | http://localhost:5173 | React 웹 애플리케이션 |
| Backend | http://localhost:3000 | NestJS API 서버 |
| Swagger | http://localhost:3000/api/docs | API 문서 |
| MongoDB | mongodb://localhost:27017 | 데이터베이스 |
| OTel Collector | http://localhost:4318 | OTLP HTTP Endpoint |
| Fluent-bit | http://localhost:2020 | Fluent-bit 메트릭 |

**외부 인프라 (이미 배포됨)**
| 서비스 | 설명 |
|--------|------|
| Producer | .env에 설정된 외부 서버 |
| Kafka | Producer를 통해 접근 |

### 데이터 전송 확인

```bash
# Fluent-bit 로그 확인 (Producer로 전송 여부)
docker-compose logs -f fluent-bit

# OpenTelemetry Collector 로그 확인
docker-compose logs -f otel-collector

# Backend API 호출로 로그/트레이스 생성
curl http://localhost:3000/posts
```

**참고**: Kafka는 외부 인프라에 있으므로 직접 접근할 수 없습니다.
Producer 서버 관리자에게 문의하여 데이터 수신 여부를 확인하세요.

### 중지 및 정리

```bash
# 모든 서비스 중지
docker-compose down

# 볼륨까지 삭제 (데이터베이스 초기화)
docker-compose down -v
```

## 🎯 테스트 방법

### 1. 로그 수집 테스트

```bash
# Backend API 호출 (로그 생성)
curl http://localhost:3000/posts

# Fluent-bit이 로그를 수집하여 Producer로 전송
# Producer가 정제 후 Kafka로 전송
# Kafka 토픽에서 확인
```

### 2. 트레이스 수집 테스트

```bash
# Backend API 호출 (트레이스 자동 생성)
curl http://localhost:3000/posts/68f87972bb8229d66d701732

# OpenTelemetry SDK가 자동으로 스팬 생성
# OpenTelemetry Collector가 수집
# Producer로 전송 → 정제 → Kafka
```

## 📦 구성 요소

### 1. Fluent-bit
- **역할**: 컨테이너 로그 수집
- **설정**: `fluent-bit/fluent-bit.conf`
- **출력**: Producer HTTP endpoint (`/ingest/logs`)

### 2. OpenTelemetry Collector
- **역할**: 분산 트레이싱 데이터 수집
- **설정**: `otel-collector/otel-collector-config.yaml`
- **출력**: Producer OTLP endpoint (`/v1/traces`)

### 3. Producer 서버 (외부 인프라)
- **역할**: 데이터 정제 및 Kafka 전송
- **위치**: 이미 인프라에 배포됨
- **설정**: `.env` 파일에서 엔드포인트 지정
- **엔드포인트**:
  - `POST /ingest/logs` - Fluent-bit으로부터 로그 수신
  - `POST /v1/traces` - OTel Collector로부터 트레이스 수신
  - `GET /health` - 헬스체크

### 4. Kafka (외부 인프라)
- **역할**: 메시지 브로커
- **위치**: 이미 인프라에 배포됨
- **토픽**:
  - `panopticon-logs` - 로그 데이터
  - `panopticon-spans` - 스팬 데이터

## 🐳 k3s 환경 구축 (로컬 쿠버네티스)

### k3s 설치

```bash
# macOS에서 k3s 설치 (Rancher Desktop 권장)
# 또는 k3d 사용
brew install k3d

# k3s 클러스터 생성
k3d cluster create panopticon-local \
  --agents 2 \
  --port "8080:80@loadbalancer" \
  --port "8443:443@loadbalancer"

# kubectl 설정 확인
kubectl cluster-info
```

### 쿠버네티스 매니페스트 적용

```bash
# 매니페스트 디렉토리로 이동
cd k8s/

# 네임스페이스 생성
kubectl create namespace panopticon

# 모든 리소스 적용
kubectl apply -f . -n panopticon

# Pod 상태 확인
kubectl get pods -n panopticon -w
```

## 🔧 문제 해결

### Fluent-bit이 로그를 수집하지 못할 때

```bash
# Fluent-bit 로그 확인
docker-compose logs fluent-bit

# Docker logging driver 확인
docker inspect week14_backend | grep -A 10 LogConfig
```

### OpenTelemetry 트레이스가 수집되지 않을 때

```bash
# OTel Collector 로그 확인
docker-compose logs otel-collector

# Backend에서 OTLP 엔드포인트 확인
docker-compose exec backend env | grep OTEL
```

### Producer 연결 실패

```bash
# .env 파일 설정 확인
cat .env

# Fluent-bit이 Producer에 연결되는지 확인
docker-compose logs fluent-bit | grep -i error

# OTel Collector가 Producer에 연결되는지 확인
docker-compose logs otel-collector | grep -i error

# 네트워크 연결 테스트
curl -X POST http://YOUR_PRODUCER_HOST:YOUR_PRODUCER_PORT/health
```

## 📝 다음 단계

1. ✅ 로컬 Docker Compose 환경 구축
2. ✅ Fluent-bit 로그 수집 설정
3. ✅ OpenTelemetry 자동 계측
4. ✅ 외부 Producer 연동 설정
5. ⏳ k8s 매니페스트 작성
6. ⏳ 사용자 환경 배포 가이드
7. ⏳ 모니터링 및 대시보드 구성

## 🔗 외부 Producer 연동

Producer 서버는 이미 인프라에 배포되어 있습니다:

1. **Producer 서버 주소 받기**
   - 인프라 관리자에게 Producer HTTP 엔드포인트 확인
   - Producer OTLP 엔드포인트 확인

2. **환경 변수 설정**
   ```bash
   # .env 파일 생성 및 수정
   cp .env.example .env
   vim .env
   ```

3. **연결 테스트**
   ```bash
   # Producer 헬스체크
   curl http://YOUR_PRODUCER_HOST:YOUR_PRODUCER_PORT/health

   # 테스트 로그 전송
   curl -X POST http://YOUR_PRODUCER_HOST:YOUR_PRODUCER_PORT/ingest/logs \
     -H "Content-Type: application/json" \
     -d '{"type":"log","message":"test","service_name":"test"}'
   ```

## 🤔 왜 Fluent-bit과 OpenTelemetry 둘 다?

- **Fluent-bit**: 로그 수집의 업계 표준, 가볍고 빠름
  - 컨테이너 stdout/stderr 로그 수집
  - 로그 파싱 및 전처리
  - 사용자가 이미 경험 있음

- **OpenTelemetry**: 분산 추적의 표준
  - Trace/Span 데이터는 OTLP 프로토콜 사용
  - 자동 계측(auto-instrumentation) 지원
  - HTTP, DB 등 자동 추적

**결론**: 로그는 Fluent-bit, 트레이스는 OpenTelemetry로 분리하여 각각의 강점 활용

## 🎓 학습 곡선 최소화

- **Fluent-bit**: 기존 경험 활용 + 간단한 설정 파일만 수정
- **OpenTelemetry**: Auto-instrumentation으로 코드 수정 최소화
- **k3s**: 실제 k8s와 거의 동일하지만 훨씬 가벼움
- **Producer**: 표준 Node.js/Express로 구현하여 쉽게 확장 가능
