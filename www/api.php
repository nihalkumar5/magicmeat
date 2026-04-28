<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Database Configuration
$host = "srv2210.hstgr.io";
$user = "u583553206_admin";
$pass = "NihalKumar@555";
$db   = "u583553206_magicmeat";
$admin_user = "admin";
$admin_pass = "NihalKumar@555";
$admin_token = "magicmeat-admin-token";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = $_GET['path'] ?? '';

// Helper to get request body
function getBody() {
    return json_decode(file_get_contents("php://input"), true);
}

// Auth Helper
function isAdmin() {
    global $admin_token;
    $headers = apache_request_headers();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    return $auth === "Bearer $admin_token";
}

// ROUTING
if ($method === 'GET' && $path === 'store') {
    $res = $conn->query("SELECT * FROM products");
    $products = $res->fetch_all(MYSQLI_ASSOC);
    $categories = [
        ["id" => "chicken", "name" => "Chicken"],
        ["id" => "mutton", "name" => "Mutton"],
        ["id" => "fish", "name" => "Fish"],
        ["id" => "eggs", "name" => "Eggs"],
        ["id" => "grocery", "name" => "Grocery"]
    ];
    echo json_encode(["categories" => $categories, "products" => $products, "featuredOffers" => []]);
}

elseif ($method === 'GET' && $path === 'orders') {
    $phone = $_GET['phone'] ?? '';
    if (!$phone) { echo json_encode([]); exit; }
    $stmt = $conn->prepare("SELECT * FROM orders WHERE phone = ? ORDER BY createdAt DESC");
    $stmt->bind_param("s", $phone);
    $stmt->execute();
    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
}

elseif ($method === 'POST' && $path === 'orders') {
    $data = getBody();
    $orderId = "ord-" . time();
    $items = json_encode($data['items']);
    $stmt = $conn->prepare("INSERT INTO orders (id, customerName, phone, address, total, items, status) VALUES (?, ?, ?, ?, ?, ?, 'placed')");
    $stmt->bind_param("ssssss", $orderId, $data['customerName'], $data['phone'], $data['address'], $data['total'], $items);
    if ($stmt->execute()) {
        echo json_encode(["id" => $orderId, "total" => $data['total']]);
    } else {
        echo json_encode(["error" => "Order failed"]);
    }
}

elseif ($method === 'POST' && $path === 'admin/login') {
    $data = getBody();
    if ($data['username'] === $admin_user && $data['password'] === $admin_pass) {
        echo json_encode(["token" => $admin_token]);
    } else {
        http_response_code(401);
        echo json_encode(["error" => "Invalid credentials"]);
    }
}

// ADMIN PROTECTED ROUTES
elseif (strpos($path, 'admin/') === 0) {
    if (!isAdmin()) {
        http_response_code(401);
        echo json_encode(["error" => "Unauthorized"]);
        exit;
    }

    if ($method === 'GET' && $path === 'admin/dashboard') {
        $orders = $conn->query("SELECT * FROM orders ORDER BY createdAt DESC")->fetch_all(MYSQLI_ASSOC);
        $products = $conn->query("SELECT * FROM products")->fetch_all(MYSQLI_ASSOC);
        $rev = $conn->query("SELECT SUM(total) as r FROM orders WHERE status='delivered'")->fetch_assoc()['r'] ?? 0;
        echo json_encode([
            "stats" => ["orders" => count($orders), "products" => count($products), "revenue" => (float)$rev],
            "categories" => [["id"=>"chicken","name"=>"Chicken"],["id"=>"mutton","name"=>"Mutton"]],
            "products" => $products,
            "orders" => $orders
        ]);
    }

    elseif ($method === 'POST' && $path === 'admin/upload') {
        if (!isset($_FILES['image'])) { echo json_encode(["error" => "No file"]); exit; }
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        $fileName = time() . '_' . basename($_FILES['image']['name']);
        $targetPath = $uploadDir . $fileName;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
            echo json_encode(["url" => "api/" . $targetPath]);
        } else {
            echo json_encode(["error" => "Upload failed"]);
        }
    }

    elseif ($method === 'POST' && $path === 'admin/products') {
        $p = getBody();
        $id = "p-" . uniqid();
        $stmt = $conn->prepare("INSERT INTO products (id, name, category, price, unit, emoji, image, stock, description, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssssdss", $id, $p['name'], $p['category'], $p['price'], $p['unit'], $p['emoji'], $p['image'], $p['stock'], $p['description'], $p['rating']);
        $stmt->execute();
        echo json_encode(["id" => $id]);
    }

    elseif ($method === 'PUT' && strpos($path, 'admin/products/') === 0) {
        $id = str_replace('admin/products/', '', $path);
        $p = getBody();
        $stmt = $conn->prepare("UPDATE products SET name=?, category=?, price=?, unit=?, emoji=?, image=?, stock=?, description=?, rating=? WHERE id=?");
        $stmt->bind_param("ssssssisss", $p['name'], $p['category'], $p['price'], $p['unit'], $p['emoji'], $p['image'], $p['stock'], $p['description'], $p['rating'], $id);
        $stmt->execute();
        echo json_encode(["ok" => true]);
    }

    elseif ($method === 'PATCH' && strpos($path, 'admin/products/') === 0) {
        $id = str_replace('admin/products/', '', $path);
        $p = getBody();
        $sets = []; $types = ""; $values = [];
        foreach($p as $k => $v) { $sets[] = "$k=?"; $types .= is_numeric($v) ? (is_int($v) ? 'i' : 'd') : 's'; $values[] = $v; }
        $types .= 's'; $values[] = $id;
        $stmt = $conn->prepare("UPDATE products SET ".implode(', ', $sets)." WHERE id=?");
        $stmt->bind_param($types, ...$values);
        $stmt->execute();
        echo json_encode(["ok" => true]);
    }

    elseif ($method === 'DELETE' && strpos($path, 'admin/products/') === 0) {
        $id = str_replace('admin/products/', '', $path);
        $stmt = $conn->prepare("DELETE FROM products WHERE id=?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        echo json_encode(["ok" => true]);
    }

    elseif ($method === 'PATCH' && strpos($path, 'admin/orders/') === 0) {
        $id = str_replace('admin/orders/', '', $path);
        $p = getBody();
        $stmt = $conn->prepare("UPDATE orders SET status=? WHERE id=?");
        $stmt->bind_param("ss", $p['status'], $id);
        $stmt->execute();
        echo json_encode(["ok" => true]);
    }
}
else {
    http_response_code(404);
    echo json_encode(["error" => "Route not found", "path" => $path]);
}
