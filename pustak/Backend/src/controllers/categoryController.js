const categoryService = require('../services/categoryService');

const getCategories = async (req, res) => {
    try {
        const { search } = req.query;
        const categories = await categoryService.getAllCategories(search);
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error("Error fetching categories:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const getCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await categoryService.getCategoryByID(id);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        return res.status(200).json({ success: true, data: category });
    } catch (error) {
        console.error("Error fetching category:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const createCategory = async (req, res) => {
    try {
        const categoryData = req.body;
        const newCategory = await categoryService.createCategory(categoryData, req.admin.user_id);
        res.status(201).json({ success: true, data: newCategory });
    } catch (error) {
        console.error("Error creating category:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const categoryData = req.body;
        const updatedCategory = await categoryService.updateCategory(id, categoryData, req.admin.user_id);
        
        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        
        res.status(200).json({ success: true, data: updatedCategory });
    } catch (error) {
        console.error("Error updating category:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCategory = await categoryService.deleteCategory(id);
        
        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        
        res.status(200).json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { 
    getCategories, 
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
};
