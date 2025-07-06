const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

function determineUnit(category) {
  const unitMap = {
    'Seeds': 'kg',
    'Fertilizers': 'kg',
    'Pesticides / Herbicides': 'l',
    'Tools / Equipments': 'units',
    'Machinery': 'units',
    'Livestock': 'heads',
    'Irrigation': 'units',
    'Vegetables / Fruits ': 'units',
    'Dairy / Eggs': 'units',
    'Meat / Poultry': 'kg',
    'Other': 'units'
  };
  return unitMap[category] || 'units';
}

exports.determineUnit = determineUnit;

exports.createInventory = async (req, res) => {
  try {
    const { name, category, quantity, unit, threshold, description, price } = req.body;
    const farmer_id = req.user.userId; // Get farmer_id from authenticated user
    
    // First create the product
    const product_id = await Product.createProduct({ 
      name,
      description,
      category,
      price: price || 0, // Default price for inventory items
      stock_quantity: quantity,
      farmer_id
    });

    

    // Then create inventory record
    const inventory = await Inventory.create({ 
      product_id, 
      quantity: Number(quantity),
      location: 'Default',
      threshold: Number(threshold || 10),
      unit: unit || determineUnit(category),
      description,
      price: price || 0
    });

    res.status(201).json({
      ...inventory,
      name,
      category,
      unit: unit || determineUnit(category),
      description
    });
    
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ 
      message: 'Failed to create inventory',
      error: error.message
    });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findAll();
    const inventoryWithUnits = inventory.map(item => ({
      ...item,
      unit: determineUnit(item.category)
    }));
    res.json(inventoryWithUnits);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Failed to fetch inventory' });
  }
};

exports.getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.inventory_id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    res.json({
      ...inventory,
      unit: determineUnit(inventory.category)
    });
  } catch (error) {
    console.error('Get inventory by id error:', error);
    res.status(500).json({ message: 'Failed to fetch inventory' });
  }
};

exports.updateInventory = async (req, res) => {
  try {
    const { name,category, quantity, threshold, unit, description,price } = req.body;
    const inventoryId = req.params.inventory_id;

    // Get existing inventory to maintain product_id
    const existingInventory = await Inventory.findById(inventoryId);
    if (!existingInventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    // Update inventory
    const updatedInventory = await Inventory.update(inventoryId, {
      product_id: existingInventory.product_id,
      quantity: Number(quantity || existingInventory.quantity),
      threshold: Number(threshold || existingInventory.threshold),
      //location: location || existingInventory.location,
      unit: unit || existingInventory.unit,              // Add unit
      description: description || existingInventory.description,
      price: price || existingInventory.price
    });

    await Product.updateProduct(existingInventory.product_id, {
      name: name || existingInventory.name, // Keep existing name
      description: description || existingInventory.description, // Sync description
      category: category || existingInventory.category,
      price: price || existingInventory.price, // Keep existing price
      stock_quantity: Number(quantity || existingInventory.quantity) // Sync quantity
    });
    

    res.json(updatedInventory);
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ 
      message: 'Failed to update inventory',
      error: error.message
    });
  }
};

exports.deleteInventory = async (req, res) => {
  try {
    const inventoryId = req.params.inventory_id;
    
    // First get the inventory to find associated product
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    // Delete the inventory record
    await Inventory.delete(inventoryId);
    
    // Delete the associated product
    await Product.deleteProduct(inventory.product_id);

    res.json({ message: 'Inventory deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ 
      message: 'Failed to delete inventory',
      error: error.message
    });
  }
};

exports.getInventoryByProduct = async (req, res) => {
  try {
    const inventory = await Inventory.findByProductId(req.params.product_id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found for this product' });
    }
    res.json(inventory);
  } catch (error) {
    console.error('Get inventory by product error:', error);
    res.status(500).json({ message: 'Failed to fetch inventory' });
  }
};

