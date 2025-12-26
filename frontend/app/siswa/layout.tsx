import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard Siswa - Web KPM",
    description: "Dashboard siswa untuk akses materi dan informasi",
};

export default function SiswaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
