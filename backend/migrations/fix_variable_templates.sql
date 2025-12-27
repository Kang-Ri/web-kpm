-- Fix Variable Template Names to Match Database Columns
-- Run this to update existing templates to use camelCase

UPDATE variableTemplates SET namaVariable = 'namaLengkap' WHERE namaVariable = 'nama_lengkap';
UPDATE variableTemplates SET namaVariable = 'noHp' WHERE namaVariable = 'no_hp';
UPDATE variableTemplates SET namaVariable = 'tanggalLahir' WHERE namaVariable = 'tanggal_lahir';
UPDATE variableTemplates SET namaVariable = 'jenisKelamin' WHERE namaVariable = 'jenis_kelamin';
UPDATE variableTemplates SET namaVariable = 'alamatLengkap', label = 'Alamat Lengkap' WHERE namaVariable = 'alamat';
UPDATE variableTemplates SET namaVariable = 'jenjangKelas' WHERE namaVariable = 'kelas';

-- Note: nama_ortu and pekerjaan_ortu don't exist in Siswa table, keep as reference or delete
-- If you want to delete them:
-- DELETE FROM variableTemplates WHERE namaVariable IN ('nama_ortu', 'pekerjaan_ortu');
