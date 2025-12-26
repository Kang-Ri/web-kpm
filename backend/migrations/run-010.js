require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    let connection;

    try {
        console.log('📦 Running Migration 010: Create Variable Templates Table...');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'kpm_db',
            multipleStatements: true
        });

        // Read SQL file
        const sqlPath = path.join(__dirname, '010_create_variable_templates.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute migration
        await connection.query(sql);

        console.log('✅ Migration 010 completed successfully!');
        console.log('   - variableTemplates table created');
        console.log('   - 9 default templates seeded');
    } catch (error) {
        console.error('❌ Migration 010 failed:', error.message);
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
