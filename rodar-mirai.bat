@echo off
rem Mirai: roda o site no seu PC e gera o link publico (Cloudflare) para os amigos.
rem Tudo acontece nesta mesma janela. Para encerrar, feche a janela.
rem Uso: duplo clique. Com --so-verificar, so confere o que falta, sem instalar nem iniciar nada.
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title Mirai - site e link para amigos
cd /d "%~dp0"

set "PORTA=4173"
set "LOG_SITE=%TEMP%\mirai-site.log"
set "LOG_LINK=%TEMP%\mirai-link.log"

rem Teste interno da leitura do link: rodar-mirai.bat :extrai_link
if /i "%~1"==":extrai_link" (
  call :extrai_link
  echo LINK=!LINK!
  endlocal
  exit /b 0
)

set "SO_VERIFICAR="
if /i "%~1"=="--so-verificar" set "SO_VERIFICAR=1"

echo.
echo ==========================================================
echo   MIRAI: verificando o que precisa estar instalado
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

rem ---- 4. Versao do site (build) ----
echo.
echo [..] Gerando a versao do site ^(npm run build^)...
call npm run build >nul 2>nul
if errorlevel 1 (
  echo [ERRO] O build falhou. Rode npm run build nesta pasta para ver a mensagem.
  goto fim_erro
)
echo [OK] Versao do site gerada.

rem ---- 5. Site local, em segundo plano nesta mesma janela ----
netstat -ano | findstr /r /c:":%PORTA% .*LISTENING" >nul 2>nul && goto site_ocupado
del "%LOG_SITE%" 2>nul
del "%LOG_LINK%" 2>nul
echo [..] Iniciando o site local...
start "" /b cmd /c "npm run preview -- --host 127.0.0.1 --port %PORTA% --strictPort > "%LOG_SITE%" 2>&1"

set /a ESPERA=0
:espera_site
netstat -ano | findstr /r /c:":%PORTA% .*LISTENING" >nul 2>nul && goto site_ok
set /a ESPERA+=1
if !ESPERA! GEQ 40 goto site_falhou
ping -n 2 127.0.0.1 >nul
goto espera_site

:site_ocupado
echo [ERRO] A porta %PORTA% ja esta em uso. Feche a outra janela do Mirai e rode de novo.
goto fim_erro

:site_falhou
echo [ERRO] O site local nao subiu. O registro fica em %LOG_SITE%
goto fim_erro

:site_ok
echo [OK] Site local no ar: http://127.0.0.1:%PORTA%

rem ---- 6. Link publico da Cloudflare, em segundo plano ----
echo [..] Criando o link publico da Cloudflare. Pode levar alguns segundos...
start "" /b cmd /c "cloudflared tunnel --url http://127.0.0.1:%PORTA% > "%LOG_LINK%" 2>&1"

set /a ESPERA=0
:espera_link
call :extrai_link
if defined LINK goto link_ok
set /a ESPERA+=1
if !ESPERA! GEQ 60 goto link_falhou
ping -n 2 127.0.0.1 >nul
goto espera_link

:link_falhou
echo [ERRO] Nao consegui criar o link da Cloudflare. Confira a internet e rode de novo.
echo        O registro fica em %LOG_LINK%
goto fim_erro

:link_ok
cls
echo.
echo ==========================================================
echo   PRONTO. Copie o link abaixo e mande para seus amigos:
echo ==========================================================
echo.
echo %LINK%
echo.
echo ==========================================================
<nul set /p "=%LINK%" | clip
echo   O link ja foi copiado. Basta colar com Ctrl+V.
echo.
echo   Site so no seu PC: http://127.0.0.1:%PORTA%
echo   Para encerrar tudo, feche esta janela.
echo ==========================================================

rem Mantem a janela aberta enquanto o site e o link estao no ar.
:mantem
ping -n 60 127.0.0.1 >nul
goto mantem

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

rem ---- Sub-rotina: le o registro do tunel (mesmo com o arquivo aberto) e guarda so o endereco em LINK ----
:extrai_link
set "LINK="
for /f "usebackq delims=" %%u in (`powershell -NoProfile -Command "$f=[IO.File]::Open('%LOG_LINK%','Open','Read','ReadWrite'); $r=New-Object IO.StreamReader($f); $t=$r.ReadToEnd(); $r.Close(); [regex]::Match($t,'https://[a-z0-9-]+\.trycloudflare\.com').Value" 2^>nul`) do set "LINK=%%u"
exit /b 0
