const express = require("express");
const Game = require("../models/Game");
const router = express.Router();

// Mostrar lista de juegos
router.get("/list", async (req, res) => {
  try {
    const activeGames = await Game.find({ isActive: true }).populate(
      "organizer"
    );
    const completedGames = await Game.find({ isActive: false })
      .populate("organizer")
      .populate({
        path: "winner",
        model: "User",
      });
    res.render("layout", {
      view: "gameList",
      activeGames,
      completedGames,
      user: req.user,
      isNotIndex: true,
      includeGoogleApi: false,
      activeRoute: "gameList",
    });
  } catch (err) {
    res.status(500).send("Error al obtener la lista de juegos");
  }
});

// Mostrar el formulario para crear un juego
router.get("/create", (req, res) => {
  res.render("layout", {
    view: "createGame",
    user: req.user,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    googleMapsId: process.env.GOOGLE_MAPS_ID,
    isNotIndex: true,
    includeGoogleApi: true,
    activeRoute: "createGame",
  });
});

// Ruta para crear juegos
router.post("/create", async (req, res) => {
  try {
    const { name, centerLat, centerLng, width, height, caches } = req.body;

    // Valida los campos requeridos
    if (!name || !centerLat || !centerLng || !width || !height) {
      return res.status(400).send("Todos los campos son obligatorios.");
    }

    const newGame = new Game({
      name,
      area: {
        center: { lat: parseFloat(centerLat), lng: parseFloat(centerLng) },
        dimensions: { width: parseInt(width), height: parseInt(height) },
      },
      caches: caches.map((cache) => ({
        location: { lat: parseFloat(cache.lat), lng: parseFloat(cache.lng) },
        hint: cache.hint,
        foundBy: [],
      })),
      organizer: req.user._id,
    });

    await newGame.save();
    res.redirect("/game/list");
  } catch (err) {
    console.error("Error al crear el juego:", err);
    res.status(500).send("Hubo un error al crear el juego.");
  }
});

// Ver datos de un juego para participar
router.get("/:id/view", async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).populate("organizer");
    if (!game) return res.status(404).send("Juego no encontrado");
    res.render("layout", {
      view: "joinGame",
      game,
      user: req.user,
      isNotIndex: true,
      includeGoogleApi: false,
      activeRoute: "gameList",
    });
  } catch (err) {
    res.status(500).send("Error al cargar el juego");
  }
});

// Participar en un juego
router.post("/:id/join", async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).send("Juego no encontrado");
    if (!game.participants.includes(req.user._id)) {
      game.participants.push(req.user._id);
      await game.save();
    }
    res.redirect(`/game/${req.params.id}/play`);
  } catch (err) {
    res.status(500).send("Error al unirse al juego");
  }
});

router.get("/:id/supervise", async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate("participants")
      .populate({
        path: "caches.foundBy",
        model: "User",
      })
      .populate({
        path: "winner",
        model: "User",
      });
    if (!game) return res.status(404).send("Juego no encontrado");

    res.render("layout", {
      view: "superviseGame",
      game,
      user: req.user,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      googleMapsId: process.env.GOOGLE_MAPS_ID,
      isNotIndex: true,
      includeGoogleApi: true,
      activeRoute: "gameList",
    });
  } catch (err) {
    res.status(500).send("Error al supervisar el juego");
  }
});

// Jugar un juego
router.get("/:id/play", async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).populate("caches.foundBy");
    if (!game) return res.status(404).send("Juego no encontrado");

    res.render("layout", {
      view: "playGame",
      game,
      user: req.user,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      googleMapsId: process.env.GOOGLE_MAPS_ID,
      isNotIndex: true,
      includeGoogleApi: true,
      activeRoute: "gameList",
    });
  } catch (err) {
    res.status(500).send("Error al cargar el juego");
  }
});

// Mostrar lista de juegos organizados por el usuario
router.get("/supervise", async (req, res) => {
  try {
    const games = await Game.find({ organizer: req.user._id });
    res.render("layout", {
      games,
      user: req.user,
      view: "superviseList",
      isNotIndex: true,
      includeGoogleApi: false,
      activeRoute: "superviseList",
    });
  } catch (err) {
    res.status(500).send("Error al cargar los juegos organizados");
  }
});

module.exports = router;

// Reinicializar el juego
router.post("/:id/reset", async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).send("Juego no encontrado");

    // Reinicializar los datos del juego
    game.caches.forEach((cache) => {
      cache.foundBy = [];
    });
    game.isActive = true;
    game.winner = null;

    await game.save();
    res.redirect(`/game/${req.params.id}/supervise`);
  } catch (err) {
    res.status(500).send("Error al reinicializar el juego");
  }
});

router.post("/:gameId/cache/:cacheId/found", async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) return res.status(404).send("Juego no encontrado");

    const cache = game.caches.id(req.params.cacheId);
    if (!cache) return res.status(404).send("Tesoro no encontrado");

    if (!cache.foundBy.includes(req.user._id)) {
      cache.foundBy.push(req.user._id);
      await game.save();
    }

    // Verificar si el usuario ha encontrado todos los caches
    const allCachesFound = game.caches.every((cache) =>
      cache.foundBy.includes(req.user._id)
    );
    if (allCachesFound) {
      game.winner = req.user._id;
      game.isActive = false;
      await game.save();
    }

    res.redirect(`/game/${req.params.gameId}/play`);
  } catch (err) {
    res.status(500).send("Error al encontrar el tesoro");
  }
});
