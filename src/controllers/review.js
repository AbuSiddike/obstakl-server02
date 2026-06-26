const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

// Add review for a property (Tenant only)
const addReview = async (req, res, next) => {
  try {
    const { propertyId, rating, comment } = req.body;

    if (!propertyId || !ObjectId.isValid(propertyId)) {
      return sendError(res, 400, 'Invalid property ID');
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return sendError(res, 400, 'Rating must be a number between 1 and 5');
    }

    if (!comment || comment.trim() === '') {
      return sendError(res, 400, 'Comment is required');
    }

    const db = getDB();
    const reviewsCollection = db.collection('reviews');
    const propertiesCollection = db.collection('properties');
    const usersCollection = db.collection('user');

    // Check if property exists
    const property = await propertiesCollection.findOne({
      _id: new ObjectId(propertyId),
    });
    if (!property) {
      return sendError(res, 404, 'Property not found');
    }

    // Get tenant info
    const tenantUser = await usersCollection.findOne({
      _id: new ObjectId(req.user.id),
    });
    if (!tenantUser) {
      return sendError(res, 404, 'Tenant user not found');
    }

    const newReview = {
      propertyId: new ObjectId(propertyId),
      rating: ratingNum,
      comment,
      tenant: {
        id: tenantUser._id.toString(),
        name: tenantUser.name,
        email: tenantUser.email,
        photo: tenantUser.photo,
      },
      createdAt: new Date(),
    };

    const result = await reviewsCollection.insertOne(newReview);
    newReview._id = result.insertedId.toString();

    return sendSuccess(res, 201, 'Review added successfully', newReview);
  } catch (error) {
    next(error);
  }
};

// Get reviews for a specific property (Public)
const getPropertyReviews = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    if (!ObjectId.isValid(propertyId)) {
      return sendError(res, 400, 'Invalid property ID');
    }

    const db = getDB();
    const reviewsCollection = db.collection('reviews');

    const reviews = await reviewsCollection
      .find({ propertyId: new ObjectId(propertyId) })
      .sort({ createdAt: -1 })
      .toArray();

    return sendSuccess(
      res,
      200,
      'Property reviews fetched successfully',
      reviews
    );
  } catch (error) {
    next(error);
  }
};

// Delete review (Tenant who created it or Admin)
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return sendError(res, 400, 'Invalid review ID');
    }

    const db = getDB();
    const reviewsCollection = db.collection('reviews');

    const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });
    if (!review) {
      return sendError(res, 404, 'Review not found');
    }

    if (review.tenant.id !== req.user.id && req.user.role !== 'Admin') {
      return sendError(
        res,
        403,
        'Forbidden: You do not have permission to delete this review'
      );
    }

    await reviewsCollection.deleteOne({ _id: new ObjectId(id) });

    return sendSuccess(res, 200, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Get reviews written by the currently logged-in tenant
const getMyReviews = async (req, res, next) => {
  try {
    const db = getDB();
    const reviewsCollection = db.collection('reviews');
    const propertiesCollection = db.collection('properties');

    const reviews = await reviewsCollection
      .find({ 'tenant.id': req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    // Populate property details (title) if not already present on review object
    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        if (!review.property && review.propertyId) {
          const property = await propertiesCollection.findOne({
            _id: new ObjectId(review.propertyId),
          });
          return {
            ...review,
            property: property ? { title: property.title } : null,
          };
        }
        return review;
      })
    );

    return sendSuccess(
      res,
      200,
      'My reviews fetched successfully',
      populatedReviews
    );
  } catch (error) {
    next(error);
  }
};

// Get all reviews (Public)
const getAllReviews = async (req, res, next) => {
  try {
    const db = getDB();
    const reviewsCollection = db.collection('reviews');
    const propertiesCollection = db.collection('properties');

    const reviews = await reviewsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    const populatedReviews = await Promise.all(
      reviews.map(async (review) => {
        let location = 'Verified Tenant';
        if (review.propertyId) {
          const property = await propertiesCollection.findOne({
            _id: new ObjectId(review.propertyId),
          });
          if (property && property.location) {
            location = property.location;
          }
        }
        return {
          ...review,
          location,
        };
      })
    );

    return sendSuccess(
      res,
      200,
      'All reviews fetched successfully',
      populatedReviews
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addReview,
  getPropertyReviews,
  deleteReview,
  getMyReviews,
  getAllReviews,
};
