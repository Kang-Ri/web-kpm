/**
 * Migration Script: Migrasi Data Daftar Ulang ke Product
 * 
 * Script ini membuat Product baru untuk setiap ParentProduct2
 * yang memiliki daftarUlangAktif = true
 * 
 * IMPORTANT: Run setelah migration 015 (ENUM update)
 */

const { Sequelize } = require('sequelize');
const ParentProduct2 = require('../app/api/v1/parentProduct2/model');
const Product = require('../app/api/v1/product/model');
const sequelize = require('../app/db/sequelizeConfig');

const migrateDaftarUlangToProduct = async () => {
    console.log('🚀 Memulai migrasi Daftar Ulang ke Product...\n');

    try {
        // 1. Ambil semua ruang kelas dengan daftar ulang aktif
        const ruangKelas = await ParentProduct2.findAll({
            where: {
                daftarUlangAktif: true
            },
            attributes: [
                'idParent2',
                'namaParent2',
                'kategoriHargaDaftarUlang',
                'hargaDaftarUlang',
                'idFormDaftarUlang'
            ]
        });

        console.log(`📊 Ditemukan ${ruangKelas.length} ruang kelas dengan daftar ulang aktif\n`);

        if (ruangKelas.length === 0) {
            console.log('✅ Tidak ada data untuk dimigrasi.');
            return;
        }

        let created = 0;
        let skipped = 0;

        // 2. Loop setiap ruang kelas
        for (const kelas of ruangKelas) {
            console.log(`🔍 Processing: ${kelas.namaParent2} (ID: ${kelas.idParent2})`);

            // Cek apakah Product daftar ulang sudah ada
            const existingProduct = await Product.findOne({
                where: {
                    idParent2: kelas.idParent2,
                    jenisProduk: 'Daftar Ulang'
                }
            });

            if (existingProduct) {
                console.log(`   ⏭️  Product sudah ada (ID: ${existingProduct.idProduk}), skip.\n`);
                skipped++;
                continue;
            }

            // 3. Buat Product baru
            const newProduct = await Product.create({
                idParent2: kelas.idParent2,
                namaProduk: `Daftar Ulang ${kelas.namaParent2}`,
                descProduk: `Pembayaran daftar ulang untuk ${kelas.namaParent2}`,
                kategoriHarga: kelas.kategoriHargaDaftarUlang || 'Gratis',
                hargaModal: kelas.hargaDaftarUlang || 0,
                hargaJual: kelas.hargaDaftarUlang || 0,
                jenisProduk: 'Daftar Ulang',
                authProduk: 'Khusus', // Hanya untuk siswa yang enrolled
                idForm: kelas.idFormDaftarUlang,
                refCode: null,
                statusProduk: 'Publish', // Auto publish karena daftarUlangAktif = true
                tanggalPublish: new Date()
            });

            console.log(`   ✅ Product created!`);
            console.log(`      - ID: ${newProduct.idProduk}`);
            console.log(`      - Nama: ${newProduct.namaProduk}`);
            console.log(`      - Harga: Rp ${newProduct.hargaJual.toLocaleString('id-ID')}`);
            console.log(`      - Form ID: ${newProduct.idForm || 'NULL'}\n`);

            created++;
        }

        // 4. Summary
        console.log('\n📋 SUMMARY:');
        console.log(`   ✅ Product created: ${created}`);
        console.log(`   ⏭️  Skipped (already exists): ${skipped}`);
        console.log(`   📊 Total processed: ${ruangKelas.length}`);
        console.log('\n✅ Migrasi selesai!\n');

    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    }
};

// Run migration if called directly
if (require.main === module) {
    migrateDaftarUlangToProduct()
        .then(() => {
            console.log('✅ Migration script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = migrateDaftarUlangToProduct;
