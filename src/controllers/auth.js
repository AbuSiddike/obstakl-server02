const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const { sendSuccess, sendError } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { name, email, photo, password, role } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 400, 'Name, email, and password are required');
    }

    const db = getDB();
    const usersCollection = db.collection('user');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase(),
    });
    if (existingUser) {
      return sendError(res, 400, 'User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Validate role
    const validRoles = ['Tenant', 'Owner', 'Admin'];
    const userRole = role && validRoles.includes(role) ? role : 'Tenant';

    const newUser = {
      name,
      email: email.toLowerCase(),
      photo: photo || '',
      password: hashedPassword,
      role: userRole,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: result.insertedId.toString(),
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const userResponse = {
      id: result.insertedId.toString(),
      name: newUser.name,
      email: newUser.email,
      photo: newUser.photo,
      role: newUser.role,
    };

    return sendSuccess(res, 201, 'User registered successfully', {
      user: userResponse,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required');
    }

    const db = getDB();
    const usersCollection = db.collection('user');

    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, 401, 'Invalid email or password');
    }

    if (!user.password) {
      return sendError(
        res,
        400,
        'This account is set up with social login. Please log in using Google'
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      photo: user.photo,
      role: user.role,
    };

    return sendSuccess(res, 200, 'Login successful', {
      user: userResponse,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const socialLogin = async (req, res, next) => {
  try {
    const { name, email, photo } = req.body;

    if (!email || !name) {
      return sendError(res, 400, 'Email and name are required');
    }

    const db = getDB();
    const usersCollection = db.collection('user');

    let user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      const newUser = {
        name,
        email: email.toLowerCase(),
        photo: photo || '',
        role: 'Tenant', // Default role for social logins is Tenant
        createdAt: new Date(),
      };
      const result = await usersCollection.insertOne(newUser);
      user = {
        _id: result.insertedId,
        ...newUser,
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      photo: user.photo,
      role: user.role,
    };

    return sendSuccess(res, 200, 'Social login successful', {
      user: userResponse,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const db = getDB();
    const usersCollection = db.collection('user');

    const user = await usersCollection.findOne({
      _id: new ObjectId(req.user.id),
    });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      photo: user.photo,
      role: user.role,
    };

    return sendSuccess(res, 200, 'User profile fetched successfully', {
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  socialLogin,
  getMe,
  logout,
};
