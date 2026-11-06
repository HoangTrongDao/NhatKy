@echo off
chcp 65001 >nul
echo ===================================================
echo     KHỞI ĐỘNG DỰ ÁN NEW BEGINNING (FULLSTACK)
echo ===================================================
echo.

set ROOT_DIR=%~dp0

echo [1/3] Đang khởi động Backend (FastAPI)...
start "New Beginning Backend" cmd /k "cd /d "%ROOT_DIR%backend" && if exist .venv\Scripts\activate.bat (call .venv\Scripts\activate.bat) else (py -m venv .venv && call .venv\Scripts\activate.bat && pip install -r requirements.txt) && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/3] Đang khởi động Frontend (Vite + React)...
start "New Beginning Frontend" cmd /k "cd /d "%ROOT_DIR%frontend" && if not exist node_modules (npm install) && npm run dev"

echo [3/3] Đang đợi dịch vụ sẵn sàng và mở trình duyệt...
timeout /t 3 >nul
start http://localhost:5173

echo.
echo ===================================================
echo   Sản phẩm đã khởi chạy thành công!
echo   Frontend : http://localhost:5173
echo   Backend  : http://127.0.0.1:8000
echo   API Docs : http://127.0.0.1:8000/docs
echo ===================================================
echo Để tắt ứng dụng, chỉ cần đóng 2 cửa sổ terminal vừa mở.
pause
