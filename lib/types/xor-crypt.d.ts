declare module 'xor-crypt' {
  export const xor: {
    encode: (str: string) => string;
    decode: (str: string) => string;
  }
} 