const sequelize = require('./app/db');
const ParentProduct2 = require('./app/api/v1/parentProduct2/model');
const { Op } = require('sequelize');

ParentProduct2.findAll({
  where: {
    idParent1: 4,
    status: 'Aktif',
    [Op.and]: sequelize.literal(`JSON_CONTAINS(jenjangKelasIzin, '"8"')`)
  },
  logging: console.log
}).then(res => {
  console.log(res.map(r => r.namaParent2));
  process.exit(0);
});
