import { DashboardLayout } from '@/components/layouts';

export default function FormBuilderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
