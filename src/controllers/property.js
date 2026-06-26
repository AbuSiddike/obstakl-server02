const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

// Add new property (Owner only)
const addProperty = async (req, res, next) => {
  try {
    const {
      title,
      description,
      location,
      propertyType,
      rent,
      rentType,
      bedrooms,
      bathrooms,
      propertySize,
      amenities,
      images,
      extraFeatures,
    } = req.body;

    if (
      !title ||
      !description ||
      !location ||
      !propertyType ||
      !rent ||
      !rentType
    ) {
      return sendError(
        res,
        400,
        'Missing required fields for property creation'
      );
    }

    const db = getDB();
    const usersCollection = db.collection('user');
    const propertiesCollection = db.collection('properties');

    // Get owner details
    const ownerUser = await usersCollection.findOne({
      _id: new ObjectId(req.user.id),
    });
    if (!ownerUser) {
      return sendError(res, 404, 'Owner user not found');
    }

    const newProperty = {
      title,
      description,
      location,
      propertyType,
      rent: Number(rent),
      rentType,
      bedrooms: bedrooms ? Number(bedrooms) : 0,
      bathrooms: bathrooms ? Number(bathrooms) : 0,
      propertySize: propertySize ? Number(propertySize) : 0,
      amenities: Array.isArray(amenities) ? amenities : [],
      images: Array.isArray(images) ? images : [],
      extraFeatures: extraFeatures || {},
      status: 'Pending', // initial status
      rejectionFeedback: '',
      owner: {
        id: ownerUser._id.toString(),
        name: ownerUser.name,
        email: ownerUser.email,
        photo: ownerUser.photo,
      },
      createdAt: new Date(),
    };

    const result = await propertiesCollection.insertOne(newProperty);
    newProperty._id = result.insertedId.toString();

    return sendSuccess(
      res,
      201,
      'Property listed successfully and is pending approval',
      newProperty
    );
  } catch (error) {
    next(error);
  }
};

// Get all approved properties (Public with filter, search, sort, pagination)
const getProperties = async (req, res, next) => {
  try {
    const {
      search,
      location,
      propertyType,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 9,
    } = req.query;

    const db = getDB();
    const propertiesCollection = db.collection('properties');

    const query = { status: 'Approved' };

    // Search by Location
    const locationSearch = search || location;
    if (locationSearch) {
      query.location = { $regex: locationSearch, $options: 'i' };
    }

    // Filter by Property Type
    if (propertyType) {
      query.propertyType = propertyType;
    }

    // Filter by Rent range
    if (minPrice || maxPrice) {
      query.rent = {};
      if (minPrice) query.rent.$gte = Number(minPrice);
      if (maxPrice) query.rent.$lte = Number(maxPrice);
    }

    // Sorting
    let sortQuery = { createdAt: -1 }; // default sorting: newest first
    if (sort) {
      if (sort === 'priceAsc' || sort === 'rentAsc' || sort === 'lowToHigh') {
        sortQuery = { rent: 1 };
      } else if (
        sort === 'priceDesc' ||
        sort === 'rentDesc' ||
        sort === 'highToLow'
      ) {
        sortQuery = { rent: -1 };
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const total = await propertiesCollection.countDocuments(query);
    const properties = await propertiesCollection
      .find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const totalPages = Math.ceil(total / limitNum);

    return sendSuccess(
      res,
      200,
      'Properties fetched successfully',
      properties,
      {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      }
    );
  } catch (error) {
    next(error);
  }
};

// Get featured properties (limit 6 approved)
const getFeaturedProperties = async (req, res, next) => {
  try {
    const db = getDB();
    const propertiesCollection = db.collection('properties');

    const properties = await propertiesCollection
      .find({ status: 'Approved' })
      .limit(6)
      .toArray();

    return sendSuccess(
      res,
      200,
      'Featured properties fetched successfully',
      properties
    );
  } catch (error) {
    next(error);
  }
};

// Get a specific property (Private Route / verified user only)
const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid property ID');
    }

    const db = getDB();
    const propertiesCollection = db.collection('properties');

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!property) {
      return sendError(res, 404, 'Property not found');
    }

    return sendSuccess(res, 200, 'Property fetched successfully', property);
  } catch (error) {
    next(error);
  }
};

// Get my listed properties (Owner only)
const getMyListings = async (req, res, next) => {
  try {
    const db = getDB();
    const propertiesCollection = db.collection('properties');

    const listings = await propertiesCollection
      .find({ 'owner.id': req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    return sendSuccess(
      res,
      200,
      'My properties fetched successfully',
      listings
    );
  } catch (error) {
    next(error);
  }
};

// Update property (Owner or Admin)
const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid property ID');
    }

    const db = getDB();
    const propertiesCollection = db.collection('properties');

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!property) {
      return sendError(res, 404, 'Property not found');
    }

    // Check if the user is the owner or an admin
    if (property.owner.id !== req.user.id && req.user.role !== 'Admin') {
      return sendError(
        res,
        403,
        'Forbidden: You do not have permission to update this property'
      );
    }

    const updates = {};
    const allowedFields = [
      'title',
      'description',
      'location',
      'propertyType',
      'rent',
      'rentType',
      'bedrooms',
      'bathrooms',
      'propertySize',
      'amenities',
      'images',
      'extraFeatures',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (
          field === 'rent' ||
          field === 'bedrooms' ||
          field === 'bathrooms' ||
          field === 'propertySize'
        ) {
          updates[field] = Number(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    // If owner updates, reset status to Pending and clear rejection feedback
    if (req.user.role === 'Owner') {
      updates.status = 'Pending';
      updates.rejectionFeedback = '';
    }

    await propertiesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    const updatedProperty = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });

    return sendSuccess(
      res,
      200,
      'Property updated successfully',
      updatedProperty
    );
  } catch (error) {
    next(error);
  }
};

// Delete property (Owner or Admin)
const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid property ID');
    }

    const db = getDB();
    const propertiesCollection = db.collection('properties');

    const property = await propertiesCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!property) {
      return sendError(res, 404, 'Property not found');
    }

    // Check permissions
    if (property.owner.id !== req.user.id && req.user.role !== 'Admin') {
      return sendError(
        res,
        403,
        'Forbidden: You do not have permission to delete this property'
      );
    }

    await propertiesCollection.deleteOne({ _id: new ObjectId(id) });

    return sendSuccess(res, 200, 'Property deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addProperty,
  getProperties,
  getFeaturedProperties,
  getPropertyById,
  getMyListings,
  updateProperty,
  deleteProperty,
};
