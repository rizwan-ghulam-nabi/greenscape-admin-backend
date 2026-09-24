// backend/controllers/CustomerController.js
import User from '../models/User.js';
import Order from '../models/Order.js';

// ==========================================
// 1. GET ALL CUSTOMERS (With Login Sessions & Stats)
// ==========================================
// export const getCustomers = async (req, res) => {
//   try {
//     const { search, status, page = 1, limit = 10 } = req.query;

//     // Base filter - only customers (not admins)
//     let filter = { role: 'customer', isAdmin: false };

//     // Search Filter (Name, Email, Phone)
//     if (search) {
//       filter.$or = [
//         { firstName: { $regex: search, $options: 'i' } },
//         { lastName: { $regex: search, $options: 'i' } },
//         { email: { $regex: search, $options: 'i' } },
//         { phone: { $regex: search, $options: 'i' } },
//       ];
//     }

//     // Active / Inactive / Suspended Filter
//     if (status && status !== 'all') {
//       filter.status = status;
//     }

//     // Pagination
//     const skip = (page - 1) * limit;
//     const totalCustomers = await User.countDocuments(filter);

//     // Fetch users with login info
//     const customers = await User.find(filter)
//       .select('-password -refreshToken -loginAttempts -lockUntil -emailVerificationToken -emailVerificationExpires')
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     // 2. AGGREGATE ORDER DATA (Total Orders & Total Spent)
//     const customersWithStats = await Promise.all(
//       customers.map(async (customer) => {
//         const orders = await Order.find({ user: customer._id });
//         const totalOrders = orders.length;
//         const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
//         return {
//           ...customer.toObject(),
//           totalOrders,
//           totalSpent,
//           fullName: `${customer.firstName} ${customer.lastName}`,
          
//           // ✅ Login session info
//           isOnline: customer.lastLogin && (Date.now() - new Date(customer.lastLogin).getTime()) < 5 * 60 * 1000, // Online if logged in last 5 mins
//           lastLoginTime: customer.lastLogin,
//           daysSinceLastLogin: customer.lastLogin ? Math.floor((Date.now() - new Date(customer.lastLogin).getTime()) / (1000 * 60 * 60 * 24)) : null,
//           status: customer.status,
//           isActive: customer.isActive,
//         };
//       })
//     );

//     // 3. DASHBOARD STATS (Top Cards)
//     const now = new Date();
//     const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
//     const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

//     const totalAll = await User.countDocuments({ role: 'customer', isAdmin: false });
//     const newCustomers = await User.countDocuments({ 
//       role: 'customer', 
//       isAdmin: false,
//       createdAt: { $gte: thirtyDaysAgo } 
//     });
//     const activeCustomers = await User.countDocuments({ 
//       role: 'customer', 
//       isAdmin: false,
//       status: 'active',
//       lastLogin: { $gte: thirtyDaysAgo } 
//     });
    
//     // Customers online now (last 5 mins)
//     const onlineNow = await User.countDocuments({
//       role: 'customer',
//       isAdmin: false,
//       lastLogin: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
//     });
    
//     // Logged in last 7 days
//     const activeLastWeek = await User.countDocuments({
//       role: 'customer',
//       isAdmin: false,
//       lastLogin: { $gte: sevenDaysAgo }
//     });

//     // Calculate Repeat Customers
//     const repeatPipeline = await Order.aggregate([
//       { $group: { _id: "$user", count: { $sum: 1 } } },
//       { $match: { count: { $gt: 1 } } },
//       { $count: "total" }
//     ]);
//     const repeatCustomers = repeatPipeline[0]?.total || 0;

//     res.json({
//       customers: customersWithStats,
//       pagination: {
//         page: Number(page),
//         limit: Number(limit),
//         totalPages: Math.ceil(totalCustomers / limit),
//         totalCustomers,
//       },
//       stats: {
//         totalCustomers: totalAll,
//         newCustomers,
//         activeCustomers,
//         repeatCustomers,
//         onlineNow,
//         activeLastWeek,
//       }
//     });
//   } catch (err) {
//     console.error('Error fetching customers:', err);
//     res.status(500).json({ error: err.message });
//   }
// };


export const getCustomers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    let filter = { role: 'customer', isAdmin: false };
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
        { phone:     { $regex: search, $options: 'i' } },
      ];
    }
    if (status && status !== 'all') filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    // ✅ Single aggregation with $lookup to get order stats
    const [result] = await User.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          paginated: [
            { $skip: skip },
            { $limit: Number(limit) },
            {
              $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'user',
                as: 'orders',
              },
            },
            {
              $addFields: {
                totalOrders: { $size: '$orders' },
                totalSpent: { $sum: '$orders.totalAmount' },
                fullName: { $concat: ['$firstName', ' ', '$lastName'] },
                isOnline: {
                  $and: [
                    { $ne: ['$lastLogin', null] },
                    {
                      $lt: [
                        { $subtract: [new Date(), '$lastLogin'] },
                        5 * 60 * 1000,
                      ],
                    },
                  ],
                },
              },
            },
            { $project: { password: 0, refreshToken: 0, orders: 0 } },
          ],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const customers = result.paginated;
    const totalCustomers = result.totalCount[0]?.count || 0;

    // ...stats (already parallel)
    const now = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);
    const fiveMinAgo    = new Date(Date.now() - 5  * 60 * 1000);

    const [totalAll, newCustomers, activeCustomers, onlineNow, activeLastWeek, repeatPipeline] =
      await Promise.all([
        User.countDocuments({ role: 'customer', isAdmin: false }),
        User.countDocuments({ role: 'customer', isAdmin: false, createdAt: { $gte: thirtyDaysAgo } }),
        User.countDocuments({ role: 'customer', isAdmin: false, status: 'active', lastLogin: { $gte: thirtyDaysAgo } }),
        User.countDocuments({ role: 'customer', isAdmin: false, lastLogin: { $gte: fiveMinAgo } }),
        User.countDocuments({ role: 'customer', isAdmin: false, lastLogin: { $gte: sevenDaysAgo } }),
        Order.aggregate([
          { $group: { _id: '$user', count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } },
          { $count: 'total' },
        ]),
      ]);

    res.json({
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalCustomers / limit),
        totalCustomers,
      },
      stats: {
        totalCustomers: totalAll,
        newCustomers,
        activeCustomers,
        repeatCustomers: repeatPipeline[0]?.total || 0,
        onlineNow,
        activeLastWeek,
      },
    });
  } catch (err) {
    console.error('Error fetching customers:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};


// ==========================================
// 2. GET SINGLE CUSTOMER DETAILS (With Login History)
// ==========================================
export const getCustomerById = async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)
      .select('-password -refreshToken -loginAttempts -lockUntil -emailVerificationToken -emailVerificationExpires');

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get orders
    const orders = await Order.find({ user: customer._id }).populate('items.product');
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Login info
    const isOnline = customer.lastLogin && (Date.now() - new Date(customer.lastLogin).getTime()) < 5 * 60 * 1000;

    res.json({
      customer: {
        ...customer.toObject(),
        totalOrders,
        totalSpent,
        isOnline,
        lastLoginTime: customer.lastLogin,
        daysSinceLastLogin: customer.lastLogin ? Math.floor((Date.now() - new Date(customer.lastLogin).getTime()) / (1000 * 60 * 60 * 24)) : null,
      },
      orders,
      totalOrders,
      totalSpent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};