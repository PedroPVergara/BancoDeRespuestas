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

# Limpiar temp previo
if (Test-Path $temp) { Remove-Item -Path $temp -Recurse -Force }
New-Item -ItemType Directory -Path $temp -Force | Out-Null

# Copiar estructura completa al temp excluyendo .git, docs, dist, *.zip
Write-Host ('Copiando a ' + $temp + '...') -ForegroundColor Cyan
Get-ChildItem -Path $src -Force | Where-Object {
  $_.Name -notin @('.git', 'docs', 'dist', 'build.ps1') -and $_.Extension -ne '.zip'
} | ForEach-Object {
  Copy-Item -Path $_.FullName -Destination $temp -Recurse -Force
}

# Generar zip manteniendo la estructura de carpetas
Write-Host ('Generando ' + $zipOut + '...') -ForegroundColor Cyan
Compress-Archive -Path (Join-Path $temp '*') -DestinationPath $zipOut -Force

# Limpiar temp
Remove-Item -Path $temp -Recurse -Force

$sizeKB = [math]::Round((Get-Item $zipOut).Length / 1KB, 1)
Write-Host ''
Write-Host ('✅ Listo: ' + $zipOut) -ForegroundColor Green
Write-Host ('📦 Tamaño: ' + $sizeKB + ' KB')
Write-Host ''
Write-Host 'Subilo a: https://github.com/PedroPVergara/BancoDeRespuestas/releases/new'