@echo off
setlocal
cd /d "%~dp0"
if not exist node_modules\vite (
  echo Installing frontend dependencies (including axios and lucide-react)...
  call npm install
  if errorlevel 1 goto failed
)
call npm run dev
goto end
:failed
echo Frontend dependency installation failed. Check your internet connection.
pause
:end
endlocal
