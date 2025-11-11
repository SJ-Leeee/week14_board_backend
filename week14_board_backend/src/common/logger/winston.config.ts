import * as winston from 'winston';
import { WinstonModuleOptions } from 'nest-winston';
import * as path from 'path';
import { FluentTransport } from './fluent-transport';

// 로그 디렉토리 경로
const logDir = path.join(process.cwd(), 'logs');

// 로그 포맷 설정
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// 콘솔용 포맷 (개발 환경)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, context, trace }) => {
    return `${timestamp} [${context || 'Application'}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
  }),
);

// Transports 배열 생성
const transports: any[] = [
  // 콘솔 출력
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // 전체 로그 파일
  new winston.transports.File({
    filename: path.join(logDir, 'application.log'),
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
  // 에러 로그 파일
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
];

// Fluent-bit Transport 추가 (개발/프로덕션 환경)
// 환경변수 ENABLE_FLUENTBIT=true 로 활성화
if (process.env.ENABLE_FLUENTBIT === 'true') {
  transports.push(
    new FluentTransport({
      tag: 'week14.backend',
      level: 'info',
    }),
  );
  console.log('✅ Fluent-bit Transport 활성화 (Forward 프로토콜)');
}

export const winstonConfig: WinstonModuleOptions = {
  transports,
};
