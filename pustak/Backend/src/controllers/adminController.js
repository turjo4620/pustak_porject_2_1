const adminService = require('../services/adminService');

class AdminController {
  // ============= DASHBOARD =============
  async getDashboard(req, res) {
    try {
      const stats = await adminService.getDashboardStats();
      const recentActivities = await adminService.getRecentActivities(10);
      
      res.json({
        stats,
        recentActivities
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  }

  // ============= BOOK MANAGEMENT =============
  async getAllBooks(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        search: req.query.search,
        category_id: req.query.category_id,
        availability: req.query.availability
      };

      const result = await adminService.getAllBooks(page, limit, filters);
      res.json(result);
    } catch (error) {
      console.error('Get all books error:', error);
      res.status(500).json({ error: 'Failed to fetch books' });
    }
  }

  async getBookById(req, res) {
    try {
      const book = await adminService.getBookById(req.params.id);
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      res.json(book);
    } catch (error) {
      console.error('Get book error:', error);
      res.status(500).json({ error: 'Failed to fetch book' });
    }
  }

  async createBook(req, res) {
    try {
      const book = await adminService.createBook(req.body, req.admin.user_id);
      res.status(201).json(book);
    } catch (error) {
      console.error('Create book error:', error);
      res.status(500).json({ error: 'Failed to create book' });
    }
  }

  async updateBook(req, res) {
    try {
      const book = await adminService.updateBook(req.params.id, req.body);
      res.json(book);
    } catch (error) {
      console.error('Update book error:', error);
      res.status(500).json({ error: 'Failed to update book' });
    }
  }

  async deleteBook(req, res) {
    try {
      await adminService.deleteBook(req.params.id);
      res.json({ message: 'Book deleted successfully' });
    } catch (error) {
      console.error('Delete book error:', error);
      res.status(500).json({ error: 'Failed to delete book' });
    }
  }

  async updateBookStock(req, res) {
    try {
      const { quantity } = req.body;
      const result = await adminService.updateBookStock(req.params.id, quantity);
      res.json(result);
    } catch (error) {
      console.error('Update stock error:', error);
      res.status(500).json({ error: 'Failed to update stock' });
    }
  }

  // ============= USER MANAGEMENT =============
  async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        search: req.query.search,
        status: req.query.status
      };

      const result = await adminService.getAllUsers(page, limit, filters);
      res.json(result);
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  async getUserDetails(req, res) {
    try {
      const user = await adminService.getUserDetails(req.params.id);
      res.json(user);
    } catch (error) {
      console.error('Get user details error:', error);
      res.status(500).json({ error: 'Failed to fetch user details' });
    }
  }

  async updateUserStatus(req, res) {
    try {
      const { status } = req.body;
      const user = await adminService.updateUserStatus(req.params.id, status);
      res.json(user);
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  }

  // ============= ORDER MANAGEMENT =============
  async getAllOrders(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        status: req.query.status,
        search: req.query.search
      };

      const result = await adminService.getAllOrders(page, limit, filters);
      res.json(result);
    } catch (error) {
      console.error('Get all orders error:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  }

  async getOrderDetails(req, res) {
    try {
      const order = await adminService.getOrderDetails(req.params.id);
      res.json(order);
    } catch (error) {
      console.error('Get order details error:', error);
      res.status(500).json({ error: 'Failed to fetch order details' });
    }
  }

  async getOrderCouriers(req, res) {
    try {
      const couriers = await adminService.getCouriersForOrder(req.params.id);
      res.json(couriers);
    } catch (error) {
      console.error('Get order couriers error:', error);
      res.status(error.status || 500).json({ error: error.message || 'Failed to fetch couriers' });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { status, courier_id } = req.body;
      const order = await adminService.updateOrderStatus(
        req.params.id,
        status,
        courier_id ? parseInt(courier_id, 10) : null
      );
      res.json(order);
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(error.status || 500).json({ error: error.message || 'Failed to update order status' });
    }
  }

  // ============= REVIEW MANAGEMENT =============
  async getAllReviews(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        book_id: req.query.book_id,
        is_hidden: req.query.is_hidden !== undefined ? req.query.is_hidden === 'true' : undefined
      };

      const result = await adminService.getAllReviews(page, limit, filters);
      res.json(result);
    } catch (error) {
      console.error('Get all reviews error:', error);
      res.status(error.status || 500).json({ error: error.message || 'Failed to fetch reviews' });
    }
  }

  async toggleReviewVisibility(req, res) {
    try {
      const review = await adminService.toggleReviewVisibility(req.params.id);
      res.json(review);
    } catch (error) {
      console.error('Toggle review visibility error:', error);
      res.status(error.status || 500).json({ error: error.message || 'Failed to toggle review visibility' });
    }
  }

  async deleteReview(req, res) {
    try {
      await adminService.deleteReview(req.params.id);
      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Delete review error:', error);
      res.status(error.status || 500).json({ error: error.message || 'Failed to delete review' });
    }
  }

  // ============= ANALYTICS =============
  async getAnalytics(req, res) {
    try {
      const { start_date, end_date } = req.query;
      const startDate = start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = end_date || new Date().toISOString();

      const [salesData, salesSummary, bestSellers, popularCategories, lowStock, outOfStock, bestCustomers] = await Promise.all([
        adminService.getSalesAnalytics(startDate, endDate),
        adminService.getSalesSummary(startDate, endDate),
        adminService.getBestSellingBooks(10),
        adminService.getPopularCategories(),
        adminService.getLowStockBooks(),
        adminService.getOutOfStockBooks(),
        adminService.getBestCustomers(10)
      ]);

      res.json({
        sales: salesData,
        salesSummary,
        bestSellers,
        popularCategories,
        lowStock,
        outOfStock,
        bestCustomers
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }

  async getBestSellers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const bestSellers = await adminService.getBestSellingBooks(limit);
      res.json(bestSellers);
    } catch (error) {
      console.error('Get best sellers error:', error);
      res.status(500).json({ error: 'Failed to fetch best sellers' });
    }
  }

  async getLowStockBooks(req, res) {
    try {
      const lowStock = await adminService.getLowStockBooks();
      res.json(lowStock);
    } catch (error) {
      console.error('Get low stock books error:', error);
      res.status(500).json({ error: 'Failed to fetch low stock books' });
    }
  }
}

module.exports = new AdminController();