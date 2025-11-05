// Helper to convert snake_case from DB to camelCase for JS/JSON
const camelCaseKeys = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(v => camelCaseKeys(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((result, key) => {
            const newKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            result[newKey] = camelCaseKeys(obj[key]);
            return result;
        }, {});
    }
    return obj;
};

// Generic error handler to reduce boilerplate in route handlers
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next); // Pass errors to the global handler
};

module.exports = {
    camelCaseKeys,
    asyncHandler
};
