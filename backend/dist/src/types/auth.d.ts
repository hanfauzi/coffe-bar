export interface User {
    id: string;
    username: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthPayload {
    userId: string;
    username: string;
    role: string;
}
