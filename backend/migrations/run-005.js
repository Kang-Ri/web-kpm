// Run this script to apply migration
// node migrations/run-005.js

require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
    let connection;

    try {
        console.log('🔄 Connecting to database...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'kpm_db'
        });

        console.log('✅ Connected!');
        console.log('🔄 Running migration: Add jenjangKelasIzin to ParentProduct2...');

        const sql = `
            ALTER TABLE ParentProduct2 
            ADD COLUMN jenjangKelasIzin JSON DEFAULT NULL 
            COMMENT 'Array jenjang kelas yang diperbolehkan: ["1","2",...,"12"]'
        `;

        await connection.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('📋 Added column: jenjangKelasIzin (JSON)');

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  Column jenjangKelasIzin already exists. Migration skipped.');
        } else {
            console.error('❌ Migration failed:', error.message);
            throw error;
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed.');
        }
    }
}

runMigration()
    .then(() => {
        console.log('\n✨ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Error:', error);
        process.exit(1);
    });
