@echo off
rem embertype, with the server's output visible: builds the app and serves it at
rem http://localhost:4173 in this window. Close the window to stop the server.
rem (The desktop shortcut runs start_hidden.vbs instead, which hides this window.)
cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies, first run only...
  call npm install || goto :fail
)

rem Always build first, so what you see matches the code.
call npm run build || goto :fail

rem Already running (e.g. started by the shortcut)? It serves the new build: just open it.
rem PowerShell reports the port's state as a value, the same in every Windows language.
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" && (
  start "" http://localhost:4173
  exit /b 0
)

call npm run preview -- --open || goto :fail
exit /b 0

:fail
echo.
echo Something went wrong: see the messages above.
pause
exit /b 1
