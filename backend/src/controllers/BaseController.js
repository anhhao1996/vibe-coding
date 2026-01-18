/**
 * Base Controller
 * Open/Closed Principle: Base class for all controllers
 */
class BaseController {
  sendSuccess(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  sendError(res, message = 'Error', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  sendCreated(res, data, message = 'Created successfully') {
    return this.sendSuccess(res, data, message, 201);
  }

  sendNotFound(res, message = 'Resource not found') {
    return this.sendError(res, message, 404);
  }

  sendBadRequest(res, message = 'Bad request', errors = null) {
    return this.sendError(res, message, 400, errors);
  }

  sendUnauthorized(res, message = 'Unauthorized') {
    return this.sendError(res, message, 401);
  }

  sendForbidden(res, message = 'Forbidden') {
    return this.sendError(res, message, 403);
  }

  sendValidationError(res, errors) {
    return this.sendError(res, 'Validation failed', 422, errors);
  }

  handleError(res, error) {
    console.error('Controller Error:', error);

    if (error.message.includes('not found')) {
      return this.sendNotFound(res, error.message);
    }

    if (error.message.includes('already exists') || error.message.includes('Insufficient')) {
      return this.sendBadRequest(res, error.message);
    }

    return this.sendError(res, error.message || 'Internal server error');
  }
}

module.exports = BaseController;
