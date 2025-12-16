export const ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    WORKER: 'worker',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
