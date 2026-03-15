class ApiResponse{
    constructor(statusCode,data,message="Success"){
        this.statusCode=statusCode;
        this.data=data;
        this.message=message;
        this.success=statusCode < 400
    }

}

export {ApiResponse};
//it is used to standardize the structure of API responses across the application. By having a consistent format (statusCode, data, message, success), it becomes easier for frontend developers to handle responses and for backend developers to maintain code quality and readability.