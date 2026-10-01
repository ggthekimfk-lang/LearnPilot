Add-Type -AssemblyName System.Drawing
$iconOutput = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../public'))
foreach ($size in @(192, 512)) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#143d32'))
    $pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#dcedb1'), ($size * 0.065))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawLine($pen, ($size * 0.30), ($size * 0.70), ($size * 0.68), ($size * 0.32))
    $graphics.DrawLine($pen, ($size * 0.43), ($size * 0.32), ($size * 0.68), ($size * 0.32))
    $graphics.DrawLine($pen, ($size * 0.68), ($size * 0.32), ($size * 0.68), ($size * 0.57))
    $bitmap.Save((Join-Path $iconOutput "icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    if ($size -eq 512) { $bitmap.Save((Join-Path $iconOutput 'icon-maskable.png'), [System.Drawing.Imaging.ImageFormat]::Png) }
    $pen.Dispose()
    $graphics.Dispose()
    $bitmap.Dispose()
}
