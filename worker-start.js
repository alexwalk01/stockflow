import { config } from 'dotenv';
config({ path: '.env.local' });

// Importamos el worker principal
import './lib/worker.js';
