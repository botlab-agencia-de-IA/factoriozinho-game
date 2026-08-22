@echo off
title Factoriozinho
cd /d "%~dp0"
echo.
echo   Iniciando o Factoriozinho...
echo.
start "" http://localhost:8080
node servidor.js
pause
