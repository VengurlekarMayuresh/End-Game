const errorHandler = (err, req, res, next) => {
  console.error('===== ERROR =====');
  console.error(err);
  if (err.stack) console.error(err.stack);
  console.error('=================');
  
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
