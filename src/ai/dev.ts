
'use server';

import {config} from 'dotenv';
config();

// All Genkit flows must be imported here.
import './flows/compress-pdf-flow';
import './flows/embed-flow';
