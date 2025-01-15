
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
require('./config/passport')(passport);

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// View engine
app.set('view engine', 'ejs');

// Session
app.use(session({
    secret: 'geocaching-secret',
    resave: false,
    saveUninitialized: true
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Database connection
const mongoURI = 'mongodb+srv://david:nube@cluster0.avzx5.mongodb.net/';
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes);
app.use('/game', gameRoutes);

// Home route
app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    