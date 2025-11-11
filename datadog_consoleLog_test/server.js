// server.js
const express = require("express");
const app = express();
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

// JSON 파싱 미들웨어
app.use(express.json({ limit: "10mb" }));

// logs 폴더 및 파일 경로
const logsDir = path.join(__dirname, "logs");
const logPath = path.join(logsDir, "logs.log");

// Write Stream (비동기, 고성능)
let logStream;

// 비동기로 logs 폴더 및 스트림 생성
async function initializeLogsDirectory() {
  try {
    await fsPromises.mkdir(logsDir, { recursive: true });

    logStream = fs.createWriteStream(logPath, {
      flags: "a", // append 모드
      encoding: "utf8",
    });

    // 에러 핸들링
    logStream.on("error", (error) => {
      console.error("❌ 로그 스트림 에러:", error);
    });
  } catch (error) {
    console.error("❌ logs 초기화 실패:", error);
    process.exit(1);
  }
}

// 로그 수신 엔드포인트
app.post("/api/v1/logs", (req, res) => {
  console.log("\n=== 📨 로그 수신 ===\n");
  const logString = JSON.stringify(req.body) + "\n";

  // 비동기 스트림에 쓰기 (non-blocking)
  logStream.write(logString);

  res.status(200).json({
    success: true,
    received_at: new Date().toISOString(),
  });
});

// 배치 로그 수신 (여러개 한번에)
app.post("/api/v1/logs/batch", (req, res) => {
  console.log("\n=== 📦 배치 로그 수신 ===");
  console.log("시간:", new Date().toISOString());

  const logs = Array.isArray(req.body) ? req.body : [req.body];
  console.log(`총 ${logs.length}개 로그 수신`);

  // 각 로그를 비동기 스트림에 쓰기
  logs.forEach((log, index) => {
    console.log(
      `\n[${index + 1}/${logs.length}]`,
      JSON.stringify(log, null, 2)
    );
    const logString = JSON.stringify(log) + "\n";
    logStream.write(logString);
  });

  console.log("========================\n");

  res.status(200).json({
    success: true,
    count: logs.length,
    received_at: new Date().toISOString(),
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "log-collector",
    uptime: process.uptime(),
  });
});

// 서버 시작
const PORT = process.env.PORT || 3001;

async function startServer() {
  // 먼저 logs 폴더를 비동기로 생성
  await initializeLogsDirectory();

  // 그 다음 서버 시작
  app.listen(PORT, () => {
    console.log("🚀 로그 수집 서버 시작!");
    console.log(`📍 http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log("대기 중...\n");
  });
}

startServer();
