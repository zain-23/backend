const asyncHandler = (fn) => {
  (req, res, next) => {
    new Promise.resolve(fn(req, res, next)).catch((err) => {
      next(err);
    });
  };
};

export { asyncHandler };
