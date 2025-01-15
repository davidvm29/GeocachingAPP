const express = require('express');
const Game = require('../models/Game');
const router = express.Router();

// Mostrar lista de juegos
// Mostrar lista de juegos
router.get('/list', async (req, res) => {
    try {
        const activeGames = await Game.find({ isActive: true }).populate('organizer');
        const completedGames = await Game.find({ isActive: false }).populate('organizer');
        res.render('gameList', { activeGames, completedGames, user: req.user });
    } catch (err) {
        res.status(500).send('Error al obtener la lista de juegos');
    }
});


// Mostrar el formulario para crear un juego
router.get('/create', (req, res) => {
    res.render('createGame', {
        user: req.user,
        googleMapsApiKey: 'AIzaSyDc44uWej_tPpBppTy5D3tJr4tyqPDZTl4', // Pasa la clave desde el servidor
    });
});


// Ruta para crear juegos
router.post('/create', async (req, res) => {
    try {
        const { name, centerLat, centerLng, width, height } = req.body;

        // Valida los campos requeridos
        if (!name || !centerLat || !centerLng || !width || !height) {
            return res.status(400).send('Todos los campos son obligatorios.');
        }

        const newGame = new Game({
            name,
            area: {
                center: { lat: parseFloat(centerLat), lng: parseFloat(centerLng) },
                dimensions: { width: parseInt(width), height: parseInt(height) },
            },
            organizer: req.user._id, // Asegúrate de que req.user esté disponible
        });

        await newGame.save();
        res.redirect('/game/list');
    } catch (err) {
        console.error('Error al crear el juego:', err);
        res.status(500).send('Hubo un error al crear el juego.');
    }
});


// Participar en un juego
router.post('/:id/join', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) return res.status(404).send('Juego no encontrado');
        if (!game.participants.includes(req.user._id)) {
            game.participants.push(req.user._id);
            await game.save();
        }
        res.redirect(`/game/${req.params.id}`);
    } catch (err) {
        res.status(500).send('Error al unirse al juego');
    }
});

router.get('/:id/supervise', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).populate('organizer participants caches.foundBy');
        if (!game) return res.status(404).send('Juego no encontrado');

        res.render('superviseGame', { 
            game, 
            user: req.user, 
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY // Asegúrate de que esté definido en .env
        });
    } catch (err) {
        res.status(500).send('Error al supervisar el juego');
    }
});


// Jugar un juego
router.get('/:id/play', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).populate('caches.foundBy');
        if (!game) return res.status(404).send('Juego no encontrado');

        res.render('playGame', { game, user: req.user });
    } catch (err) {
        res.status(500).send('Error al cargar el juego');
    }
});

// Mostrar lista de juegos organizados por el usuario
router.get('/supervise', async (req, res) => {
    try {
        const games = await Game.find({ organizer: req.user._id });
        res.render('superviseList', { games, user: req.user });
    } catch (err) {
        res.status(500).send('Error al cargar los juegos organizados');
    }
});


module.exports = router;
