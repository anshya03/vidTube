class ApiError extends Error {
    constructor(
        statusCode,
        message="Something went wrong",
        err = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode;
        this.err = err;
        this.stack = stack;

        if(stack){
             this.stack = stack;
         } else{
             Error.captureStackTrace(this, this.constructor);
         }
    }

}

export {ApiError};
//The default JavaScript Error class only has message and stack properties. For an HTTP API, we also need statusCode to send proper HTTP responses like 404 or 401. By extending Error we get all the default functionality plus our custom HTTP-specific properties, and we maintain a consistent error format across the entire application."