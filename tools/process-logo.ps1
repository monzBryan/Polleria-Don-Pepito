Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$srcPath = Join-Path $root 'logo-don-pepito.png'
$outDir = Join-Path $root 'public\brand'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

if (-not (Test-Path -LiteralPath $srcPath)) {
    throw "No se encontró el logo original en $srcPath"
}

$source = [System.Drawing.Bitmap]::FromFile((Resolve-Path $srcPath))
$width = $source.Width
$height = $source.Height

function New-RecoloredBitmap {
    param(
        [System.Drawing.Bitmap]$Source,
        [System.Drawing.Color]$TargetColor
    )

    $w = $Source.Width
    $h = $Source.Height
    $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h

    $srcData = $Source.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $stride = $srcData.Stride
    $srcBytes = New-Object byte[] ($stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $srcBytes, 0, $srcBytes.Length)
    $Source.UnlockBits($srcData)

    $out = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $outData = $out.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $outStride = $outData.Stride
    $outBytes = New-Object byte[] ($outStride * $h)

    for ($y = 0; $y -lt $h; $y++) {
        $row = $y * $stride
        $orow = $y * $outStride
        for ($x = 0; $x -lt $w; $x++) {
            $i = $row + ($x * 4)
            $b = $srcBytes[$i]
            $g = $srcBytes[$i + 1]
            $r = $srcBytes[$i + 2]

            $max = [Math]::Max($r, [Math]::Max($g, $b))
            $min = [Math]::Min($r, [Math]::Min($g, $b))
            $sat = $max - $min
            $alpha = [int]([Math]::Min(255, $sat * 3))

            if ($max -gt 248 -and $sat -lt 8) { $alpha = 0 }
            if ($alpha -lt 10) { $alpha = 0 }

            $oi = $orow + ($x * 4)
            $outBytes[$oi] = $TargetColor.B
            $outBytes[$oi + 1] = $TargetColor.G
            $outBytes[$oi + 2] = $TargetColor.R
            $outBytes[$oi + 3] = $alpha
        }
    }

    [System.Runtime.InteropServices.Marshal]::Copy($outBytes, 0, $outData.Scan0, $outBytes.Length)
    $out.UnlockBits($outData)
    return $out
}

function Get-ContentBounds {
    param([System.Drawing.Bitmap]$Bitmap)

    $w = $Bitmap.Width
    $h = $Bitmap.Height
    $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
    $data = $Bitmap.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $stride = $data.Stride
    $bytes = New-Object byte[] ($stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
    $Bitmap.UnlockBits($data)

    $minX = $w
    $minY = $h
    $maxX = -1
    $maxY = -1

    for ($y = 0; $y -lt $h; $y++) {
        $row = $y * $stride
        for ($x = 0; $x -lt $w; $x++) {
            $alpha = $bytes[$row + ($x * 4) + 3]
            if ($alpha -gt 12) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($maxX -lt 0) {
        return New-Object System.Drawing.Rectangle 0, 0, $w, $h
    }

    return New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
}

function Crop-WithPadding {
    param(
        [System.Drawing.Bitmap]$Bitmap,
        [int]$Padding = 24
    )

    $bounds = Get-ContentBounds -Bitmap $Bitmap
    $x = [Math]::Max(0, $bounds.X - $Padding)
    $y = [Math]::Max(0, $bounds.Y - $Padding)
    $right = [Math]::Min($Bitmap.Width, $bounds.Right + $Padding)
    $bottom = [Math]::Min($Bitmap.Height, $bounds.Bottom + $Padding)
    $rect = New-Object System.Drawing.Rectangle $x, $y, ($right - $x), ($bottom - $y)
    return $Bitmap.Clone($rect, $Bitmap.PixelFormat)
}

$ink = [System.Drawing.Color]::FromArgb(10, 10, 11)
$red = [System.Drawing.Color]::FromArgb(200, 16, 46)
$gold = [System.Drawing.Color]::FromArgb(232, 181, 77)
$cream = [System.Drawing.Color]::FromArgb(255, 248, 238)

$transparent = New-RecoloredBitmap -Source $source -TargetColor $red
$goldBmp = New-RecoloredBitmap -Source $source -TargetColor $gold
$creamBmp = New-RecoloredBitmap -Source $source -TargetColor $cream

$transparentCropped = Crop-WithPadding -Bitmap $transparent
$goldCropped = Crop-WithPadding -Bitmap $goldBmp
$creamCropped = Crop-WithPadding -Bitmap $creamBmp

$transparentCropped.Save((Join-Path $outDir 'logo-transparent.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$goldCropped.Save((Join-Path $outDir 'logo-gold.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$creamCropped.Save((Join-Path $outDir 'logo-cream.png'), [System.Drawing.Imaging.ImageFormat]::Png)

function New-IconBitmap {
    param([int]$Size)

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.Clear($ink)

    $goldBrush = New-Object System.Drawing.SolidBrush $gold
    $inkBrush = New-Object System.Drawing.SolidBrush $ink
    $creamBrush = New-Object System.Drawing.SolidBrush $cream

    $ring = [int]($Size * 0.06)
    $g.FillEllipse($goldBrush, $ring, $ring, ($Size - 2 * $ring), ($Size - 2 * $ring))
    $inner = [int]($Size * 0.11)
    $g.FillEllipse($inkBrush, $inner, $inner, ($Size - 2 * $inner), ($Size - 2 * $inner))

    $fontSize = [int]($Size * 0.40)
    $font = New-Object System.Drawing.Font 'Georgia', $fontSize, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF 0, 0, $Size, $Size
    $g.DrawString('DP', $font, $creamBrush, $rect, $format)

    $font.Dispose()
    $format.Dispose()
    $goldBrush.Dispose()
    $inkBrush.Dispose()
    $creamBrush.Dispose()
    $g.Dispose()
    return $bmp
}

$icon180 = New-IconBitmap -Size 180
$icon64 = New-IconBitmap -Size 64
$icon180.Save((Join-Path $outDir 'favicon-180.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$icon64.Save((Join-Path $outDir 'favicon-64.png'), [System.Drawing.Imaging.ImageFormat]::Png)

$iconHandle = $icon64.GetHicon()
$ico = [System.Drawing.Icon]::FromHandle($iconHandle)
$icoStream = [System.IO.File]::Create((Join-Path $root 'public\favicon.ico'))
$ico.Save($icoStream)
$icoStream.Close()
$ico.Dispose()

$og = New-Object System.Drawing.Bitmap 1200, 630, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$ogGraphics = [System.Drawing.Graphics]::FromImage($og)
$ogGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$ogGraphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$ogGraphics.Clear($ink)

$ogGoldBrush = New-Object System.Drawing.SolidBrush $gold
$ogCreamBrush = New-Object System.Drawing.SolidBrush $cream
$ogGlowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(35, 232, 181, 77))
$ogGraphics.FillEllipse($ogGlowBrush, 760, -150, 620, 620)
$ogGraphics.FillEllipse($ogGlowBrush, -180, 390, 520, 520)

$logoMaxW = 520
$logoMaxH = 360
$scale = [Math]::Min($logoMaxW / $goldCropped.Width, $logoMaxH / $goldCropped.Height)
$logoW = [int]($goldCropped.Width * $scale)
$logoH = [int]($goldCropped.Height * $scale)
$ogGraphics.DrawImage($goldCropped, 70, [int]((630 - $logoH) / 2), $logoW, $logoH)

$titleFont = New-Object System.Drawing.Font 'Georgia', 40, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
$subFont = New-Object System.Drawing.Font 'Arial', 22, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$ogGraphics.DrawString('El sabor que', $titleFont, $ogCreamBrush, 660, 188)
$ogGraphics.DrawString('reúne a todos.', $titleFont, $ogCreamBrush, 660, 236)
$ogGraphics.DrawString('Pollería artesanal en Ica', $subFont, $ogGoldBrush, 664, 318)
$ogGraphics.DrawString('Delivery · Puntos · Pedidos online', $subFont, $ogCreamBrush, 664, 356)

$titleFont.Dispose()
$subFont.Dispose()
$ogGoldBrush.Dispose()
$ogCreamBrush.Dispose()
$ogGlowBrush.Dispose()
$ogGraphics.Dispose()
$og.Save((Join-Path $outDir 'og-image.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)

$source.Dispose()
$transparent.Dispose()
$goldBmp.Dispose()
$creamBmp.Dispose()
$transparentCropped.Dispose()
$goldCropped.Dispose()
$creamCropped.Dispose()
$icon180.Dispose()
$icon64.Dispose()
$og.Dispose()

Get-ChildItem $outDir | Select-Object Name, Length
