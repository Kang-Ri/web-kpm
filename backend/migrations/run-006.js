// Run this script to apply migration
// node migrations/run-006.js

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
        console.log('🔄 Changing product unique constraint...');

        // Drop old unique constraint
        try {
            await connection.query('ALTER TABLE product DROP INDEX namaProduk');
            console.log('✅ Dropped old unique constraint on namaProduk');
        } catch (error) {
            if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                console.log('⚠️  Old constraint already removed or doesn\'t exist');
            } else {
                throw error;
            }
        }

        // Add composite unique index
        try {
            await connection.query(`
                ALTER TABLE product 
                ADD UNIQUE INDEX unique_product_per_parent2 (namaProduk, idParent2)
            `);
            console.log('✅ Added composite unique index (namaProduk, idParent2)');
        } catch (error) {
            if (error.code === 'ER_DUP_KEYNAME') {
                console.log('⚠️  Composite index already exists');
            } else {
                throw error;
            }
        }

        console.log('✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
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
