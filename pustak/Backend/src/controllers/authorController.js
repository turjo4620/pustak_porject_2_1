const authorService = require('../services/authorService');

const getAuthors = async (req, res) => {
    try {
        const { search } = req.query;
        const authors = await authorService.getAllAuthors(search);
        res.status(200).json({ success: true, data: authors });
    } catch (error) {
        console.error("Error fetching authors:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const getAuthorByName = async (req, res) => {
    try {
        const { name } = req.params;
        const author = await authorService.getAuthorByName(decodeURIComponent(name));
        if (!author) {
            return res.status(404).json({ success: false, message: 'Author not found' });
        }
        return res.status(200).json({ success: true, data: author });
    } catch (error) {
        console.error('Error fetching author by name:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const getAuthor = async (req, res) => {
    try {
        const {id} = req.params;
        
        const author = await authorService.getAuthorByID(id);        

        if(!author){
            return res.status(404).json({success: false, message : "Author not found"});
        }
        return res.status(200).json({success : true, data : author});
    } catch (error) {
        console.error("Error fetching author:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const createAuthor = async (req, res) => {
    try {
        const authorData = req.body;
        const newAuthor = await authorService.createAuthor(authorData, req.admin.user_id);
        res.status(201).json({ success: true, data: newAuthor });
    } catch (error) {
        console.error("Error creating author:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        const authorData = req.body;
        const updatedAuthor = await authorService.updateAuthor(id, authorData, req.admin.user_id);
        
        if (!updatedAuthor) {
            return res.status(404).json({ success: false, message: "Author not found" });
        }
        
        res.status(200).json({ success: true, data: updatedAuthor });
    } catch (error) {
        console.error("Error updating author:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAuthor = await authorService.deleteAuthor(id);
        
        if (!deletedAuthor) {
            return res.status(404).json({ success: false, message: "Author not found" });
        }
        
        res.status(200).json({ success: true, message: "Author deleted successfully" });
    } catch (error) {
        console.error("Error deleting author:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { 
    getAuthors, 
    getAuthor,
    getAuthorByName,
    createAuthor,
    updateAuthor,
    deleteAuthor
};