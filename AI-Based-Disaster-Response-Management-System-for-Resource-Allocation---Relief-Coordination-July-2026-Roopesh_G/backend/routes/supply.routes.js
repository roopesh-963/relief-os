const express = require('express');
const router = express.Router();
const {
  getShipments,
  createShipment,
  updateShipment,
  deleteShipment,
  getWarehouses,
  getGlobalMapData,
  getSupplyAnalytics,
  rerouteShipment,
} = require('../controllers/supply.controller');
const { protect, protectOrAllowDemo, authorize } = require('../middleware/auth.middleware');

router.get('/shipments', protectOrAllowDemo('admin', 'rescue_team'), getShipments);
router.get('/warehouses', protectOrAllowDemo('admin', 'rescue_team'), getWarehouses);
router.get('/global-map', protectOrAllowDemo('admin', 'rescue_team'), getGlobalMapData);
router.get('/analytics', protectOrAllowDemo('admin', 'rescue_team'), getSupplyAnalytics);
router.post('/shipments', protect, authorize('admin', 'rescue_team'), createShipment);
router.put('/shipments/:id', protect, authorize('admin', 'rescue_team'), updateShipment);
router.delete('/shipments/:id', protect, authorize('admin'), deleteShipment);
router.post('/reroute', protect, authorize('admin', 'rescue_team'), rerouteShipment);

// Backwards-compatible aliases for the older supply page/client.
router.get('/', protectOrAllowDemo('admin', 'rescue_team'), getShipments);
router.post('/', protect, authorize('admin', 'rescue_team'), createShipment);
router.patch('/:id', protect, authorize('admin', 'rescue_team'), updateShipment);

module.exports = router;
