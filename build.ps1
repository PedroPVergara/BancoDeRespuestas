#!/usr/bin/env pwsh
# build.ps1 — Genera el .zip de distribución de la extensión
# Uso: .\build.ps1 -Version "v0.2.0"

param(
  [Parameter(Mandatory=$true)][string]$Version
)

$ErrorActionPreference = "Stop"

$src     = $PSScriptRoot
$temp    = Join-Path $env:TEMP "BancoRespuestas-build-$Version"
$zipOut  = Join-Path $src "dist\BancoDeRespuestas-$Version.zip"

# Limpiar temp previo si existe
if (Test-Path $temp) { Remove-Item -Path $temp -Recurse -Force }

# Copiar estructura completa al temp (excluyendo .git, docs, dist, *.zip)
Write-Host "Copiando archivos a $temp..." -ForegroundColor Cyan
Copy-Item -Path "$src\*" -Destination $temp -Recurse -Force `
  -Exclude @(".git", "docs", "dist", "*.zip")

# Generar zip manteniendo la estructura de carpetas
Write-Host "Generando zip en $zipOut..." -ForegroundColor Cyan
Compress-Archive -Path "$temp\*" -DestinationPath $zipOut -Force

# Limpiar temp
Remove-Item -Path $temp -Recurse -Force

Write-Host ""
Write-Host "✅ Listo: $zipOut" -ForegroundColor Green
Write-Host "📦 Tamaño: $((Get-Item $zipOut).Length / 1KB.ToString('0.0')) KB"
Write-Host ""
Write-Host "Subilo a: https://github.com/PedroPVergara/BancoDeRespuestas/releases/new"