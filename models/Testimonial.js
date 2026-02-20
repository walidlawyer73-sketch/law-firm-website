const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    clientName: { 
        type: String, 
        required: true 
    },
    clientPosition: {
        type: String
    },
    company: {
        type: String
    },
    content: { 
        type: String, 
        required: true 
    },
    rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        default: 5 
    },
    image: {
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
    }
});

module.exports = mongoose.model('Testimonial', testimonialSchema);