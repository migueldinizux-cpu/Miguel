# Compila o Aquário Pixel: gera o ícone, copia as DLLs do WebView2 e chama o csc do .NET Framework.
$ErrorActionPreference = 'Stop'
$src  = $PSScriptRoot
$root = Split-Path $src -Parent
Add-Type -AssemblyName System.Drawing

# 1) DLLs do WebView2 (reaproveitadas do Office instalado; o SDK permite redistribuir)
$sdk = "C:\Program Files\Microsoft Office\root\Office16\ADDINS\Microsoft Power Query for Excel Integrated\bin"
foreach ($d in 'Microsoft.Web.WebView2.Core.dll', 'Microsoft.Web.WebView2.WinForms.dll', 'WebView2Loader.dll') {
  if (-not (Test-Path "$root\$d")) { Copy-Item "$sdk\$d" "$root\$d" }
}

# 2) Ícone: peixe-palhaço 16x16 ampliado sem suavização (PNG dentro do .ico)
$art = @(
  '..llllllllllll..',
  '.lllllllllllllll',
  'llllllhlllllhlll',
  'bbbbbbbKKKbbbbbb',
  'bbbbbbKOOOKbbbbb',
  'bKKbbKOWWOOKKbbb',
  'bKOKKOWWOOWOOKbb',
  'bKOOOOWWOOWOEOKb',
  'bKOOOOWWOOWOOOKb',
  'bKOKKOWWOOWOOKbb',
  'bKKbbKOWWOOKKbbb',
  'bbbbbbKOOOKbbbbb',
  'ddddddbKKKdddddd',
  'dddddddddddddddd',
  '.dddddddddddddd.',
  '..dddddddddddd..'
)
$pal = @{ 'l' = '#2d8ac0'; 'b' = '#1d6aa0'; 'd' = '#12467a'; 'h' = '#e8fcff'; 'K' = '#1f1a2a'; 'O' = '#ff7a1a'; 'W' = '#f7f7fb'; 'E' = '#0a0a12' }
$base = New-Object System.Drawing.Bitmap 16, 16
for ($y = 0; $y -lt 16; $y++) { for ($x = 0; $x -lt 16; $x++) {
  $ch = [string]$art[$y][$x]
  if ($pal.ContainsKey($ch)) { $base.SetPixel($x, $y, [System.Drawing.ColorTranslator]::FromHtml($pal[$ch])) } else { $base.SetPixel($x, $y, [System.Drawing.Color]::Transparent) }
} }
$sizes = 16, 32, 48, 256
$pngs = @()
foreach ($s in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp); $g.InterpolationMode = 'NearestNeighbor'; $g.PixelOffsetMode = 'Half'
  $g.DrawImage($base, 0, 0, $s, $s); $g.Dispose()
  $ms = New-Object System.IO.MemoryStream; $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); $pngs += , $ms.ToArray(); $bmp.Dispose()
}
$ico = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter $ico
$bw.Write([UInt16]0); $bw.Write([UInt16]1); $bw.Write([UInt16]$sizes.Count)
$offset = 6 + 16 * $sizes.Count
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $s = $sizes[$i]; $dim = if ($s -ge 256) { 0 } else { $s }
  $bw.Write([byte]$dim); $bw.Write([byte]$dim); $bw.Write([byte]0); $bw.Write([byte]0)
  $bw.Write([UInt16]1); $bw.Write([UInt16]32); $bw.Write([UInt32]$pngs[$i].Length); $bw.Write([UInt32]$offset)
  $offset += $pngs[$i].Length
}
foreach ($p in $pngs) { $bw.Write($p) }
$bw.Flush(); [IO.File]::WriteAllBytes("$src\app.ico", $ico.ToArray()); $bw.Dispose(); $base.Dispose()

# 3) Compilação
$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
& $csc /nologo /target:winexe /platform:x64 /optimize+ /codepage:65001 `
  "/win32icon:$src\app.ico" `
  "/r:$root\Microsoft.Web.WebView2.Core.dll" "/r:$root\Microsoft.Web.WebView2.WinForms.dll" `
  /r:System.Windows.Forms.dll /r:System.Drawing.dll `
  "/out:$root\AquarioPixel.exe" "$src\AquarioPixel.cs"
if ($LASTEXITCODE -ne 0) { throw "falha na compilação" }
Write-Host "OK -> $root\AquarioPixel.exe"
