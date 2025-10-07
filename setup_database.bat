@echo off
REM Budget Management System - Database Setup Script (Windows)
REM 전체 데이터베이스 초기화 및 설치

echo === Budget Management System Database Setup ===
echo Starting database initialization...

REM 환경 변수 체크
if "%DB_HOST%"=="" (
    echo Error: DB_HOST environment variable not set
    goto :error_exit
)
if "%DB_USER%"=="" (
    echo Error: DB_USER environment variable not set
    goto :error_exit
)
if "%DB_PASSWORD%"=="" (
    echo Error: DB_PASSWORD environment variable not set
    goto :error_exit
)

REM MariaDB/MySQL 연결 테스트
echo Testing database connection...
mysql -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo Error: Cannot connect to database
    goto :error_exit
)

echo Database connection successful!

REM 1. 데이터베이스 생성
echo Step 1: Creating database...
mysql -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS budget_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if errorlevel 1 (
    echo X Failed to create database
    goto :error_exit
) else (
    echo √ Database created successfully
)

REM 2. 스키마 생성
echo Step 2: Creating tables and schema...
mysql -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% budget_management < database_schema.sql

if errorlevel 1 (
    echo X Failed to create schema
    goto :error_exit
) else (
    echo √ Schema created successfully
)

REM 3. 샘플 데이터 삽입 (선택사항)
set /p REPLY="Do you want to insert sample data? (y/N): "
if /i "%REPLY%"=="y" (
    echo Step 3: Inserting sample data...
    mysql -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% budget_management < sample_data.sql
    
    if errorlevel 1 (
        echo X Failed to insert sample data
        goto :error_exit
    ) else (
        echo √ Sample data inserted successfully
    )
) else (
    echo Step 3: Skipping sample data insertion
)

REM 4. 권한 설정 (필요한 경우)
echo Step 4: Setting up database permissions...
mysql -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% -e "GRANT ALL PRIVILEGES ON budget_management.* TO '%DB_USER%'@'%%'; FLUSH PRIVILEGES;"

if errorlevel 1 (
    echo ⚠ Warning: Could not set permissions (may not have sufficient privileges)
) else (
    echo √ Permissions set successfully
)

REM 5. 테이블 상태 확인
echo Step 5: Verifying installation...
echo Checking tables...

for /f "tokens=*" %%i in ('mysql -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% budget_management -e "SHOW TABLES;" -N') do (
    echo Created table: %%i
)

REM 카테고리 기본 데이터 확인
for /f "tokens=*" %%i in ('mysql -h%DB_HOST% -u%DB_USER% -p%DB_PASSWORD% budget_management -e "SELECT COUNT(*) FROM categories WHERE user_id IS NULL;" -N') do (
    set CATEGORY_COUNT=%%i
)

echo Default categories: %CATEGORY_COUNT%

if %CATEGORY_COUNT% gtr 0 (
    echo √ Default categories loaded
) else (
    echo X Default categories missing
)

echo.
echo === Database Setup Complete ===
echo Database: budget_management
echo Host: %DB_HOST%
echo User: %DB_USER%
echo.
echo Next steps:
echo 1. Update your .env file with database configuration
echo 2. Start your Node.js application
echo 3. Test the application functionality
echo.
echo For testing, you can use the following sample users:
if /i "%REPLY%"=="y" (
    echo - Username: admin, Password: (set your own)
    echo - Username: testuser, Password: (set your own)
    echo - Username: demo, Password: (set your own)
)

echo.
echo Press any key to exit...
pause >nul
exit /b 0

:error_exit
echo.
echo Setup failed! Please check the error messages above.
echo Make sure:
echo 1. MariaDB/MySQL is installed and running
echo 2. Environment variables are set correctly
echo 3. Database user has sufficient privileges
echo.
echo Press any key to exit...
pause >nul
exit /b 1