const express = require('express');
const router = express.Router();
const {
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
  deleteProduct,
  reserveStock,
  releaseStock
} = require('../controllers/productController');

// Public routes
router.get('/', listProducts);
router.get('/:id', getProduct);

// Admin routes (protected by API Gateway)
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Internal routes for order service
router.post('/reserve-stock', reserveStock);
router.post('/release-stock', releaseStock);

module.exports = router;

