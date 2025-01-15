const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
    name: { type: String, required: true },
    area: {
        center: { lat: Number, lng: Number },
        dimensions: { width: Number, height: Number },
    },
    caches: [
        {
            location: { lat: Number, lng: Number },
            hint: String,
            foundBy: [String], // IDs de usuarios
        },
    ],
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isActive: { type: Boolean, default: true },
    winner: { type: String, default: null },
});

module.exports = mongoose.model('Game', GameSchema);
