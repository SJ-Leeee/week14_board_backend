#!/bin/bash

# Fluent Bit 시작 스크립트
# 사용법: ./start-fluent-bit.sh

echo "🚀 Starting Fluent Bit..."
echo "📁 Working directory: $(pwd)"
echo "📄 Config file: fluent-bit.conf"
echo ""

# 로그 디렉토리 확인
if [ ! -d "logs" ]; then
    echo "❌ Error: logs directory not found"
    echo "Please run the backend server first to create the logs directory"
    exit 1
fi

# 설정 파일 확인
if [ ! -f "fluent-bit.conf" ]; then
    echo "❌ Error: fluent-bit.conf not found"
    exit 1
fi

if [ ! -f "parsers.conf" ]; then
    echo "❌ Error: parsers.conf not found"
    exit 1
fi

# Fluent Bit 설치 확인
if ! command -v fluent-bit &> /dev/null; then
    echo "❌ Error: Fluent Bit is not installed"
    echo ""
    echo "Please install Fluent Bit first:"
    echo "  brew install fluent-bit"
    exit 1
fi

echo "✅ All checks passed"
echo ""
echo "📡 Fluent Bit will send logs to: http://localhost:3001/api/v1/logs/batch"
echo "📊 Monitoring files:"
echo "   - logs/application.log"
echo "   - logs/error.log"
echo ""
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Fluent Bit 실행
fluent-bit -c fluent-bit.conf
