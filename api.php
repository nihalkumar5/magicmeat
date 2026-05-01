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
$user = "u583553206_nihal";
$pass = "NihalKumar@555";
$db   = "u583553206_magicmeatnew";
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

// Auto-create offers table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS offers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tag VARCHAR(50),
    title VARCHAR(100),
    subtext VARCHAR(255),
    code VARCHAR(50),
    color VARCHAR(20),
    emoji VARCHAR(10),
    image VARCHAR(255)
)");

// Auto-create testimonials table
$conn->query("CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    text TEXT,
    rating INT DEFAULT 5
)");

// Auto-create settings table
$conn->query("CREATE TABLE IF NOT EXISTS settings (
    k VARCHAR(50) PRIMARY KEY,
    v TEXT
)");

// Seed default settings if not exists
$conn->query("INSERT IGNORE INTO settings (k, v) VALUES ('phone_number', '+919876543210')");
$conn->query("INSERT IGNORE INTO settings (k, v) VALUES ('marquee_text', '⚡ FLASH SALE: FLAT ₹100 OFF ON ORDERS ABOVE ₹599! ⚡ | 🚀 25 MINUTE FRESH DELIVERY GUARANTEED! 🚀')");

// ROUTING
if ($method === 'GET' && $path === 'store') {
    $res = $conn->query("SELECT * FROM products");
    $products = $res->fetch_all(MYSQLI_ASSOC);
    
    $catRes = $conn->query("SELECT * FROM categories");
    $categories = $catRes->fetch_all(MYSQLI_ASSOC);
    
    $offerRes = $conn->query("SELECT * FROM offers");
    $offers = $offerRes->fetch_all(MYSQLI_ASSOC);

    $testiRes = $conn->query("SELECT * FROM testimonials");
    $testimonials = $testiRes->fetch_all(MYSQLI_ASSOC);
    
    // If empty, return defaults
    if (empty($categories)) {
        $categories = [
            ["id" => "chicken", "name" => "Chicken"],
            ["id" => "mutton", "name" => "Mutton"],
            ["id" => "fish", "name" => "Fish"]
        ];
    }
    
    $settingRes = $conn->query("SELECT * FROM settings");
    $settings = [];
    while($row = $settingRes->fetch_assoc()) {
        $settings[$row['k']] = $row['v'];
    }
    
    echo json_encode([
        "categories" => $categories, 
        "products" => $products, 
        "featuredOffers" => $offers,
        "testimonials" => $testimonials,
        "settings" => $settings
    ]);
    exit;
}

if ($method === 'POST' && $path === 'admin/settings') {
    if (!isAdmin()) {
        echo json_encode(["error" => "Unauthorized"]);
        exit;
    }
    $body = getBody();
    $key = $body['k'] ?? '';
    $val = $body['v'] ?? '';
    
    if ($key) {
        $stmt = $conn->prepare("INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = ?");
        $stmt->bind_param("sss", $key, $val, $val);
        $stmt->execute();
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["error" => "Key missing"]);
    }
    exit;
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
    $items = is_string($data['items']) ? $data['items'] : json_encode($data['items']);
    $pm = $data['paymentMethod'] ?? 'COD';
    $pid = $data['paymentId'] ?? '';
    
    // Attempt to insert with payment fields. If columns don't exist, it will fallback.
    $stmt = $conn->prepare("INSERT INTO orders (id, customerName, phone, address, total, items, status, paymentMethod, paymentId) VALUES (?, ?, ?, ?, ?, ?, 'placed', ?, ?)");
    if ($stmt) {
        $stmt->bind_param("ssssssss", $orderId, $data['customerName'], $data['phone'], $data['address'], $data['total'], $items, $pm, $pid);
        if ($stmt->execute()) {
            echo json_encode(["id" => $orderId, "total" => $data['total']]);
        } else {
            echo json_encode(["error" => "Order failed: " . $conn->error]);
        }
    } else {
        // Fallback for old schema
        $stmt = $conn->prepare("INSERT INTO orders (id, customerName, phone, address, total, items, status) VALUES (?, ?, ?, ?, ?, ?, 'placed')");
        $stmt->bind_param("ssssss", $orderId, $data['customerName'], $data['phone'], $data['address'], $data['total'], $items);
        if ($stmt->execute()) {
            echo json_encode(["id" => $orderId, "total" => $data['total']]);
        } else {
            echo json_encode(["error" => "Order failed"]);
        }
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
        $categories = $conn->query("SELECT * FROM categories")->fetch_all(MYSQLI_ASSOC);
        $offers = $conn->query("SELECT * FROM offers")->fetch_all(MYSQLI_ASSOC);
        $testimonials = $conn->query("SELECT * FROM testimonials")->fetch_all(MYSQLI_ASSOC);
        $rev = $conn->query("SELECT SUM(total) as r FROM orders WHERE status='delivered'")->fetch_assoc()['r'] ?? 0;
        echo json_encode([
            "stats" => ["orders" => count($orders), "products" => count($products), "revenue" => (float)$rev],
            "categories" => $categories,
            "products" => $products,
            "orders" => $orders,
            "offers" => $offers,
            "testimonials" => $testimonials
        ]);
    }

    elseif ($method === 'POST' && $path === 'admin/categories') {
        $data = getBody();
        $id = strtolower(str_replace(' ', '-', $data['name']));
        $stmt = $conn->prepare("INSERT INTO categories (id, name, icon) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $id, $data['name'], $data['icon']);
        $stmt->execute();
        echo json_encode(["id" => $id]);
    }

    elseif ($method === 'POST' && $path === 'admin/offers') {
        $data = getBody();
        $stmt = $conn->prepare("INSERT INTO offers (tag, title, subtext, code, color, emoji, image) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssss", $data['tag'], $data['title'], $data['subtext'], $data['code'], $data['color'], $data['emoji'], $data['image']);
        $stmt->execute();
        echo json_encode(["ok" => true]);
    }

    elseif ($method === 'PUT' && strpos($path, 'admin/offers/') === 0) {
        $id = str_replace('admin/offers/', '', $path);
        $data = getBody();
        $stmt = $conn->prepare("UPDATE offers SET tag=?, title=?, subtext=?, code=?, color=?, emoji=?, image=? WHERE id=?");
        $stmt->bind_param("sssssssi", $data['tag'], $data['title'], $data['subtext'], $data['code'], $data['color'], $data['emoji'], $data['image'], $id);
        $stmt->execute();
        echo json_encode(["ok" => true]);
    }

    elseif ($method === 'POST' && $path === 'admin/testimonials') {
        $data = getBody();
        $stmt = $conn->prepare("INSERT INTO testimonials (name, text, rating) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $data['name'], $data['text'], $data['rating']);
        $stmt->execute();
        echo json_encode(["ok" => true]);
    }

    elseif ($method === 'DELETE' && strpos($path, 'admin/testimonials/') === 0) {
        $id = str_replace('admin/testimonials/', '', $path);
        $stmt = $conn->prepare("DELETE FROM testimonials WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        echo json_encode(["ok" => true]);
    }

    elseif ($method === 'DELETE' && strpos($path, 'admin/offers/') === 0) {
        $id = str_replace('admin/offers/', '', $path);
        $stmt = $conn->prepare("DELETE FROM offers WHERE id=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        echo json_encode(["ok" => true]);
    }

    elseif ($method === 'DELETE' && strpos($path, 'admin/categories/') === 0) {
        $id = str_replace('admin/categories/', '', $path);
        $stmt = $conn->prepare("DELETE FROM categories WHERE id=?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        echo json_encode(["ok" => true]);
    }

    elseif ($method === 'POST' && $path === 'admin/upload') {
        if (!isset($_FILES['image'])) { echo json_encode(["error" => "No file"]); exit; }
        $uploadDir = 'uploads/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
        $fileName = time() . '_' . basename($_FILES['image']['name']);
        $targetPath = $uploadDir . $fileName;
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
            echo json_encode(["url" => $targetPath]);
        } else {
            echo json_encode(["error" => "Upload failed"]);
        }
    }

    elseif ($method === 'POST' && $path === 'admin/products') {
        $p = getBody();
        $id = "p-" . uniqid();
        $mrp = $p['mrp'] ?? $p['price'];
        $stmt = $conn->prepare("INSERT INTO products (id, name, category, price, mrp, unit, emoji, image, stock, description, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssdsssss", $id, $p['name'], $p['category'], $p['price'], $mrp, $p['unit'], $p['emoji'], $p['image'], $p['stock'], $p['description'], $p['rating']);
        $stmt->execute();
        echo json_encode(["id" => $id]);
    }

    elseif ($method === 'PUT' && strpos($path, 'admin/products/') === 0) {
        $id = str_replace('admin/products/', '', $path);
        $p = getBody();
        $mrp = $p['mrp'] ?? $p['price'];
        $stmt = $conn->prepare("UPDATE products SET name=?, category=?, price=?, mrp=?, unit=?, emoji=?, image=?, stock=?, description=?, rating=? WHERE id=?");
        $stmt->bind_param("ssssssissss", $p['name'], $p['category'], $p['price'], $mrp, $p['unit'], $p['emoji'], $p['image'], $p['stock'], $p['description'], $p['rating'], $id);
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

    elseif ($method === 'GET' && $path === 'admin/settings') {
        $res = $conn->query("SELECT * FROM settings");
        $settings = [];
        while($row = $res->fetch_assoc()) { $settings[$row['k']] = $row['v']; }
        echo json_encode($settings);
    }

    elseif ($method === 'POST' && $path === 'admin/settings') {
        $data = getBody();
        foreach($data as $k => $v) {
            $stmt = $conn->prepare("UPDATE settings SET v=? WHERE k=?");
            $stmt->bind_param("ss", $v, $k);
            $stmt->execute();
        }
        echo json_encode(["ok" => true]);
    }
}
else {
    http_response_code(404);
    echo json_encode(["error" => "Route not found", "path" => $path]);
}
