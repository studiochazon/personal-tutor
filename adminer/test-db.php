<?php
echo "<h2>Database Connection Test</h2>";

$host = 'localhost';
$user = 'root';
$password = '12345678';
$database = 'personal_tutor_ai';

echo "<p><strong>Testing connection to:</strong></p>";
echo "<ul>";
echo "<li>Host: $host</li>";
echo "<li>User: $user</li>";
echo "<li>Database: $database</li>";
echo "</ul>";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<p style='color: green;'>✅ Database connection successful!</p>";
    
    // Test a simple query
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM courses");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<p>📊 Found <strong>{$result['count']}</strong> courses in database</p>";
    
    // Show available tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<p><strong>Available tables:</strong></p>";
    echo "<ul>";
    foreach ($tables as $table) {
        echo "<li>$table</li>";
    }
    echo "</ul>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>❌ Connection failed: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><a href='adminer.php'>→ Go to Adminer</a></p>";
?> 