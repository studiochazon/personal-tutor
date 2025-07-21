#!/bin/bash

echo "Starting Adminer on http://localhost:8081"
echo ""
echo "Available URLs:"
echo "  🔍 Test DB Connection: http://localhost:8081/test-db.php"
echo "  🗄️  Adminer Interface: http://localhost:8081/adminer.php"
echo ""
echo "Database connection details:"
echo "  System: MySQL"
echo "  Server: localhost"
echo "  Username: root"
echo "  Password: 12345678"
echo "  Database: personal_tutor_ai"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

php -S localhost:8081 