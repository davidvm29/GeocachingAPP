const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const authRoutes = require("./routes/authRoutes");
const gameRoutes = require("./routes/gameRoutes");
const path = require("path");
require("./config/passport")(passport);
require("dotenv").config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// View engine
app.set("view engine", "ejs");
//app.set("views", path.join(__dirname, "views"));

// Session
app.use(
  session({
    secret: "geocaching-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Database connection
const mongoURI = "mongodb+srv://david:nube@cluster0.avzx5.mongodb.net/";
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
