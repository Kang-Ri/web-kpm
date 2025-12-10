const { StatusCodes } = require('http-status-codes');

const errorHandleMiddleware = (err, req, res, next) => {
    let customError = {
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        msg: err.message || 'Something went wrong, try again later'
    };

    // -------------------------
    // 1. Duplicate Key (MySQL & MSSQL)
    // -------------------------
    // MySQL duplicate: ER_DUP_ENTRY (kode: 'ER_DUP_ENTRY')
    // MSSQL duplicate: number = 2627 atau 2601
    if (err.code === 'ER_DUP_ENTRY' || err.number === 2627 || err.number === 2601) {
        customError.msg = 'Duplicate value entered. Please use another value.';
        customError.statusCode = StatusCodes.BAD_REQUEST;
    }

    // -------------------------
    // 2. Foreign Key Constraint Error
    // -------------------------
    // MySQL: ER_NO_REFERENCED_ROW_2
    // MSSQL: number = 547
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.number === 547) {
        customError.msg = 'Foreign key constraint failed.';
        customError.statusCode = StatusCodes.BAD_REQUEST;
    }

    // -------------------------
    // 3. Data Type Error (invalid ID, invalid input)
    // -------------------------
    // MySQL: ER_TRUNCATED_WRONG_VALUE, ER_PARSE_ERROR
    // MSSQL: number = 245 (conversion error)
    if (
        err.code === 'ER_TRUNCATED_WRONG_VALUE' ||
        err.code === 'ER_PARSE_ERROR' ||
        err.number === 245
    ) {
        customError.msg = 'Invalid input data format.';
        customError.statusCode = StatusCodes.BAD_REQUEST;
    }

    // -------------------------
    // 4. Missing Table / Column
    // -------------------------
    if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_NO_SUCH_TABLE') {
        customError.msg = 'Database error: missing table or column.';
        customError.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }

    // -------------------------
    // 5. SQL Syntax Error
    // -------------------------
    if (err.code === 'ER_PARSE_ERROR') {
        customError.msg = 'SQL syntax error.';
        customError.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    }

    // -------------------------
    // 6. Default fallback
    // -------------------------
    customError.msg = customError.msg || err.sqlMessage || 'Database error occurred';

    return res
        .status(customError.statusCode)
        .json({ msg: customError.msg });
};

module.exports = errorHandleMiddleware;
