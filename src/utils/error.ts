export class AuthenticationError extends Error {
    statusCode = 401;
    constructor(message = 'Authentication failed') {
        super(message);
        this.name = 'AuthenticationError';
    }
}
export class ValidationError extends Error {
    statusCode = 400;
    constructor(message = 'Invalid data') {
        super(message);
        this.name = 'ValidationError';
    }
}

export class ConflictError extends Error {
    statusCode = 409;
    constructor(message = 'ConflictError') {
        super(message);
        this.name = 'ConflictError';
    }
}

export class BadRequestError extends Error {
    statusCode = 400;
    constructor(message = 'BadRequestError') {
        super(message);
        this.name = 'BadRequestError';
    }
}


