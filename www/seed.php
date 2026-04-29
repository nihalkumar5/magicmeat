<?php
require_once 'api.php';

$demo_products = [
    [
        'name' => 'Tender Chicken Curry Cut',
        'category' => 'chicken',
        'unit' => '500g',
        'price' => 179,
        'mrp' => 240,
        'stock' => 50,
        'emoji' => '🍗',
        'image' => 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=800&q=80',
        'rating' => 4.8,
        'description' => 'Freshly cut, skinless chicken perfect for your daily curry.',
        'note' => 'Antibiotic-free'
    ],
    [
        'name' => 'Royal Mutton Curry Cut',
        'category' => 'mutton',
        'unit' => '500g',
        'price' => 449,
        'mrp' => 550,
        'stock' => 20,
        'emoji' => '🥩',
        'image' => 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80',
        'rating' => 4.9,
        'description' => 'Premium quality goat meat, tender and juicy.',
        'note' => 'Farm raised'
    ],
    [
        'name' => 'Fresh Katla Fish Steaks',
        'category' => 'fish',
        'unit' => '500g',
        'price' => 289,
        'mrp' => 360,
        'stock' => 15,
        'emoji' => '🐟',
        'image' => 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
        'rating' => 4.7,
        'description' => 'River fresh Katla fish, cleaned and cut into steaks.',
        'note' => 'Freshly caught'
    ],
    [
        'name' => 'Farm Fresh Brown Eggs',
        'category' => 'eggs',
        'unit' => '6 pcs',
        'price' => 85,
        'mrp' => 110,
        'stock' => 100,
        'emoji' => '🥚',
        'image' => 'https://images.unsplash.com/photo-1518569801555-c4413c1d9db5?auto=format&fit=crop&w=800&q=80',
        'rating' => 4.9,
        'description' => 'Nutritious brown eggs from free-range hens.',
        'note' => 'High protein'
    ],
    [
        'name' => 'Pure Buffalo Ghee',
        'category' => 'dairy',
        'unit' => '500ml',
        'price' => 599,
        'mrp' => 750,
        'stock' => 30,
        'emoji' => '🧈',
        'image' => 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&w=800&q=80',
        'rating' => 4.8,
        'description' => 'Aromatic and pure buffalo ghee made using traditional methods.',
        'note' => 'No preservatives'
    ]
];

echo "Adding Demo Products...\n";

// Ensure 'dairy' category exists
$conn->query("INSERT IGNORE INTO categories (id, name, icon) VALUES ('dairy', 'Dairy & Ghee', '🧈')");
$conn->query("INSERT IGNORE INTO categories (id, name, icon) VALUES ('chicken', 'Chicken', '🍗')");
$conn->query("INSERT IGNORE INTO categories (id, name, icon) VALUES ('mutton', 'Mutton', '🥩')");
$conn->query("INSERT IGNORE INTO categories (id, name, icon) VALUES ('fish', 'Fish', '🐟')");
$conn->query("INSERT IGNORE INTO categories (id, name, icon) VALUES ('eggs', 'Eggs', '🥚')");

foreach ($demo_products as $p) {
    $stmt = $conn->prepare("INSERT INTO products (name, category, unit, price, mrp, stock, emoji, image, rating, description, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssddisssss", $p['name'], $p['category'], $p['unit'], $p['price'], $p['mrp'], $p['stock'], $p['emoji'], $p['image'], $p['rating'], $p['description'], $p['note']);
    if ($stmt->execute()) {
        echo "Added: " . $p['name'] . "\n";
    } else {
        echo "Error: " . $stmt->error . "\n";
    }
    $stmt->close();
}

echo "\nDone! You can delete this file.";
?>
