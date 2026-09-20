const publicationService = require('../services/publicationService');

const getPublications = async (req, res) => {
  try {
    const { search } = req.query;
    const publications = await publicationService.getAllPublications(search);
    res.status(200).json({ success: true, data: publications });
  } catch (error) {
    console.error('Error fetching publications:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getPublicationByTitle = async (req, res) => {
  try {
    const { title } = req.params;
    const publication = await publicationService.getPublicationByTitle(
      decodeURIComponent(title)
    );
    if (!publication) {
      return res.status(404).json({ success: false, message: 'Publication not found' });
    }
    return res.status(200).json({ success: true, data: publication });
  } catch (error) {
    console.error('Error fetching publication by title:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getPublication = async (req, res) => {
  try {
    const { id } = req.params;
    const publication = await publicationService.getPublicationByID(id);

    if (!publication) {
      return res.status(404).json({ success: false, message: 'Publication not found' });
    }

    return res.status(200).json({ success: true, data: publication });
  } catch (error) {
    console.error('Error fetching publication:', error.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createPublication = async (req, res) => {
  try {
    const publicationData = req.body;
    const newPublication = await publicationService.createPublication(publicationData);
    res.status(201).json({ success: true, data: newPublication });
  } catch (error) {
    console.error('Error creating publication:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const publicationData = req.body;
    const updatedPublication = await publicationService.updatePublication(id, publicationData);
    
    if (!updatedPublication) {
      return res.status(404).json({ success: false, message: 'Publication not found' });
    }
    
    res.status(200).json({ success: true, data: updatedPublication });
  } catch (error) {
    console.error('Error updating publication:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePublication = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPublication = await publicationService.deletePublication(id);
    
    if (!deletedPublication) {
      return res.status(404).json({ success: false, message: 'Publication not found' });
    }
    
    res.status(200).json({ success: true, message: 'Publication deleted successfully' });
  } catch (error) {
    console.error('Error deleting publication:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPublications,
  getPublication,
  getPublicationByTitle,
  createPublication,
  updatePublication,
  deletePublication
};
