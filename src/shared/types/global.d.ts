// Global type declarations for the Student Analyst application

declare global {
  interface Window {
    pyscript?: {
      interpreter: {
        runPython: (code: string) => any;
      };
    };
  }
}

export {}; 