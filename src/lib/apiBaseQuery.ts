import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'http://185.233.44.234:8002'),
  prepareHeaders: (headers) => {
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});
