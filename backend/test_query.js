const sequelize = require('./app/db');
sequelize.query('SELECT namaParent2 FROM ParentProduct2 WHERE JSON_CONTAINS(jenjangKelasIzin, \'"8"\')')
  .then(res => console.log(res[0]))
  .catch(console.error)
  .finally(() => process.exit(0));
