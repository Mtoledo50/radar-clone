@echo off
title Radar Clone - Iniciando serviços...
color 0B

echo ============================================================
echo   RADAR CLONE - Iniciando Backend e Frontend
echo ============================================================
echo.

echo [1/2] Iniciando BACKEND (porta 3001)...
start "Radar Clone - Backend" cmd /k "cd /d %~dp0backend && echo Backend iniciando... && npm run start:dev"

timeout /t 3 /nobreak > nul

echo [2/2] Iniciando FRONTEND (porta 3000)...
start "Radar Clone - Frontend" cmd /k "cd /d %~dp0frontend && echo Frontend iniciando... && npm run dev"

echo.
echo ✅ Dois terminais foram abertos!
echo.
echo 📊 Backend:  http://localhost:3001
echo  Frontend: http://localhost:3000
echo.
echo ⚠️  Aguarde alguns segundos para os serviços iniciarem.
echo.
echo 💡 Para parar: feche os terminais ou pressione Ctrl+C em cada um.
echo.
pause