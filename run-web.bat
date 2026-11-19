@echo off
REM Inicia o frontend Angular (a API precisa estar rodando em http://localhost:5136)
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)
echo Iniciando Angular em http://localhost:4200 ...
npm start
