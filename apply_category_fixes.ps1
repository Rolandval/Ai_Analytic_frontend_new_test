# PowerShell script to fix category generation in Generation.tsx

$file = "D:\Нова папка\Ai_Analytic_frontend\src\pages\ai-product-filler\Generation.tsx"
$content = Get-Content $file -Raw

# Fix 1: Update mass generate button loader display (line ~2384)
$content = $content -replace '\{massGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />\}', '{(activeTab === ''categories'' ? categoryGeneration.categoryMassGenerating : massGenerating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}'

# Fix 2: Update mass generate button progress display (line ~2385)
$content = $content -replace '\{t\(''buttons\.mass_generate''\)\}\{massGenerating && massProgress \? ` \(\$\{massProgress\}\)` : ''''\}', '{t(''buttons.mass_generate'')}{activeTab === ''categories'' ? (categoryGeneration.categoryMassGenerating && categoryGeneration.categoryMassProgress ? ` (${categoryGeneration.categoryMassProgress})` : '''') : (massGenerating && massProgress ? ` (${massProgress})` : '''')}'

# Fix 3: Update generate selected button progress display (line ~2481)
$oldPattern = ': `\$\{t\(''buttons\.generate_selected''\)\}\$\{selectedProgress \? ` \(\$\{selectedProgress\}\)` : ''''\}`\}'
$newPattern = ': `${t(''buttons.generate_selected'')}${activeTab === ''categories'' ? (categoryGeneration.categorySelectedProgress ? ` (${categoryGeneration.categorySelectedProgress})` : '''') : (selectedProgress ? ` (${selectedProgress})` : '''')}`}'
$content = $content -replace $oldPattern, $newPattern

# Save the updated content
Set-Content -Path $file -Value $content -NoNewline

Write-Host "Category generation fixes applied successfully!" -ForegroundColor Green
Write-Host "Changes made:" -ForegroundColor Yellow
Write-Host "1. Mass generate button now supports categories" -ForegroundColor Cyan
Write-Host "2. Generate selected button now supports categories" -ForegroundColor Cyan
Write-Host "3. Progress indicators updated for both modes" -ForegroundColor Cyan
