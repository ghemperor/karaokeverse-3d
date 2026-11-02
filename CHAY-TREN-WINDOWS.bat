@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Can cai Node.js 20+ tu trang https://nodejs.org
  pause
  exit /b 1
)
if not "%~1"=="" set "PORT=%~1"
if not defined PORT set "PORT=3002"
echo.
echo ==================================================
echo   KARAOKEVERSE 3D v1.2.2 -- AUTO-TUNE LAB
 echo ==================================================
echo Su dung cong PORT=%PORT%
echo Neu cong dang ban, chay: CHAY-TREN-WINDOWS.bat 3003
echo.
if not exist "node_modules\express\package.json" (
  echo Lan dau cai dependencies; can Internet...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo Cai dependencies that bai. Kiem tra ket noi Internet.
    pause
    exit /b 1
  )
)
echo.
echo Mo Chrome/Edge: http://localhost:%PORT%
echo De dung server: nhan Ctrl+C trong cua so nay.
echo.
call npm start
pause
