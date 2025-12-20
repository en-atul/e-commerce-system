const Product = require('../models/Product');
const { publishEvent } = require('../kafka/producer');

const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, imageUrl } = req.body;

    if (!name || !description || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Name, description, price, and stock are required' });
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category: category || 'GENERAL',
      imageUrl: imageUrl || null
    });

    await publishEvent('product-created', {
      productId: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const listProducts = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
      inStock: req.query.inStock === 'true' ? true : req.query.inStock === 'false' ? false : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    const products = await Product.findAll(filters);
    res.json(products);
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.update(id, updates);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await publishEvent('product-updated', {
      productId: product.id,
      updates
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.delete(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await publishEvent('product-deleted', {
      productId: id
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Internal API for order service
const reserveStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Product ID and valid quantity are required' });
    }

    const product = await Product.reserveStock(productId, quantity);
    res.json(product);
  } catch (error) {
    console.error('Reserve stock error:', error);
    if (error.message === 'Product not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Insufficient stock') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const releaseStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Product ID and valid quantity are required' });
    }

    const product = await Product.updateStock(productId, quantity);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Release stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
  deleteProduct,
  reserveStock,
  releaseStock
};

