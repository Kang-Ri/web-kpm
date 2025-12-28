# Run Migration: Add idFormDaftarUlang to ParentProduct2
# Usage: .\run-migration-011.ps1

Write-Host "Running Migration 011: Add idFormDaftarUlang to ParentProduct2..." -ForegroundColor Cyan

# Configuration
$DB_HOST = "localhost"
$DB_NAME = "web_kpm"
$DB_USER = "root"
$MIGRATION_FILE = "migrations\011_add_idFormDaftarUlang_parentproduct2.sql"

# Prompt for password
$DB_PASS = Read-Host "Enter MySQL password for user '$DB_USER'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASS)
$PlainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Run migration
try {
    Write-Host "`nExecuting migration..." -ForegroundColor Yellow
    
    # Read SQL file content
    $sqlContent = Get-Content -Path $MIGRATION_FILE -Raw
    
    # Execute via mysql command
    $sqlContent | mysql -h $DB_HOST -u $DB_USER -p"$PlainPassword" $DB_NAME
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
        Write-Host "Column 'idFormDaftarUlang' added to ParentProduct2 table." -ForegroundColor Green
    } else {
        Write-Host "`n❌ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
} finally {
    # Clear password from memory
    $PlainPassword = $null
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
