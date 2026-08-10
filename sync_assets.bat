@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ============================================================
echo  Sync pet-pwa web files into android-webview/assets
echo  (auto strips ?v=N version query for offline WebView)
echo ============================================================

if not exist android-webview\app\src\main\assets mkdir android-webview\app\src\main\assets

copy /Y app.js android-webview\app\src\main\assets\app.js >nul
if errorlevel 1 (echo [FAIL] copy app.js & goto :end)

copy /Y styles.css android-webview\app\src\main\assets\styles.css >nul
if errorlevel 1 (echo [FAIL] copy styles.css & goto :end)

powershell -NoProfile -Command "(Get-Content -Raw -Encoding UTF8 index.html) -replace '\?v=\d+','' | Set-Content -NoNewline -Encoding UTF8 android-webview\app\src\main\assets\index.html"
if errorlevel 1 (echo [FAIL] strip ?v= from index.html & goto :end)

echo [OK] Synced index.html / app.js / styles.css (version query removed)

echo.
set /p ANS=Commit and push to GitHub to rebuild offline APK? (Y/N): 
if /i "%ANS%"=="Y" (
  git add android-webview\app\src\main\assets\
  git commit -m "sync web assets for offline APK"
  git push
  echo [DONE] Pushed. Go to GitHub Actions -^> download child-pet-offline-apk.
) else (
  echo [SKIP] Files synced locally only. Run 'git push' yourself when ready.
)

:end
pause
