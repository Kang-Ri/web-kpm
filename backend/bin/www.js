#!/usr/bin/env node

/**
 * Module dependencies.
 */

const app = require('../app');
const debug = require('debug')('bootcamp-v1:server');
const http = require('http');

/**
 * Import koneksi database Sequelize yang baru
 */
const sequelize = require('../app/db/sequelizeConfig'); // <-- PATH BARU

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

// --- START OF MODIFIED BOOTSTRAP LOGIC (Diperbaiki untuk Sequelize) ---

async function main() {
  try {
    // 1. Verifikasi Koneksi Database Sequelize
    // sequelize.authenticate() melakukan tes koneksi
    await sequelize.authenticate();
    console.log('✅ Sequelize Database terkoneksi dengan sukses.');
    
    // (Opsional) Sinkronisasi Model (Jika Anda ingin Sequelize membuat/memperbarui tabel)
    // HANYA gunakan ini saat DEVELOPMENT, TIDAK disarankan di Production!
    // await sequelize.sync({ alter: true }); 
    // console.log('✅ Model disinkronisasi dengan database.');

    // 2. Mulai Server HTTP
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);

  } catch (error) {
    console.error('❌ Koneksi Database Gagal:', error.message);
    // Keluar dari proses jika koneksi database gagal total
    process.exit(1);
  }
}

// Panggil fungsi main untuk memulai aplikasi
main();

// --- END OF MODIFIED BOOTSTRAP LOGIC ---

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log(`Server Express berjalan di ${bind}`);
  debug('Listening on ' + bind);
}