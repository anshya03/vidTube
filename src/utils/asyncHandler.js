const asyncHandler = (requestHandler) => {
    return async (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch
        ((err) =>next(err));
    }   
}
export  {asyncHandler};

//asyncHandler is a higher order function that wraps async controller functions. It eliminates the need to write try/catch in every controller by automatically catching any errors and passing them to Express's error handling middleware via next(). This keeps controller code clean and follows the DRY principle."