const pool = require('../db/connection');

class Order {
  static async create(orderData) {
    const { userId, items, totalAmount } = orderData;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, total_amount, status, created_at)
         VALUES ($1, $2, 'PENDING', CURRENT_TIMESTAMP)
         RETURNING *`,
        [userId, totalAmount]
      );
      
      const order = orderResult.rows[0];

      // Create order items
      const orderItems = [];
      for (const item of items) {
        const itemResult = await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [order.id, item.productId, item.quantity, item.price]
        );
        orderItems.push(itemResult.rows[0]);
      }

      await client.query('COMMIT');
      return { ...order, items: orderItems };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT o.*, 
              json_agg(
                json_build_object(
                  'id', oi.id,
                  'productId', oi.product_id,
                  'quantity', oi.quantity,
                  'price', oi.price
                )
              ) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  static async findAll(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM orders 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }
}

module.exports = Order;

