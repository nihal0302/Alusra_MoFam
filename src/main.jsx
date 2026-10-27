import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/motion.css';
import './styles/base.css';
import { App } from './App.jsx';
import { AccountPage } from './components/AccountPage.jsx';

// The one other page of the prototype: "My applications" (the chat's "View my applications" button opens it).
const onAccountPage = window.location.pathname.replace(/\/$/, '') === '/account';

createRoot(document.getElementById('root')).render(
  <StrictMode>{onAccountPage ? <AccountPage /> : <App />}</StrictMode>,
);
