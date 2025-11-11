# 로그 수집 시스템 설치 가이드

이 가이드는 Fluent-bit과 OpenTelemetry를 사용하여 애플리케이션 로그와 트레이스를 수집하고 외부 Producer 서버로 전송하는 방법을 안내합니다.

---

## 📋 목차

1. [사전 준비](#1-사전-준비)
2. [환경 설정](#2-환경-설정)
3. [로컬 테스트 실행](#3-로컬-테스트-실행)
4. [로그 수집 확인](#4-로그-수집-확인)
5. [문제 해결](#5-문제-해결)
6. [다음 단계: k3s 배포](#6-다음-단계-k3s-배포)

---

## 1. 사전 준비

### 필수 도구 설치

```bash
# Docker 버전 확인
docker --version
# Docker version 20.10.0 이상 필요

# Docker Compose 버전 확인
docker-compose --version
# docker-compose version 1.29.0 이상 필요
```

### Producer 서버 정보 확인

**인프라 관리자에게 다음 정보를 받으세요:**

- Producer HTTP 엔드포인트 (로그 수신용)
  - 예: `http://producer.example.com:8080`
- Producer OTLP 엔드포인트 (트레이스 수신용)
  - 예: `http://producer.example.com:4319`

---

## 2. 환경 설정

### 2.1 프로젝트 디렉토리로 이동

```bash
cd /Users/iseungjun/Code/Submit/week14_board
```

### 2.2 환경변수 파일 생성

```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env
```

### 2.3 .env 파일 편집

```bash
# 텍스트 에디터로 .env 파일 열기
vim .env
# 또는
code .env
```

**다음 내용을 입력하세요:**

```bash
# ========================================
# Producer 서버 설정
# ========================================

# Fluent-bit이 로그를 전송할 Producer 주소
PRODUCER_HOST=your-producer-host.com
PRODUCER_PORT=8080

# OpenTelemetry Collector가 트레이스를 전송할 Producer 주소
PRODUCER_OTLP_ENDPOINT=http://your-producer-host.com:4319
```

**⚠️ 중요:**
- `your-producer-host.com`을 실제 Producer 서버 주소로 변경하세요
- 포트 번호도 인프라 관리자에게 확인한 값으로 변경하세요

### 2.4 설정 확인

```bash
# .env 파일 내용 확인
cat .env
```

---

## 3. 로컬 테스트 실행

### 3.1 모든 서비스 시작

```bash
# Docker Compose로 모든 서비스 시작
docker-compose up -d
```

**실행되는 서비스:**
- ✅ MongoDB (데이터베이스)
- ✅ Backend (NestJS API 서버)
- ✅ Frontend (React 웹 애플리케이션)
- ✅ Fluent-bit (로그 수집기)
- ✅ OpenTelemetry Collector (트레이스 수집기)

### 3.2 서비스 상태 확인

```bash
# 모든 컨테이너가 실행 중인지 확인
docker-compose ps

# 출력 예시:
# NAME                   STATUS
# week14_backend         Up 30 seconds
# week14_frontend        Up 30 seconds
# week14_mongodb         Up 30 seconds
# week14_fluentbit       Up 30 seconds
# week14_otel_collector  Up 30 seconds
```

### 3.3 서비스 로그 확인

```bash
# Backend 로그 확인 (Fluent-bit 연결 확인)
docker-compose logs backend | grep -i fluent

# 다음 메시지를 찾으세요:
# ✅ Fluent-bit Transport 활성화 (Forward 프로토콜)

# OpenTelemetry 초기화 확인
docker-compose logs backend | grep -i otel

# 다음 메시지를 찾으세요:
# ✅ OpenTelemetry 자동 계측이 활성화되었습니다.
```

---

## 4. 로그 수집 확인

### 4.1 웹 애플리케이션 접속

```bash
# 브라우저에서 다음 주소로 접속
open http://localhost:5173
```

### 4.2 API 호출 테스트

```bash
# 게시글 목록 조회 (로그 및 트레이스 생성)
curl http://localhost:3000/posts

# 게시글 상세 조회
curl http://localhost:3000/posts/68f87972bb8229d66d701732
```

### 4.3 Fluent-bit 로그 수집 확인

```bash
# Fluent-bit이 로그를 수집하고 Producer로 전송하는지 확인
docker-compose logs -f fluent-bit

# 다음과 같은 로그를 찾으세요:
# [output:http:http.0] producer:8080, HTTP status=200
```

**✅ 성공 케이스:**
- HTTP status=200: Producer가 로그를 정상 수신
- 로그가 JSON 형식으로 출력됨

**❌ 실패 케이스:**
- `connection refused`: Producer 서버 주소 확인
- `timeout`: 네트워크 연결 확인
- `404 Not Found`: Producer 엔드포인트 경로 확인

### 4.4 OpenTelemetry Collector 확인

```bash
# OpenTelemetry Collector가 트레이스를 수집하는지 확인
docker-compose logs -f otel-collector

# 다음과 같은 로그를 찾으세요:
# Traces  {"kind": "exporter", "data_type": "traces", "name": "otlphttp"}
```

### 4.5 Producer 서버에서 데이터 확인

**인프라 관리자에게 문의:**
- Kafka 토픽에 로그 데이터가 들어오는지 확인 (`panopticon-logs`)
- Kafka 토픽에 트레이스 데이터가 들어오는지 확인 (`panopticon-spans`)

```bash
# Producer 관리자가 실행할 명령어 (참고용)
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic panopticon-logs \
  --from-beginning \
  --max-messages 10
```

---

## 5. 문제 해결

### 문제 1: Fluent-bit이 Producer에 연결되지 않음

**증상:**
```
[error] [output:http:http.0] connection refused
```

**해결 방법:**

1. .env 파일의 Producer 주소 확인
   ```bash
   cat .env
   ```

2. Producer 서버에 ping 테스트
   ```bash
   ping your-producer-host.com
   ```

3. Producer 서버 헬스체크
   ```bash
   curl http://your-producer-host.com:8080/health
   ```

4. .env 수정 후 재시작
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### 문제 2: OpenTelemetry Collector 연결 실패

**증상:**
```
[error] failed to push data via OTLP exporter
```

**해결 방법:**

1. OTLP 엔드포인트 확인
   ```bash
   docker-compose exec otel-collector env | grep PRODUCER_OTLP_ENDPOINT
   ```

2. Producer OTLP 엔드포인트 테스트
   ```bash
   curl -X POST http://your-producer-host.com:4319/v1/traces \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

3. .env 파일의 PRODUCER_OTLP_ENDPOINT 수정 후 재시작

### 문제 3: Backend가 Fluent-bit에 연결 안 됨

**증상:**
```
Fluent-bit connection error: connect ECONNREFUSED
```

**해결 방법:**

1. Fluent-bit 컨테이너 상태 확인
   ```bash
   docker-compose ps fluent-bit
   ```

2. Fluent-bit 로그 확인
   ```bash
   docker-compose logs fluent-bit
   ```

3. Backend 재시작
   ```bash
   docker-compose restart backend
   ```

### 문제 4: MongoDB 연결 실패

**증상:**
```
MongooseServerSelectionError: connect ECONNREFUSED
```

**해결 방법:**

1. MongoDB 컨테이너 확인
   ```bash
   docker-compose ps mongodb
   ```

2. MongoDB 재시작
   ```bash
   docker-compose restart mongodb
   docker-compose restart backend
   ```

### 로그 확인 명령어 모음

```bash
# 모든 서비스 로그 실시간 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f backend
docker-compose logs -f fluent-bit
docker-compose logs -f otel-collector

# 최근 100줄 로그 확인
docker-compose logs --tail=100 backend

# 에러 로그만 필터링
docker-compose logs backend | grep -i error
docker-compose logs fluent-bit | grep -i error
```

---

## 6. 다음 단계: k3s 배포

로컬 테스트가 성공적으로 완료되었다면, 다음 단계로 진행합니다.

### 6.1 로컬 테스트 체크리스트

다음 항목을 모두 확인하세요:

- [ ] Backend가 정상 실행됨 (`http://localhost:3000`)
- [ ] Frontend가 정상 실행됨 (`http://localhost:5173`)
- [ ] Fluent-bit이 Producer에 연결됨 (HTTP status=200)
- [ ] OpenTelemetry Collector가 Producer에 연결됨
- [ ] Producer 서버에서 데이터 수신 확인 (관리자 문의)
- [ ] API 호출 시 로그와 트레이스가 수집됨

### 6.2 서비스 중지

```bash
# 모든 서비스 중지
docker-compose down

# 데이터까지 완전히 삭제 (MongoDB 데이터 초기화)
docker-compose down -v
```

### 6.3 k3s 환경 준비 (다음 작업)

로컬 테스트가 완료되면 k3s 환경으로 이관합니다:

1. **k3s 클러스터 구축**
   - k3d 또는 Rancher Desktop 사용
   - 로컬 k8s 클러스터 생성

2. **Kubernetes 매니페스트 작성**
   - Deployment, Service, ConfigMap 작성
   - Fluent-bit DaemonSet 배포
   - OpenTelemetry Collector Deployment 배포

3. **ConfigMap 설정**
   - Fluent-bit 설정 ConfigMap 생성
   - OpenTelemetry Collector 설정 ConfigMap 생성
   - Producer 엔드포인트 환경변수 설정

4. **배포 및 테스트**
   - kubectl apply로 리소스 배포
   - Pod 로그 확인
   - 데이터 수집 확인

---

## 📊 현재 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                  로컬 Docker Compose 환경                     │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │Frontend  │  │Backend   │  │MongoDB   │                  │
│  │:5173     │  │:3000     │  │:27017    │                  │
│  └──────────┘  └────┬─────┘  └──────────┘                  │
│                     │                                        │
│         ┌───────────┴───────────┐                           │
│         │                       │                           │
│    logs (Forward)          traces (OTLP)                    │
│         │                       │                           │
│         ↓                       ↓                           │
│  ┌─────────────┐      ┌──────────────────┐                 │
│  │ Fluent-bit  │      │ OpenTelemetry    │                 │
│  │ :24224      │      │   Collector      │                 │
│  │ :2020       │      │ :4317, :4318     │                 │
│  └──────┬──────┘      └────────┬─────────┘                 │
└─────────┼──────────────────────┼───────────────────────────┘
          │                      │
          │  HTTP                │  OTLP HTTP
          ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    외부 인프라 (배포됨)                        │
│                                                               │
│    ┌─────────────────────────────┐                          │
│    │   Producer 서버              │                          │
│    │   - /ingest/logs (로그)      │                          │
│    │   - /v1/traces (트레이스)     │                          │
│    └──────────┬──────────────────┘                          │
│               ↓                                              │
│         ┌──────────┐                                         │
│         │  Kafka   │                                         │
│         │ Topics:  │                                         │
│         │ - logs   │                                         │
│         │ - spans  │                                         │
│         └────┬─────┘                                         │
│              ↓                                               │
│    [Consumer → Elasticsearch → Kibana]                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 주요 설정 파일

### 1. `.env` (환경변수)
- Producer 서버 주소 설정

### 2. `fluent-bit/fluent-bit.conf`
- Forward 입력 (24224 포트)
- HTTP 출력 (Producer로 전송)

### 3. `otel-collector/otel-collector-config.yaml`
- OTLP 수신 (4317, 4318 포트)
- HTTP 출력 (Producer로 전송)

### 4. `docker-compose.yml`
- 모든 서비스 오케스트레이션
- 환경변수 주입

---

## 📞 문의

**문제가 해결되지 않을 때:**

1. 로그 파일 저장
   ```bash
   docker-compose logs > logs.txt
   ```

2. 환경 정보 수집
   ```bash
   docker-compose ps > status.txt
   docker-compose config > config.txt
   ```

3. 인프라 관리자에게 전달
   - logs.txt
   - status.txt
   - config.txt
   - .env 파일 (민감 정보 제외)

---

## ✅ 완료 체크리스트

로컬 테스트를 완료하기 전에 다음을 확인하세요:

- [ ] .env 파일 생성 및 Producer 주소 설정
- [ ] `docker-compose up -d` 실행
- [ ] 모든 컨테이너 정상 실행 확인
- [ ] Backend에서 Fluent-bit 연결 확인 (✅ 메시지)
- [ ] Backend에서 OpenTelemetry 초기화 확인 (✅ 메시지)
- [ ] API 호출 테스트 완료
- [ ] Fluent-bit에서 Producer로 전송 성공 (HTTP 200)
- [ ] OpenTelemetry Collector에서 Producer로 전송 성공
- [ ] Producer 관리자에게 데이터 수신 확인
- [ ] 모든 기능 정상 작동 확인

**모든 항목이 체크되었다면, k3s 배포 준비가 완료되었습니다!** 🎉

---

**작성일**: 2025-11-11
**버전**: 1.0.0
**문서 위치**: `/Users/iseungjun/Code/Submit/week14_board/LOGGING_SETUP_GUIDE.md`
