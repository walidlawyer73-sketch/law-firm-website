const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    slug: { 
        type: String, 
        required: true, 
        unique: true 
    },
    metaTitle: {
        type: String
    },
    metaDescription: {
        type: String
    },
    language: { 
        type: String, 
        enum: ['en', 'ar'], 
        default: 'en' 
    },
    published: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Page', pageSchema);