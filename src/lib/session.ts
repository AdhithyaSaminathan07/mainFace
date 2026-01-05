import type { SessionOptions } from 'iron-session';

export const sessionOptions: SessionOptions = {
    password: process.env.SESSION_PASSWORD as string,
    cookieName: 'my-face-app-session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
    },
};

export interface SessionData {
    user?: {
        id: string;
        email: string;
        isAdmin: boolean;
    };
}

export const defaultSession: SessionData = {
    user: undefined,
};
