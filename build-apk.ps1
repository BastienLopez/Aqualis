#!/usr/bin/env pwsh
# build-apk.ps1 — génère l'APK debug Aqualis en une seule commande
# Usage : .\build-apk.ps1
# Depuis la racine du projet aquarium_apk

Set-Location $PSScriptRoot

# ——— Environnement —————————————————————————————
$JAVA_HOME_PATH   = "C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot"
$env:JAVA_HOME    = $JAVA_HOME_PATH
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path         = "$JAVA_HOME_PATH\bin;" + $env:Path

# Vérifie les prérequis
if (-not (Test-Path $JAVA_HOME_PATH)) {
    Write-Host "ERREUR : Java 21 introuvable dans $JAVA_HOME_PATH" -ForegroundColor Red
    Write-Host "  Exécute : winget install --id EclipseAdoptium.Temurin.21.JDK --accept-source-agreements --accept-package-agreements --silent"
    exit 1
}
if (-not (Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe")) {
    Write-Host "ERREUR : Android SDK introuvable dans $env:ANDROID_HOME" -ForegroundColor Red
    Write-Host "  Vérifie ANDROID_HOME ou réinstalle Android Studio"
    exit 1
}

$ErrorActionPreference = "Stop"
$startTime = Get-Date

function Step($n, $label) {
    Write-Host ""
    Write-Host "=== $n/3  $label ===" -ForegroundColor Cyan
}

try {
    # — 1. Build Vite ——————————————————————————————
    Step 1 "Build Vite (mode capacitor)"
    npm run build:capacitor
    if ($LASTEXITCODE -ne 0) { throw "npm run build:capacitor a échoué (exit $LASTEXITCODE)." }

    # — 2. Sync Capacitor —————————————————————————————
    Step 2 "Sync Capacitor → Android"
    npx cap sync android
    if ($LASTEXITCODE -ne 0) { throw "npx cap sync android a échoué (exit $LASTEXITCODE)." }

    # — 3. Gradle build —————————————————————————————
    Step 3 "Gradle assembleDebug"
    Push-Location android
    .\gradlew.bat assembleDebug
    $gradleExit = $LASTEXITCODE
    Pop-Location
    if ($gradleExit -ne 0) { throw "Gradle assembleDebug a échoué (exit $gradleExit)." }

    # — Résultat ———————————————————————————————
    $apkDir  = "android\app\build\outputs\apk\debug"
    $apkFile = Get-ChildItem $apkDir -Filter "aqualis-*.apk" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $apkFile) { throw "APK introuvable dans $apkDir après le build." }

    $size    = [math]::Round($apkFile.Length / 1MB, 1)
    $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
    $dest    = "aqualis-debug.apk"  # copie à la racine pour accès facile
    Copy-Item $apkFile.FullName -Destination $dest -Force

    Write-Host ""
    Write-Host " APK prêt en ${elapsed}s" -ForegroundColor Green
    Write-Host "   Nom    : $($apkFile.Name)" -ForegroundColor Green
    Write-Host "   Taille : ${size} MB" -ForegroundColor Green
    Write-Host "   Chemin : $($apkFile.FullName)" -ForegroundColor Green
    Write-Host "   Racine : $(Resolve-Path $dest)" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Transfère 'aqualis-debug.apk' sur ton téléphone et installe-le."
    Write-Host "  (active 'Sources inconnues' dans Paramètres > Sécurité si besoin)"

} catch {
    Write-Host ""
    Write-Host "BUILD ECHOUE : $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "=== Pistes de debug ===" -ForegroundColor Yellow
    Write-Host "  java -version          (doit afficher 21.x)"
    Write-Host "  npx cap --version      (doit afficher 7.x)"
    Write-Host "  adb --version          (doit répondre)"
    Write-Host "  cd android ; .\gradlew.bat dependencies  (détaille les erreurs Gradle)"
    exit 1
}
