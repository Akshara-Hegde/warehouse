const mysql = require("mysql");
const prompt = require("prompt");

// Create a connection to the MySQL database
const db = mysql.createConnection({
  host: "localhost",
  user: "userid",
  password: "password",
  database: "inventory",
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the database!");
  startProgram();
});

// user input
prompt.message = "";
prompt.delimiter = ":";

// Start the program
function startProgram() {
  console.log("****** Warehouse Management System ******");
  prompt.start();
  prompt.get("command", (err, result) => {
    if (err) {
      console.error("Error reading command:", err);
      return;
    }
    processCommand(result.command);
  });
}

// Processing user command
function processCommand(command) {
  const parts = command.split(" ");
  const operation = `${parts[0]} ${parts[1]}`.toUpperCase();
  const args = parts.slice(1);

  switch (operation) {
    case "CREATE WAREHOUSE":
      createWarehouse(args);
      break;
    case "DELETE WAREHOUSE":
      deleteWarehouse(args);
      break;
    case "CREATE PRODUCT":
      createProduct(args);
      break;
    case "DELETE PRODUCT":
      deleteProduct(args);
      break;
    case "STOCK WAREHOUSE":
      stockWarehouse(args);
      break;
    case "UNSTOCK WAREHOUSE":
      unstockWarehouse(args);
      break;
    case "LIST PRODUCTS":
      listProducts(args);
      break;
    default:
      console.log("Invalid command!");
      startProgram();
  }
}

// Creating a new warehouse
function createWarehouse(args) {
  const name = args[1];
  const query = "INSERT INTO warehouse (name) VALUES (?)";
  db.query(query, [name], (err) => {
    if (err) {
      console.error("Error creating warehouse:", err);
    } else {
      console.log("Warehouse created successfully!");
    }
    startProgram();
  });
}

// Delete an existing warehouse
async function deleteWarehouse(args) {
  const name = args[1];
  const query1 = "select * from warehouse where name = ?";
  await db.query(query1, [name], (err, res) => {
    if (err) {
      console.log(err);
    } else {
      if (res.length == 0) {
        console.log("Warehouse Not Found!");
        startProgram();
        return;
      } else {
        const query = "DELETE FROM warehouse WHERE name = ?";
        db.query(query, [name], (err) => {
          if (err) {
            console.error("Error deleting warehouse:", err);
          } else {
            console.log("Warehouse deleted successfully!");
          }
          startProgram();
        });
      }
    }
  });
}

// Create a new product
function createProduct(args) {
  const name = args[1];
  const sku = args[2];
  const query = "INSERT INTO products (name, sku) VALUES (?, ?)";
  db.query(query, [name, sku], (err) => {
    if (err) {
      console.error("Error creating product:", err);
    } else {
      console.log("Product created successfully!");
    }
    startProgram();
  });
}
//deleting product
function deleteProduct(args) {
  const sku = args[1];
  console.log(sku);

  const deleteQuery = "DELETE FROM products WHERE sku = ?";
  db.query(deleteQuery, [sku], (err, result) => {
    if (err) {
      console.error("Error deleting product:", err);
    } else if (result.affectedRows === 0) {
      console.log("Product not found.");
    } else {
      console.log("Product deleted successfully!");
    }
    startProgram();
  });
}

//Stocking warehouse

function stockWarehouse(args) {
  const warehouseName = args[1];
  const sku = args[2];
  const quantity = parseInt(args[3]);

  // Get the warehouse ID based on the warehouse name
  const warehouseIdQuery = "SELECT id FROM warehouse WHERE name = ? LIMIT 1";
  db.query(warehouseIdQuery, [warehouseName], (err, warehouseResult) => {
    if (err) {
      console.error("Error retrieving warehouse ID:", err);
      startProgram();
      return;
    }

    if (warehouseResult.length === 0) {
      console.log("Warehouse not found.");
      startProgram();
      return;
    }
    console.log(warehouseResult)
    const warehouseId = warehouseResult[0].id;

    // Get the product ID based on the SKU
    const productIdQuery = "SELECT id FROM products WHERE sku = ? LIMIT 1";
    db.query(productIdQuery, [sku], (err, productResult) => {
      if (err) {
        console.error("Error retrieving product ID:", err);
        startProgram();
        return;
      }

      if (productResult.length === 0) {
        console.log("Product not found.");
        startProgram();
        return;
      }

      const productId = productResult[0].id;

      const getWarehouseProductQuery =
        "SELECT quantity FROM warehouse_products WHERE warehouse_id = ? AND product_id = ?";
      db.query(
        getWarehouseProductQuery,
        [warehouseId, productId],
        (err, result) => {
          if (err) {
            console.error("Error retrieving warehouse product quantity:", err);
            startProgram();
            return;
          }

          if (result.length > 0) {
            const currentQuantity = result[0].quantity;
            const updatedQuantity = currentQuantity + quantity;

            const updateQuantityQuery =
              "UPDATE warehouse_products SET quantity = ? WHERE warehouse_id = ? AND product_id = ?";
            db.query(
              updateQuantityQuery,
              [updatedQuantity, warehouseId, productId],
              (err, updateResult) => {
                if (err) {
                  console.error(
                    "Error updating warehouse product quantity:",
                    err
                  );
                } else {
                  console.log("Warehouse stocked with product successfully!");
                }
                startProgram();
              }
            );
          } else {
            const insertQuantityQuery =
              "INSERT INTO warehouse_products (warehouse_id, product_id, quantity) VALUES (?, ?, ?)";
            db.query(
              insertQuantityQuery,
              [warehouseId, productId, quantity],
              (err, insertResult) => {
                if (err) {
                  console.error("Error stocking warehouse:", err);
                } else {
                  console.log("Warehouse stocked with product successfully!");
                }
                startProgram();
              }
            );
          }
        }
      );
    });
  });
}


// Unstock a warehouse by removing a product
function unstockWarehouse(args) {
  const warehouseName = args[1];
  const sku = args[2];
  const quantity = parseInt(args[3]);

  // Get the warehouse ID based on the warehouse name
  const warehouseIdQuery = "SELECT id FROM warehouse WHERE name = ? LIMIT 1";
  db.query(warehouseIdQuery, [warehouseName], (err, warehouseResult) => {
    if (err) {
      console.error("Error retrieving warehouse ID:", err);
      startProgram();
      return;
    }

    if (warehouseResult.length === 0) {
      console.log("Warehouse not found.");
      startProgram();
      return;
    }

    const warehouseId = warehouseResult[0].id;

    // Get the product ID based on the SKU
    const productIdQuery = "SELECT id FROM products WHERE sku = ? LIMIT 1";
    db.query(productIdQuery, [sku], (err, productResult) => {
      if (err) {
        console.error("Error retrieving product ID:", err);
        startProgram();
        return;
      }

      if (productResult.length === 0) {
        console.log("Product not found.");
        startProgram();
        return;
      }

      const productId = productResult[0].id;

      // Update the quantity in the warehouse_products table
      const updateQuery =
        "UPDATE warehouse_products " +
        "SET quantity = quantity - ? " +
        "WHERE warehouse_id = ? AND product_id = ?";
      db.query(
        updateQuery,
        [quantity, warehouseId, productId],
        (err, updateResult) => {
          if (err) {
            console.error("Error unstocking warehouse:", err);
          } else if (updateResult.affectedRows === 0) {
            console.log("Product not found in the specified warehouse.");
          } else {
            console.log("Warehouse unstocked successfully!");
          }
          startProgram();
        }
      );
    });
  });
}

// List all products in a warehouse
function listProducts(args) {
  const warehouseName = args[1];
  const query =
    "SELECT p.name, p.sku, wp.quantity " +
    "FROM products p " +
    "JOIN warehouse_products wp ON p.id = wp.product_id " +
    "JOIN warehouse w ON wp.warehouse_id = w.id " +
    "WHERE w.name = ?";
  db.query(query, [warehouseName], (err, results) => {
    if (err) {
      console.error("Error listing products:", err);
    } else {
      console.log("Products in the warehouse:");
      // console.log(results)
      results.forEach((row) => {
        console.log(
          `Name: ${row.name}, SKU: ${row.sku}, Quantity: ${row.quantity}`
        );
      });
    }
    startProgram();
  });
}
