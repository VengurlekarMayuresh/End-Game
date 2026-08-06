const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const notFound = require('./middlewares/notFound');

const app = express();

// Middlewares
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const path = require('path');

// Routes
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api', routes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
});
