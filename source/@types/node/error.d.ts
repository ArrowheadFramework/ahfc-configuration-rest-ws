interface Error {
    code?: string;
    message: string;
    stack?: string;
}

declare module "NodeJS" {
    interface SystemError extends Error {
        errno?: string | number;
        syscall?: string;
        path?: string;
        address?: string;
        port?: number;
    }
}