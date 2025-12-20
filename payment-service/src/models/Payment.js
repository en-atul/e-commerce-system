const pool = require('../db/connection');

class Payment {
  static async create(paymentData) {
    const { orderId, userId, amount, paymentMethod, status = 'PENDING' } = paymentData;
    
    const result = await pool.query(
      `INSERT INTO payments (order_id, user_id, amount, payment_method, status, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [orderId, userId, amount, paymentMethod, status]
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByOrderId(orderId) {
    const result = await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM payments 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }
}

module.exports = Payment;

