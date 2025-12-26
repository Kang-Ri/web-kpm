// Run this script to apply migration
// node migrations/run-007.js

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
        console.log('🔄 Adding judulButton field to materiButton table...');

        await connection.query(`
            ALTER TABLE materiButton 
            ADD COLUMN judulButton VARCHAR(255) NULL 
            COMMENT 'Judul/heading untuk button' 
            AFTER idProduk
        `);

        console.log('✅ Field judulButton added successfully!');
        console.log('✅ Migration completed successfully!');

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  Field judulButton already exists');
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
