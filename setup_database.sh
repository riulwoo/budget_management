#!/bin/bash
# Budget Management System - Database Setup Script
# 전체 데이터베이스 초기화 및 설치

echo "=== Budget Management System Database Setup ==="
echo "Starting database initialization..."

# 환경 변수 체크
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo "Error: Database environment variables not set"
    echo "Please set DB_HOST, DB_USER, DB_PASSWORD"
    exit 1
fi

# MariaDB/MySQL 연결 테스트
echo "Testing database connection..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Error: Cannot connect to database"
    exit 1
fi

echo "Database connection successful!"

# 1. 데이터베이스 생성
echo "Step 1: Creating database..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "
CREATE DATABASE IF NOT EXISTS budget_management 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;"

if [ $? -eq 0 ]; then
    echo "✓ Database created successfully"
else
    echo "✗ Failed to create database"
    exit 1
fi

# 2. 스키마 생성
echo "Step 2: Creating tables and schema..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" budget_management < database_schema.sql

if [ $? -eq 0 ]; then
    echo "✓ Schema created successfully"
else
    echo "✗ Failed to create schema"
    exit 1
fi

# 3. 샘플 데이터 삽입 (선택사항)
read -p "Do you want to insert sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Step 3: Inserting sample data..."
    mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" budget_management < sample_data.sql
    
    if [ $? -eq 0 ]; then
        echo "✓ Sample data inserted successfully"
    else
        echo "✗ Failed to insert sample data"
        exit 1
    fi
else
    echo "Step 3: Skipping sample data insertion"
fi

# 4. 권한 설정 (필요한 경우)
echo "Step 4: Setting up database permissions..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "
GRANT ALL PRIVILEGES ON budget_management.* TO '$DB_USER'@'%';
FLUSH PRIVILEGES;"

if [ $? -eq 0 ]; then
    echo "✓ Permissions set successfully"
else
    echo "⚠ Warning: Could not set permissions (may not have sufficient privileges)"
fi

# 5. 테이블 상태 확인
echo "Step 5: Verifying installation..."
echo "Checking tables..."

TABLES=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" budget_management -e "SHOW TABLES;" -N)
echo "Created tables: $TABLES"

# 테이블 개수 확인
TABLE_COUNT=$(echo "$TABLES" | wc -l)
if [ $TABLE_COUNT -ge 4 ]; then
    echo "✓ All required tables created"
else
    echo "✗ Some tables may be missing"
fi

# 카테고리 기본 데이터 확인
CATEGORY_COUNT=$(mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" budget_management -e "SELECT COUNT(*) FROM categories WHERE user_id IS NULL;" -N)
echo "Default categories: $CATEGORY_COUNT"

if [ $CATEGORY_COUNT -gt 0 ]; then
    echo "✓ Default categories loaded"
else
    echo "✗ Default categories missing"
fi

echo ""
echo "=== Database Setup Complete ==="
echo "Database: budget_management"
echo "Host: $DB_HOST"
echo "User: $DB_USER"
echo ""
echo "Next steps:"
echo "1. Update your .env file with database configuration"
echo "2. Start your Node.js application"
echo "3. Test the application functionality"
echo ""
echo "For testing, you can use the following sample users:"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "- Username: admin, Password: (set your own)"
    echo "- Username: testuser, Password: (set your own)"
    echo "- Username: demo, Password: (set your own)"
fi