/**
 * Winston Transport for Fluent-bit (Forward 프로토콜)
 *
 * Fluent-bit의 Forward 입력으로 로그를 전송합니다.
 * 사용자는 별도 설정 없이 자동으로 로그가 수집됩니다.
 */

import TransportStream from 'winston-transport';
import * as sender from 'fluent-logger';

interface FluentTransportOptions extends TransportStream.TransportStreamOptions {
  tag?: string;
  host?: string;
  port?: number;
  timeout?: number;
  reconnectInterval?: number;
  level?: string;
}

export class FluentTransport extends TransportStream {
  private logger: any;
  private tag: string;

  constructor(options: FluentTransportOptions = {}) {
    super(options);

    this.tag = options.tag || 'nestjs';

    // Fluent-bit Forward 프로토콜 설정
    this.logger = sender.createFluentSender(this.tag, {
      host: options.host || process.env.FLUENTBIT_HOST || 'fluent-bit',
      port: options.port || parseInt(process.env.FLUENTBIT_PORT || '24224'),
      timeout: options.timeout || 3.0,
      reconnectInterval: options.reconnectInterval || 600000, // 10분
    });

    // 에러 핸들링
    this.logger.on('error', (error: Error) => {
      console.error('Fluent-bit connection error:', error.message);
    });
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      // Winston Transport logged 이벤트
    });

    // Fluent-bit으로 전송할 데이터 준비
    const logData = {
      timestamp: info.timestamp || new Date().toISOString(),
      level: info.level.toUpperCase(),
      message: info.message,
      service_name: process.env.OTEL_SERVICE_NAME || 'week14-backend',
      environment: process.env.NODE_ENV || 'dev',
      context: info.context,
      trace: info.trace,
      // HTTP 관련 정보가 있다면 포함
      ...(info.req && {
        http_method: info.req.method,
        http_path: info.req.url,
        http_status_code: info.res?.statusCode,
      }),
    };

    // Fluent-bit Forward로 전송
    this.logger.emit('log', logData, (err: Error) => {
      if (err) {
        console.error('Failed to send log to Fluent-bit:', err.message);
      }
    });

    callback();
  }

  // 정리
  close() {
    this.logger.end('end', {}, () => {
      // noop
    });
  }
}
