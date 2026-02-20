const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    excerpt: {
        type: String
    },
    slug: { 
        type: String, 
        required: true, 
        unique: true 
    },
    author: { 
        type: String, 
        default: 'Walid Abo Al-Ela' 
    },
    image: {
        type: String
    },
    category: {
        type: String
    },
    tags: [{
        type: String
    }],
    language: { 
        type: String, 
        enum: ['en', 'ar'], 
        default: 'en' 
    },
    published: { 
        type: Boolean, 
        default: true 
    },
    views: { 
        type: Number, 
        default: 0 
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

module.exports = mongoose.model('BlogPost', blogPostSchema);