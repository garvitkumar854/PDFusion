'use server';

import {config} from 'dotenv';
config();

// All Genkit flows must be imported here.
import './flows/convert-word-to-pdf-flow';
import './flows/merge-pdfs-flow';
    