import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = process.env.SQLITE_DB_PATH?.trim()
  ? process.env.SQLITE_DB_PATH.trim()
  : join(process.cwd(), "data", "orders.sqlite");

mkdirSync(dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    fulfillment_method TEXT NOT NULL DEFAULT 'retirada',
    delivery_address TEXT NOT NULL DEFAULT '',
    delivery_neighborhood TEXT NOT NULL DEFAULT '',
    delivery_reference TEXT NOT NULL DEFAULT '',
    pickup_date TEXT NOT NULL,
    pickup_time TEXT NOT NULL,
    notes TEXT,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'novo',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    line_total REAL NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );
`);

const existingColumns = db.prepare("PRAGMA table_info(orders)").all() as Array<{
  name: string;
}>;

if (!existingColumns.some((column) => column.name === "fulfillment_method")) {
  db.exec(`
    ALTER TABLE orders ADD COLUMN fulfillment_method TEXT NOT NULL DEFAULT 'retirada';
  `);
}

if (!existingColumns.some((column) => column.name === "delivery_address")) {
  db.exec(`
    ALTER TABLE orders ADD COLUMN delivery_address TEXT NOT NULL DEFAULT '';
  `);
}

if (!existingColumns.some((column) => column.name === "delivery_neighborhood")) {
  db.exec(`
    ALTER TABLE orders ADD COLUMN delivery_neighborhood TEXT NOT NULL DEFAULT '';
  `);
}

if (!existingColumns.some((column) => column.name === "delivery_reference")) {
  db.exec(`
    ALTER TABLE orders ADD COLUMN delivery_reference TEXT NOT NULL DEFAULT '';
  `);
}

export const orderStatuses = ["novo", "em preparo", "pronto", "entregue"] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type OrderItemInput = {
  productName: string;
  unitPrice: number;
  quantity: number;
};

export type OrderInput = {
  customerName: string;
  whatsapp: string;
  fulfillmentMethod: string;
  deliveryAddress: string;
  deliveryNeighborhood: string;
  deliveryReference: string;
  pickupDate: string;
  pickupTime: string;
  notes: string;
  items: OrderItemInput[];
};

export type SavedOrderItem = {
  id: number;
  orderId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type SavedOrder = {
  id: number;
  customerName: string;
  whatsapp: string;
  fulfillmentMethod: string;
  deliveryAddress: string;
  deliveryNeighborhood: string;
  deliveryReference: string;
  pickupDate: string;
  pickupTime: string;
  notes: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: SavedOrderItem[];
};

export type ProductSalesSummary = {
  productName: string;
  quantitySold: number;
  totalRevenue: number;
};

type OrderRow = {
  id: number;
  customer_name: string;
  whatsapp: string;
  fulfillment_method: string;
  delivery_address: string;
  delivery_neighborhood: string;
  delivery_reference: string;
  pickup_date: string;
  pickup_time: string;
  notes: string | null;
  total_amount: number;
  status: string;
  created_at: string;
};

type OrderItemRow = {
  id: number;
  order_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
};

type SalesSummaryRow = {
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
};

const insertOrder = db.prepare(`
  INSERT INTO orders (
    customer_name,
    whatsapp,
    fulfillment_method,
    delivery_address,
    delivery_neighborhood,
    delivery_reference,
    pickup_date,
    pickup_time,
    notes,
    total_amount
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertItem = db.prepare(`
  INSERT INTO order_items (
    order_id,
    product_name,
    unit_price,
    quantity,
    line_total
  ) VALUES (?, ?, ?, ?, ?)
`);

const updateOrderStatement = db.prepare(`
  UPDATE orders
  SET
    customer_name = ?,
    whatsapp = ?,
    fulfillment_method = ?,
    delivery_address = ?,
    delivery_neighborhood = ?,
    delivery_reference = ?,
    pickup_date = ?,
    pickup_time = ?,
    notes = ?,
    total_amount = ?
  WHERE id = ?
`);

const deleteOrderItemsStatement = db.prepare(`
  DELETE FROM order_items
  WHERE order_id = ?
`);

const deleteOrderStatement = db.prepare(`
  DELETE FROM orders
  WHERE id = ?
`);

const listOrdersStatement = db.prepare(`
  SELECT
    id,
    customer_name,
    whatsapp,
    fulfillment_method,
    delivery_address,
    delivery_neighborhood,
    delivery_reference,
    pickup_date,
    pickup_time,
    notes,
    total_amount,
    status,
    created_at
  FROM orders
  ORDER BY datetime(created_at) DESC, id DESC
`);

const listOrderItemsStatement = db.prepare(`
  SELECT
    id,
    order_id,
    product_name,
    unit_price,
    quantity,
    line_total
  FROM order_items
  WHERE order_id = ?
  ORDER BY id ASC
`);

const updateOrderStatusStatement = db.prepare(`
  UPDATE orders
  SET status = ?
  WHERE id = ?
`);

const findOrderByIdStatement = db.prepare(`
  SELECT
    id,
    customer_name,
    whatsapp,
    fulfillment_method,
    delivery_address,
    delivery_neighborhood,
    delivery_reference,
    pickup_date,
    pickup_time,
    notes,
    total_amount,
    status,
    created_at
  FROM orders
  WHERE id = ?
`);

const productSalesStatement = db.prepare(`
  SELECT
    product_name,
    SUM(quantity) AS quantity_sold,
    SUM(line_total) AS total_revenue
  FROM order_items
  GROUP BY product_name
  ORDER BY quantity_sold DESC, total_revenue DESC
`);

function calculateTotalAmount(items: OrderItemInput[]) {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}

function insertOrderItems(orderId: number, items: OrderItemInput[]) {
  for (const item of items) {
    insertItem.run(
      orderId,
      item.productName,
      item.unitPrice,
      item.quantity,
      item.unitPrice * item.quantity
    );
  }
}

function runInTransaction<T>(callback: () => T) {
  db.exec("BEGIN");

  try {
    const result = callback();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createOrder(input: OrderInput) {
  const totalAmount = calculateTotalAmount(input.items);

  return runInTransaction(() => {
    const result = insertOrder.run(
      input.customerName,
      input.whatsapp,
      input.fulfillmentMethod,
      input.deliveryAddress,
      input.deliveryNeighborhood,
      input.deliveryReference,
      input.pickupDate,
      input.pickupTime,
      input.notes,
      totalAmount
    );

    const orderId = Number(result.lastInsertRowid);
    insertOrderItems(orderId, input.items);

    return {
      id: orderId,
      totalAmount,
    };
  });
}

function mapOrderItems(orderId: number) {
  const rows = listOrderItemsStatement.all(orderId) as OrderItemRow[];

  return rows.map((item) => ({
    id: item.id,
    orderId: item.order_id,
    productName: item.product_name,
    unitPrice: item.unit_price,
    quantity: item.quantity,
    lineTotal: item.line_total,
  }));
}

function mapOrder(row: OrderRow): SavedOrder {
  return {
    id: row.id,
    customerName: row.customer_name,
    whatsapp: row.whatsapp,
    fulfillmentMethod: row.fulfillment_method,
    deliveryAddress: row.delivery_address,
    deliveryNeighborhood: row.delivery_neighborhood,
    deliveryReference: row.delivery_reference,
    pickupDate: row.pickup_date,
    pickupTime: row.pickup_time,
    notes: row.notes ?? "",
    totalAmount: row.total_amount,
    status: row.status as OrderStatus,
    createdAt: row.created_at,
    items: mapOrderItems(row.id),
  };
}

export function listOrders() {
  const rows = listOrdersStatement.all() as OrderRow[];
  return rows.map(mapOrder);
}

export function updateOrderStatus(orderId: number, status: OrderStatus) {
  updateOrderStatusStatement.run(status, orderId);
  const row = findOrderByIdStatement.get(orderId) as OrderRow | undefined;
  return row ? mapOrder(row) : null;
}

export function updateOrder(orderId: number, input: OrderInput) {
  const totalAmount = calculateTotalAmount(input.items);

  return runInTransaction(() => {
    updateOrderStatement.run(
      input.customerName,
      input.whatsapp,
      input.fulfillmentMethod,
      input.deliveryAddress,
      input.deliveryNeighborhood,
      input.deliveryReference,
      input.pickupDate,
      input.pickupTime,
      input.notes,
      totalAmount,
      orderId
    );

    deleteOrderItemsStatement.run(orderId);
    insertOrderItems(orderId, input.items);

    const row = findOrderByIdStatement.get(orderId) as OrderRow | undefined;
    return row ? mapOrder(row) : null;
  });
}

export function deleteOrder(orderId: number) {
  runInTransaction(() => {
    deleteOrderItemsStatement.run(orderId);
    deleteOrderStatement.run(orderId);
  });
}

export function getProductSalesSummary() {
  const rows = productSalesStatement.all() as SalesSummaryRow[];

  return rows.map((row) => ({
    productName: row.product_name,
    quantitySold: row.quantity_sold,
    totalRevenue: row.total_revenue,
  })) satisfies ProductSalesSummary[];
}
