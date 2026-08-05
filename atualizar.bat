@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Atualizando o Monitor de Margem...
echo ============================================
echo.
call npm run atualizar
echo.
echo ============================================
echo   Concluido. Confira as mensagens acima.
echo ============================================
pause
