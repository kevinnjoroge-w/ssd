#!/usr/bin/env bash
set -euo pipefail

# start server in background
fuser -k 3000/tcp || true
sleep 1
npm run dev > /tmp/ssd_server.log 2>&1 &
echo $! > /tmp/ssd_pid
sleep 1
sed -n '1,80p' /tmp/ssd_server.log || true

echo "--- CREATE USER FLOW ---"
curl -s -X POST http://localhost:3000/api/ussd/callback -H "Content-Type: application/json" -d '{"sessionId":"ATUid_createusr","phoneNumber":"+254700000020","text":"","networkOperator":"Safaricom"}' -w "\nSTATUS:%{http_code}\n"
sleep 0.4
curl -s -X POST http://localhost:3000/api/ussd/callback -H "Content-Type: application/json" -d '{"sessionId":"ATUid_createusr","phoneNumber":"+254700000020","text":"1","networkOperator":"Safaricom"}' -w "\nSTATUS:%{http_code}\n"
sleep 0.4
curl -s -X POST http://localhost:3000/api/ussd/callback -H "Content-Type: application/json" -d '{"sessionId":"ATUid_createusr","phoneNumber":"+254700000020","text":"John Doe","networkOperator":"Safaricom"}' -w "\nSTATUS:%{http_code}\n"
sleep 0.4
curl -s -X POST http://localhost:3000/api/ussd/callback -H "Content-Type: application/json" -d '{"sessionId":"ATUid_createusr","phoneNumber":"+254700000020","text":"2","networkOperator":"Safaricom"}' -w "\nSTATUS:%{http_code}\n"
sleep 0.4
curl -s -X POST http://localhost:3000/api/ussd/callback -H "Content-Type: application/json" -d '{"sessionId":"ATUid_createusr","phoneNumber":"+254700000020","text":"1","networkOperator":"Safaricom"}' -w "\nSTATUS:%{http_code}\n"
sleep 0.8

echo "--- DB: user and session after create ---"
sqlite3 database/insurance_sqlite.db "SELECT id, phone, name, occupation, income_range FROM users WHERE phone='+254700000020'"
echo
sqlite3 database/insurance_sqlite.db "SELECT session_id, phone, session_data, status FROM sessions WHERE session_id='ATUid_createusr'"
echo

# Update flow

echo "--- UPDATE FLOW ---"
curl -s -X POST http://localhost:3000/api/ussd/callback -H "Content-Type: application/json" -d '{"sessionId":"ATUid_update","phoneNumber":"+254700000020","text":"","networkOperator":"Safaricom"}' -w "\nSTATUS:%{http_code}\n"
sleep 0.4
curl -s -X POST http://localhost:3000/api/ussd/callback -H "Content-Type: application/json" -d '{"sessionId":"ATUid_update","phoneNumber":"+254700000020","text":"6","networkOperator":"Safaricom"}' -w "\nSTATUS:%{http_code}\n"
sleep 0.4
curl -s -X POST http://localhost:3000/api/ussd/callback -H "Content-Type: application/json" -d '{"sessionId":"ATUid_update","phoneNumber":"+254700000020","text":"Jane Smith","networkOperator":"Safaricom"}' -w "\nSTATUS:%{http_code}\n"
sleep 0.4
curl -s -X POST http://localhost:3000/api/ussd/callback -H "Content-Type: application/json" -d '{"sessionId":"ATUid_update","phoneNumber":"+254700000020","text":"3","networkOperator":"Safaricom"}' -w "\nSTATUS:%{http_code}\n"
sleep 0.4
curl -s -X POST http://localhost:3000/api/ussd/callback -H "Content-Type: application/json" -d '{"sessionId":"ATUid_update","phoneNumber":"+254700000020","text":"2","networkOperator":"Safaricom"}' -w "\nSTATUS:%{http_code}\n"
sleep 0.8

echo "--- DB: user and session after update ---"
sqlite3 database/insurance_sqlite.db "SELECT id, phone, name, occupation, income_range FROM users WHERE phone='+254700000020'"
echo
sqlite3 database/insurance_sqlite.db "SELECT session_id, phone, session_data, status FROM sessions WHERE session_id='ATUid_update'"

# stop server
kill "$(cat /tmp/ssd_pid)" 2>/dev/null || true
sleep 0.3
sed -n '1,160p' /tmp/ssd_server.log || true
