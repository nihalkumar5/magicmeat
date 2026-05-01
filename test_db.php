<?php
$conn = new mysqli("srv2210.hstgr.io", "u583553206_nihal", "NihalKumar@555", "u583553206_magicmeatnew");

if ($conn->connect_error) {
    die("❌ Connection Failed: " . $conn->connect_error);
}

$res = $conn->query("SELECT COUNT(*) as total FROM products");
$row = $res->fetch_assoc();

echo "✅ Connected Successfully!<br>";
echo "📦 Total Products in DB: " . $row['total'];
?>
