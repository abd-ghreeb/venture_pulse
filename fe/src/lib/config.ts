/**
 * Global application configuration.
 * Centralizing this allows for easy environment switching.
 */
export const ENV = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8880',
    IS_PRODUCTION: import.meta.env.PROD,
    VERSION: '1.0.0',
  };