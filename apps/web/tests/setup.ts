import '@testing-library/jest-dom';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Mock console.error to keep test output clean (optional, can be removed if needed)
// console.error = vi.fn();
