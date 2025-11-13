/**
 * OpenTelemetry 자동 계측 설정
 *
 * 이 파일은 애플리케이션 시작 전에 로드되어야 합니다.
 * main.ts에서 가장 먼저 import하거나, NODE_OPTIONS로 실행 시 로드됩니다.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// OTLP Exporter 설정 (OpenTelemetry Collector로 전송)
const traceExporter = new OTLPTraceExporter({
  url:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    'http://localhost:4318/v1/traces',
});

// SDK 초기화
const sdk = new NodeSDK({
  serviceName: process.env.OTEL_SERVICE_NAME || 'week14-backend',
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // HTTP 요청/응답 자동 계측
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      // Express 자동 계측
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      // MongoDB 자동 계측
      '@opentelemetry/instrumentation-mongodb': {
        enabled: true,
      },
      // DNS, Net 등 불필요한 계측 비활성화
      '@opentelemetry/instrumentation-dns': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-net': {
        enabled: false,
      },
    }),
  ],
});

// SDK 시작
sdk.start();
console.log('✅ OpenTelemetry 자동 계측이 활성화되었습니다.');

// 프로세스 종료 시 정리
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('OpenTelemetry SDK 종료'))
    .catch((error) => console.error('OpenTelemetry SDK 종료 중 오류', error))
    .finally(() => process.exit(0));
});

export default sdk;
