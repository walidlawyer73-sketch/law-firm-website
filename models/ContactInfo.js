const mongoose = require('mongoose');

const contactInfoSchema = new mongoose.Schema({
    address: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    workingHours: { 
        type: String, 
        required: true 
    },
    mapUrl: {
        type: String
    },
    socialMedia: {
        linkedin: { type: String },
        twitter: { type: String },
        facebook: { type: String },
        youtube: { type: String }
    },
    language: { 
        type: String, 
        enum: ['en', 'ar'], 
        default: 'en' 
    }
});

module.exports = mongoose.model('ContactInfo', contactInfoSchema);