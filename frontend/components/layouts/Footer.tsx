export function Footer() {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Tentang KPM</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Lembaga pendidikan dan pelatihan yang berkomitmen untuk mengembangkan potensi siswa melalui program-program berkualitas.
                        </p>
                    </div>

                    {/* Programs */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Program Kami</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="/kelas/periodik" className="text-gray-400 hover:text-white transition">
                                    Kelas Periodik
                                </a>
                            </li>
                            <li>
                                <a href="/kelas/insidental" className="text-gray-400 hover:text-white transition">
                                    Kelas Insidental
                                </a>
                            </li>
                            <li>
                                <a href="/lomba" className="text-gray-400 hover:text-white transition">
                                    Lomba
                                </a>
                            </li>
                            <li>
                                <a href="/produk" className="text-gray-400 hover:text-white transition">
                                    Produk
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Layanan</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="/pelatihan/siswa" className="text-gray-400 hover:text-white transition">
                                    Pelatihan Siswa
                                </a>
                            </li>
                            <li>
                                <a href="/pelatihan/guru" className="text-gray-400 hover:text-white transition">
                                    Pelatihan Guru
                                </a>
                            </li>
                            <li>
                                <a href="/pelatihan/ortu" className="text-gray-400 hover:text-white transition">
                                    Pelatihan Orang Tua
                                </a>
                            </li>
                            <li>
                                <a href="/kerjasama" className="text-gray-400 hover:text-white transition">
                                    Kerjasama
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Kontak</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>📧 info@webkpm.com</li>
                            <li>📞 (021) 1234-5678</li>
                            <li>📍 Jakarta, Indonesia</li>
                        </ul>

                        {/* Social Media */}
                        <div className="mt-6">
                            <h4 className="text-sm font-semibold mb-3">Follow Us</h4>
                            <div className="flex gap-3">
                                <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                                    <span className="text-xs">f</span>
                                </a>
                                <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition">
                                    <span className="text-xs">t</span>
                                </a>
                                <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-500 transition">
                                    <span className="text-xs">i</span>
                                </a>
                                <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition">
                                    <span className="text-xs">in</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
                    <p>© 2025 Web KPM. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    );
}
