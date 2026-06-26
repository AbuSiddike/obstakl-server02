const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

// Add property to favorites (Tenant only)
const addFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.body;
    if (!propertyId || !ObjectId.isValid(propertyId)) {
      return sendError(res, 400, 'Invalid property ID');
    }

    const db = getDB();
    const favoritesCollection = db.collection('favorites');
    const propertiesCollection = db.collection('properties');

    // Verify property exists and is approved
    const property = await propertiesCollection.findOne({ _id: new ObjectId(propertyId) });
    if (!property) {
      return sendError(res, 404, 'Property not found');
    }
    if (property.status !== 'Approved') {
      return sendError(res, 400, 'Cannot add a non-approved property to favorites');
    }

    // Check if already in favorites
    const existingFavorite = await favoritesCollection.findOne({
      tenantId: req.user.id,
      propertyId: new ObjectId(propertyId)
    });

    if (existingFavorite) {
      return sendSuccess(res, 200, 'Property is already in favorites', existingFavorite);
    }

    const newFavorite = {
      tenantId: req.user.id,
      propertyId: new ObjectId(propertyId),
      createdAt: new Date()
    };

    const result = await favoritesCollection.insertOne(newFavorite);
    newFavorite._id = result.insertedId.toString();

    return sendSuccess(res, 201, 'Property added to favorites', newFavorite);
  } catch (error) {
    next(error);
  }
};

// Remove property from favorites (Tenant only)
const removeFavorite = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    if (!propertyId || !ObjectId.isValid(propertyId)) {
      return sendError(res, 400, 'Invalid property ID');
    }

    const db = getDB();
    const favoritesCollection = db.collection('favorites');

    const result = await favoritesCollection.deleteOne({
      tenantId: req.user.id,
      propertyId: new ObjectId(propertyId)
    });

    if (result.deletedCount === 0) {
      return sendError(res, 404, 'Property not found in favorites');
    }

    return sendSuccess(res, 200, 'Property removed from favorites');
  } catch (error) {
    next(error);
  }
};

// Get all favorites for current tenant (Tenant only)
const getFavorites = async (req, res, next) => {
  try {
    const db = getDB();
    const favoritesCollection = db.collection('favorites');

    // Aggregate to fetch properties details
    const favorites = await favoritesCollection.aggregate([
      { $match: { tenantId: req.user.id } },
      {
        $lookup: {
          from: 'properties',
          localField: 'propertyId',
          foreignField: '_id',
          as: 'property'
        }
      },
      { $unwind: '$property' },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    return sendSuccess(res, 200, 'Favorites fetched successfully', favorites);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getFavorites
};
