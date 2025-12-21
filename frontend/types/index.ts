export interface MenuItem {
    label: string;
    icon?: any;
    href?: string;
    children?: MenuItem[];
    roles?: string[]; // Role-based visibility
}

export interface User {
    idUser: number;
    email: string;
    namaLengkap: string;
    role: string;
    idRole?: number; // TEMP: for backward compatibility with current token
    foto?: string;
    noHp?: string;
}
