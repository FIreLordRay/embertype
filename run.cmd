@echo off
rem embertype, with the server's output visible: builds the app and serves it at
rem http://localhost:4173 in this window. Close the window to stop the server.
rem (The desktop shortcut runs start_hidden.vbs instead, which hides this window.)
cd /d "%~dp0"

rem Already running (e.g. started by the shortcut)? Just open it.
netstat -ano | findstr /r /c:":4173 .*LISTENING" >nul && (
  start "" http://localhost:4173
  exit /b 0
)

if not exist node_modules (
  echo Installing dependencies, first run only...
  call npm install || goto :fail
)

call npm run build || goto :fail
call npm run preview -- --open || goto :fail
exit /b 0

:fail
echo.
echo Something went wrong: see the messages above.
pause
exit /b 1
