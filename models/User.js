// ============================================================================
// models/User.js — المستخدمون والصلاحيات
// ============================================================================
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    role: {
        type: String,
        enum: ['admin', 'editor', 'viewer'],
        default: 'editor'
    },
    email: { type: String, lowercase: true, trim: true, default: '' },
    displayName: { type: String, default: '' },
    avatar: { type: String, default: '' },
    avatarPublicId: { type: String, default: '' },

    lastLoginAt: { type: Date },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 });

userSchema.pre('save', async function(next) {
    this.updatedAt = new Date();
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.comparePassword = function(password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);