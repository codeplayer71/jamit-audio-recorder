import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@codeplayer71/audio-recorder-react/style.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);