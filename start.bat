@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo       CampusEvents - Startup Helper
echo ==========================================
if not exist node_modules\concurrently (
  echo Installing root dependencies...
  call npm install
  if errorlevel 1 goto install_failed
)
if not exist backend\node_modules\express (
  echo Installing backend dependencies...
  call npm install --prefix backend
  if errorlevel 1 goto install_failed
)
if not exist frontend\node_modules\vite (
  echo Installing frontend dependencies...
  call npm install --prefix frontend
  if errorlevel 1 goto install_failed
)
echo Starting backend and frontend...
call npm run dev
goto end
:install_failed
echo.
echo Dependency installation failed. Check your internet connection and Node.js/npm installation.
pause
:end
endlocal
