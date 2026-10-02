# Run locally; API key is prompted invisibly and never written to disk.
param([string[]]$Models = @('gemini-3.8-flash', 'gemini-3.5-flash-lite'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
foreach ($model in $Models) {
    if ($model -notmatch '^[a-zA-Z0-9._-]+$') { throw 'Invalid model code' }
}
$secureKey = Read-Host 'Enter the same Gemini API key configured in Supabase (hidden)' -AsSecureString
$plainKey = [Net.NetworkCredential]::new('', $secureKey).Password
if ([string]::IsNullOrWhiteSpace($plainKey)) { throw 'API key is required' }
$client = [Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds(60)
$results = @()
try {
    foreach ($model in $Models) {
        foreach ($mode in @('text', 'structured')) {
            $config = @{ maxOutputTokens = 1024 }
            $prompt = 'Reply with only OK.'
            if ($mode -eq 'structured') {
                $prompt = 'Return a JSON object with ok set to true.'
                $config.responseMimeType = 'application/json'
                $config.responseJsonSchema = @{ type = 'object'; properties = @{ ok = @{ type = 'boolean' } }; required = @('ok'); additionalProperties = $false }
            }
            $payload = @{ contents = @(@{ role = 'user'; parts = @(@{ text = $prompt }) }); generationConfig = $config } | ConvertTo-Json -Depth 12 -Compress
            $request = [Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::Post, "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent")
            $null = $request.Headers.TryAddWithoutValidation('x-goog-api-key', $plainKey)
            $request.Content = [Net.Http.StringContent]::new($payload, [Text.Encoding]::UTF8, 'application/json')
            $response = $null
            try {
                $response = $client.SendAsync($request).GetAwaiter().GetResult()
                $body = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json
                $detail = ''
                if ($body.error) { $detail = [string]$body.error.message }
                elseif ($body.candidates) { $detail = 'finishReason=' + $body.candidates[0].finishReason }
                else { $detail = 'No candidate returned' }
                $results += [pscustomobject]@{ Model = $model; Probe = $mode; HTTP = [int]$response.StatusCode; Detail = $detail.Replace($plainKey, '[REDACTED]') }
            } catch {
                # Do not print exception objects: these can contain request details.
                $results += [pscustomobject]@{ Model = $model; Probe = $mode; HTTP = 'NETWORK'; Detail = 'Connection failed or exceeded the 60-second deadline' }
            } finally {
                if ($response) { $response.Dispose() }
                $request.Dispose()
            }
        }
    }
} finally {
    $client.Dispose()
    $plainKey = $null
    $secureKey.Dispose()
}
$results | Format-Table -AutoSize -Wrap
Write-Host 'This probe does not change Supabase configuration or publish a quiz.'
