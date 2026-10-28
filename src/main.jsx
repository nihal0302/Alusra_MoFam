import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/motion.css';
import './styles/base.css';
import { App } from './App.jsx';
import { AccountPage } from './components/AccountPage.jsx';
import { CasePage } from './components/CasePage.jsx';

// The other pages of the prototype: "My applications" (the chat's "View my applications" button opens it) at /account, and the page
// of one application at /account/<application number> (a row of that table opens it).
const path = window.location.pathname.replace(/\/$/, '');
const onAccountPage = path === '/account';
const caseNumber = path.startsWith('/account/') ? decodeURIComponent(path.slice('/account/'.length)) : null;

createRoot(document.getElementById('root')).render(
  <StrictMode>{caseNumber ? <CasePage number={caseNumber} /> : onAccountPage ? <AccountPage /> : <App />}</StrictMode>,
);
