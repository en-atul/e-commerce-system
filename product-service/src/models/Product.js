const pool = require('../db/connection');

class Product {
  static async create(productData) {
    const { name, description, price, stock, category, imageUrl } = productData;
    
    const result = await pool.query(
      `INSERT INTO products (name, description, price, stock, category, image_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, description, price, stock, category, imageUrl]
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.category) {
      query += ` AND category = $${paramCount++}`;
      params.push(filters.category);
    }

    if (filters.minPrice) {
      query += ` AND price >= $${paramCount++}`;
      params.push(filters.minPrice);
    }

    if (filters.maxPrice) {
      query += ` AND price <= $${paramCount++}`;
      params.push(filters.maxPrice);
    }

    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        query += ` AND stock > 0`;
      } else {
        query += ` AND stock = 0`;
      }
    }

    query += ' ORDER BY created_at DESC';
    
    if (filters.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount++}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.price !== undefined) {
      fields.push(`price = $${paramCount++}`);
      values.push(updates.price);
    }
    if (updates.stock !== undefined) {
      fields.push(`stock = $${paramCount++}`);
      values.push(updates.stock);
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${paramCount++}`);
      values.push(updates.category);
    }
    if (updates.imageUrl !== undefined) {
      fields.push(`image_url = $${paramCount++}`);
      values.push(updates.imageUrl);
    }

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async updateStock(id, quantity) {
    const result = await pool.query(
      `UPDATE products SET stock = stock + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );
    return result.rows[0];
  }

  static async reserveStock(id, quantity) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const product = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [id]);
      
      if (!product.rows[0]) {
        throw new Error('Product not found');
      }

      if (product.rows[0].stock < quantity) {
        throw new Error('Insufficient stock');
      }

      const result = await client.query(
        `UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [quantity, id]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  }
}

module.exports = Product;

