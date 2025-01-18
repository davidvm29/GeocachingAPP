const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");
const path = require("path");
const cors = require("cors");

require("./config/passport")(passport);

const app = express();

app.use(
  cors({
    credentials: true, // Permite el envío de cookies
  })
);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // Duración de la cookie en milisegundos (24 horas)
    },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Database connection
const mongoURI = process.env.MONGO_URI;
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/auth", authRoutes);
app.use("/game", gameRoutes);

// Home route
app.get("/", (req, res) => {
  res.render("layout", {
    view: "index",
    user: req.user,
    isNotIndex: false,
    includeGoogleApi: false,
    activeRoute: "index",
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
