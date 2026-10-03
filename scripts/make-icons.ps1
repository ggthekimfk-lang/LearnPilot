Add-Type -AssemblyName System.Drawing
$iconOutput = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../public'))
$source = [Drawing.Image]::FromFile((Join-Path $iconOutput 'brand-mark.png'))
try {
    foreach ($asset in @(@{ Name='icon-192.png'; Size=192; Scale=0.86 }, @{ Name='icon-512.png'; Size=512; Scale=0.86 }, @{ Name='icon-maskable.png'; Size=512; Scale=0.60 }, @{ Name='favicon.png'; Size=64; Scale=0.94 }, @{ Name='brand-mark-small.png'; Size=192; Scale=1.0 })) {
        $bitmap = New-Object Drawing.Bitmap($asset.Size, $asset.Size)
        $graphics = [Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.Clear($(if ($asset.Name -eq 'brand-mark-small.png') { [Drawing.Color]::Transparent } else { [Drawing.ColorTranslator]::FromHtml('#eaf4ef') }))
            $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $edge = [int]($asset.Size * $asset.Scale)
            $offset = [int](($asset.Size - $edge) / 2)
            $graphics.DrawImage($source, $offset, $offset, $edge, $edge)
            $bitmap.Save((Join-Path $iconOutput $asset.Name), [Drawing.Imaging.ImageFormat]::Png)
        } finally { $graphics.Dispose(); $bitmap.Dispose() }
    }
} finally { $source.Dispose() }
