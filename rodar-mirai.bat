@echo off
rem Mirai: roda o site no seu PC e gera um link publico (Cloudflare) para os amigos testarem.
rem Uso: duplo clique neste arquivo. Com --so-verificar, so confere o que falta, sem instalar nem iniciar nada.
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title Mirai - rodar e compartilhar
cd /d "%~dp0"

set "PORTA=4173"
set "SO_VERIFICAR="
if /i "%~1"=="--so-verificar" set "SO_VERIFICAR=1"

echo.
echo ==========================================================
echo   Mirai: verificando o que precisa estar instalado
echo ==========================================================
echo.

rem ---- 1. Node.js (o npm vem junto) ----
where node >nul 2>nul
if errorlevel 1 goto sem_node
for /f "delims=" %%v in ('node -v') do set "VER_NODE=%%v"
echo [OK] Node.js !VER_NODE!
goto checa_npm

:sem_node
echo [FALTA] Node.js nao esta instalado.
if defined SO_VERIFICAR goto checa_cloudflared
where winget >nul 2>nul
if errorlevel 1 (
  echo [ERRO] O winget nao esta disponivel. Instale o Node.js LTS em https://nodejs.org e rode este arquivo de novo.
  goto fim_erro
)
echo [..] Instalando o Node.js LTS com o winget...
winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
echo.
echo [OK] Node.js instalado. Feche esta janela e rode o arquivo de novo, para o Windows reconhecer o programa.
goto fim_ok

:checa_npm
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRO] npm nao encontrado. Reinstale o Node.js LTS.
  goto fim_erro
)
echo [OK] npm encontrado.

:checa_cloudflared
rem ---- 2. cloudflared (gera o link publico) ----
where cloudflared >nul 2>nul
if errorlevel 1 goto sem_cloudflared
echo [OK] cloudflared encontrado.
goto checa_deps

:sem_cloudflared
echo [FALTA] cloudflared nao esta instalado. Ele gera o link publico.
if defined SO_VERIFICAR goto checa_deps
echo [..] Instalando o cloudflared com o winget...
winget install -e --id Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements
echo.
echo [OK] cloudflared instalado. Feche esta janela e rode o arquivo de novo.
goto fim_ok

:checa_deps
rem ---- 3. Dependencias do projeto ----
if exist "node_modules\vite\package.json" goto deps_ok
echo [FALTA] Dependencias do projeto nao instaladas.
if defined SO_VERIFICAR goto resumo
echo [..] Instalando as dependencias ^(npm install^). Pode levar alguns minutos...
call npm install
if errorlevel 1 (
  echo [ERRO] npm install falhou. Veja a mensagem acima.
  goto fim_erro
)
goto deps_pronto

:deps_ok
echo [OK] Dependencias do projeto instaladas.

:deps_pronto
if defined SO_VERIFICAR goto resumo

rem ---- 4. Versao do site (build) e servidor local ----
echo.
echo [..] Gerando a versao do site ^(npm run build^)...
call npm run build
if errorlevel 1 (
  echo [ERRO] O build falhou. Veja a mensagem acima.
  goto fim_erro
)

echo.
echo [..] Abrindo o site local e o link publico...
start "Mirai - site local" cmd /k npm run preview -- --host 127.0.0.1 --port %PORTA% --strictPort
timeout /t 5 /nobreak >nul
start "Mirai - link publico (Cloudflare)" cmd /k cloudflared tunnel --url http://127.0.0.1:%PORTA%

echo.
echo ==========================================================
echo   Pronto!
echo   Site no seu PC: http://127.0.0.1:%PORTA%
echo   Link para mandar aos amigos: procure trycloudflare.com
echo   na janela "Mirai - link publico (Cloudflare)".
echo   Para encerrar, feche as duas janelas do Mirai.
echo ==========================================================
goto fim_ok

:resumo
echo.
echo ----------------------------------------------------------
echo   Verificacao concluida. Nada foi instalado nem iniciado.
echo ----------------------------------------------------------
goto fim_ok

:fim_ok
echo.
if not defined SO_VERIFICAR pause
endlocal
exit /b 0

:fim_erro
echo.
if not defined SO_VERIFICAR pause
endlocal
exit /b 1
