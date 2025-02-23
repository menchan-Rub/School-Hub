declare namespace jest {
    interface Mock<T = any, Y extends any[] = any> {
        (...args: Y): T;
        mockClear(): void;
        mockReset(): void;
        mockRestore(): void;
        mockImplementation(fn: (...args: Y) => T): this;
        mockImplementationOnce(fn: (...args: Y) => T): this;
        mockReturnValue(value: T): this;
        mockReturnValueOnce(value: T): this;
        mockResolvedValue(value: T): this;
        mockResolvedValueOnce(value: T): this;
        mockRejectedValue(value: any): this;
        mockRejectedValueOnce(value: any): this;
    }
}

declare module 'node-mocks-http' {
    export function createMocks(options?: {
        method?: string;
        url?: string;
        query?: object;
        params?: object;
        body?: object;
        session?: object;
        cookies?: object;
    }): {
        req: any;
        res: any;
    };
}

declare global {
    namespace NodeJS {
        interface Global {
            prisma: import('@prisma/client').PrismaClient;
        }
    }

    namespace jest {
        interface Matchers<R> {
            toBeInTheDocument(): R;
            toHaveStyle(style: Record<string, any>): R;
            toBeVisible(): R;
            toBeInTheDOM(): R;
        }
    }
}

 