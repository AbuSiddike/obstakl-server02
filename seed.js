const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function seed() {
  try {
    await client.connect();
    const db = client.db('obstakl');
    console.log('Seeding Database Name:', db.databaseName);
    console.log('Connected to MongoDB for seeding');

    // Clean existing data
    await db.collection('user').deleteMany({});
    await db.collection('properties').deleteMany({});
    await db.collection('bookings').deleteMany({});
    await db.collection('transactions').deleteMany({});
    await db.collection('reviews').deleteMany({});
    await db.collection('favorites').deleteMany({});

    console.log('Cleared existing collections');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('adminpassword123', salt);
    const ownerPassword = await bcrypt.hash('ownerpassword123', salt);
    const tenantPassword = await bcrypt.hash('tenantpassword123', salt);

    // Create users
    const users = [
      {
        _id: new ObjectId(),
        name: 'System Admin',
        email: 'admin@obstakl.com',
        photo:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        password: adminPassword,
        role: 'Admin',
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'Alice Owner',
        email: 'owner@obstakl.com',
        photo:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
        password: ownerPassword,
        role: 'Owner',
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        name: 'Bob Tenant',
        email: 'tenant@obstakl.com',
        photo:
          'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=150&h=150&q=80',
        password: tenantPassword,
        role: 'Tenant',
        createdAt: new Date(),
      },
    ];

    await db.collection('user').insertMany(users);
    console.log('Seeded users');

    const admin = users[0];
    const owner = users[1];
    const tenant = users[2];

    // Create properties
    const properties = [
      {
        _id: new ObjectId(),
        title: 'Modern Luxury Penthouse',
        description:
          'Exquisite penthouse in the heart of downtown with breathtaking views of the city skyline. Features high-end finishes, private elevator, and a spacious wrap-around terrace.',
        location: 'Manhattan, New York',
        propertyType: 'Apartment',
        rent: 4500,
        rentType: 'Monthly',
        bedrooms: 3,
        bathrooms: 3.5,
        propertySize: 2200,
        amenities: [
          'Gym',
          'Pool',
          'Terrace',
          'Elevator',
          '24/7 Security',
          'High-speed WiFi',
        ],
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        ],
        extraFeatures: { petFriendly: true, parkingSpots: 2 },
        status: 'Approved',
        rejectionFeedback: '',
        owner: {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          photo: owner.photo,
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        _id: new ObjectId(),
        title: 'Cozy Beachfront Cottage',
        description:
          'Charming beachfront cottage perfect for summer retreats. Walk right onto the sand, enjoy stunning sunsets from the deck, and listen to the relaxing sound of ocean waves.',
        location: 'Malibu, California',
        propertyType: 'House',
        rent: 3200,
        rentType: 'Monthly',
        bedrooms: 2,
        bathrooms: 2,
        propertySize: 1100,
        amenities: [
          'Ocean View',
          'Private Deck',
          'Fireplace',
          'Parking',
          'WiFi',
        ],
        images: [
          'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
        ],
        extraFeatures: { petFriendly: true, beachfront: true },
        status: 'Approved',
        rejectionFeedback: '',
        owner: {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          photo: owner.photo,
        },
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
      {
        _id: new ObjectId(),
        title: 'Chic Urban Loft',
        description:
          'Spacious industrial-style loft featuring exposed brick walls, timber beams, and massive windows. Located in a vibrant neighborhood close to cafes, galleries, and transit.',
        location: 'Seattle, Washington',
        propertyType: 'Condo',
        rent: 2200,
        rentType: 'Monthly',
        bedrooms: 1,
        bathrooms: 1.5,
        propertySize: 950,
        amenities: [
          'Exposed Brick',
          'Roof Deck',
          'Laundry In-unit',
          'Dishwasher',
          'WiFi',
        ],
        images: [
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
        ],
        extraFeatures: { wheelchairAccessible: true },
        status: 'Approved',
        rejectionFeedback: '',
        owner: {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          photo: owner.photo,
        },
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        _id: new ObjectId(),
        title: 'Serene Mountain Cabin',
        description:
          'Quiet getaway nestled in the woods. Perfect for hiking enthusiasts, writers, or anyone seeking a peaceful escape from the hustle and bustle.',
        location: 'Aspen, Colorado',
        propertyType: 'House',
        rent: 1800,
        rentType: 'Monthly',
        bedrooms: 2,
        bathrooms: 1,
        propertySize: 1200,
        amenities: [
          'Mountain View',
          'Hot Tub',
          'Fire Pit',
          'Forest Trails',
          'Parking',
        ],
        images: [
          'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80',
        ],
        extraFeatures: { secluded: true },
        status: 'Approved',
        rejectionFeedback: '',
        owner: {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          photo: owner.photo,
        },
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        _id: new ObjectId(),
        title: 'Elegant Suburban Villa',
        description:
          'Beautifully landscaped family home in a prestigious gated community. Features a gourmet kitchen, private swimming pool, home office, and large backyard.',
        location: 'Austin, Texas',
        propertyType: 'House',
        rent: 3800,
        rentType: 'Monthly',
        bedrooms: 4,
        bathrooms: 3,
        propertySize: 3100,
        amenities: [
          'Private Pool',
          'Fenced Yard',
          'Garage',
          'Office',
          'Security System',
        ],
        images: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        ],
        extraFeatures: { smartHome: true },
        status: 'Approved',
        rejectionFeedback: '',
        owner: {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          photo: owner.photo,
        },
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        _id: new ObjectId(),
        title: 'Minimalist Studio Apartment',
        description:
          'Compact and highly efficient micro-studio in a transit-oriented building. Perfect for students or young professionals looking for affordable city living.',
        location: 'Boston, Massachusetts',
        propertyType: 'Apartment',
        rent: 1400,
        rentType: 'Monthly',
        bedrooms: 1,
        bathrooms: 1,
        propertySize: 450,
        amenities: [
          'Bike Storage',
          'Common Lounge',
          'Laundry Facilities',
          'High-speed Internet',
        ],
        images: [
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
        ],
        extraFeatures: { nearTransit: true },
        status: 'Approved',
        rejectionFeedback: '',
        owner: {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          photo: owner.photo,
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        _id: new ObjectId(),
        title: 'Spacious Family Duplex',
        description:
          'Pending approval duplex with open floor plan, spacious bedrooms, and a brand new central HVAC system.',
        location: 'Chicago, Illinois',
        propertyType: 'House',
        rent: 2600,
        rentType: 'Monthly',
        bedrooms: 3,
        bathrooms: 2,
        propertySize: 1800,
        amenities: ['HVAC', 'Basement', 'Yard'],
        images: [],
        extraFeatures: {},
        status: 'Pending',
        rejectionFeedback: '',
        owner: {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          photo: owner.photo,
        },
        createdAt: new Date(),
      },
      {
        _id: new ObjectId(),
        title: 'Industrial Warehouse Studio',
        description: 'Rejected studio setup due to safety certificate issues.',
        location: 'Brooklyn, New York',
        propertyType: 'Apartment',
        rent: 2100,
        rentType: 'Monthly',
        bedrooms: 1,
        bathrooms: 1,
        propertySize: 800,
        amenities: ['Exposed Brick', 'Concrete Floor'],
        images: [],
        extraFeatures: {},
        status: 'Rejected',
        rejectionFeedback:
          'The property does not have the mandatory fire safety certificate and exit signs.',
        owner: {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
          photo: owner.photo,
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];

    await db.collection('properties').insertMany(properties);
    console.log('Seeded properties');

    // Seed Reviews
    const reviews = [
      {
        propertyId: properties[0]._id,
        rating: 5,
        comment: 'This penthouse is absolutely gorgeous! Highly recommended.',
        tenant: {
          id: tenant._id.toString(),
          name: tenant.name,
          email: tenant.email,
          photo: tenant.photo,
        },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        propertyId: properties[1]._id,
        rating: 5,
        comment:
          'Waking up to the sound of waves was magical. Cozy and very clean!',
        tenant: {
          id: tenant._id.toString(),
          name: tenant.name,
          email: tenant.email,
          photo: tenant.photo,
        },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        propertyId: properties[2]._id,
        rating: 4,
        comment:
          'Great industrial loft. Close to public transit. Very stylish.',
        tenant: {
          id: tenant._id.toString(),
          name: tenant.name,
          email: tenant.email,
          photo: tenant.photo,
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        propertyId: properties[3]._id,
        rating: 5,
        comment:
          'Quiet mountain cabin. Extremely clean and cozy. Love the fireplace!',
        tenant: {
          id: tenant._id.toString(),
          name: tenant.name,
          email: tenant.email,
          photo: tenant.photo,
        },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    await db.collection('reviews').insertMany(reviews);
    console.log('Seeded reviews');

    // Seed Bookings and Transactions
    const bookings = [
      {
        _id: new ObjectId(),
        propertyId: properties[0]._id,
        propertyName: properties[0].title,
        tenant: {
          id: tenant._id.toString(),
          name: tenant.name,
          email: tenant.email,
          photo: tenant.photo,
        },
        owner: {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
        },
        moveInDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        contactNumber: '+1234567890',
        additionalNotes: 'Please let me know how to pick up the keys.',
        bookingStatus: 'Approved',
        paymentStatus: 'Paid',
        amountPaid: properties[0].rent,
        transactionId: 'pi_seeding_trans_1',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        _id: new ObjectId(),
        propertyId: properties[1]._id,
        propertyName: properties[1].title,
        tenant: {
          id: tenant._id.toString(),
          name: tenant.name,
          email: tenant.email,
          photo: tenant.photo,
        },
        owner: {
          id: owner._id.toString(),
          name: owner.name,
          email: owner.email,
        },
        moveInDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        contactNumber: '+1098765432',
        additionalNotes: 'Looking forward to the beachfront cottage!',
        bookingStatus: 'Pending',
        paymentStatus: 'Paid',
        amountPaid: properties[1].rent,
        transactionId: 'pi_seeding_trans_2',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    await db.collection('bookings').insertMany(bookings);
    console.log('Seeded bookings');

    const transactions = [
      {
        transactionId: 'pi_seeding_trans_1',
        propertyId: properties[0]._id,
        propertyName: properties[0].title,
        tenantName: tenant.name,
        ownerName: owner.name,
        amount: properties[0].rent,
        date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      {
        transactionId: 'pi_seeding_trans_2',
        propertyId: properties[1]._id,
        propertyName: properties[1].title,
        tenantName: tenant.name,
        ownerName: owner.name,
        amount: properties[1].rent,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    await db.collection('transactions').insertMany(transactions);
    console.log('Seeded transactions');

    console.log('Database seeded successfully!');
    console.log('------------------------------');
    console.log('Test User Credentials:');
    console.log('Admin: admin@obstakl.com / adminpassword123');
    console.log('Owner: owner@obstakl.com / ownerpassword123');
    console.log('Tenant: tenant@obstakl.com / tenantpassword123');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await client.close();
  }
}

seed();
