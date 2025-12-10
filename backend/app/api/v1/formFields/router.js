// app/api/v1/formFields/router.js
const express = require('express');
const router = express.Router();
const { create, index, update, destroy } = require('./controller');
// POST /api/v1/forms/:idForm/fields
router.post('/forms/:idForm/fields', create);
// GET /api/v1/forms/:idForm/fields
router.get('/forms/:idForm/fields', index);
// PUT /api/v1/forms/:idForm/fields/:idField
router.patch('/forms/:idForm/fields/:idField', update);
// DELETE /api/v1/forms/:idForm/fields/:idField
router.delete('/forms/:idForm/fields/:idField', destroy);


module.exports = router;