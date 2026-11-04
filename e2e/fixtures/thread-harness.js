// Isolated component fixture: API and WebSocket responses are provided by Playwright.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../src/context/ToastContext';
import { ThemeContext } from '../../src/context/themeContextValue';
import { ThreadWorkspace, ThreadListButton } from '../../src/features/user/components/organisms/ThreadWorkspace';
import { CourseChatTab } from '../../src/features/user/components/organisms/CourseChatTab';
import chatStyles from '../../src/features/user/components/ChatRoom.module.css';
import '../../src/index.css';

createRoot(document.getElementById('root')).render(
  React.createElement(BrowserRouter, null,
    React.createElement(ToastProvider, null,
    React.createElement(ThemeContext.Provider, { value: {theme:'light',setTheme:()=>{}} },
      React.createElement(ThreadWorkspace, {parentRoomID:'parent1',writable:true},
        React.createElement('main', {className:chatStyles.container},
          React.createElement('header', {style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',borderBottom:'1px solid var(--color-border)'}},
            React.createElement('strong',null,'コミュニティ'), React.createElement(ThreadListButton,{parentRoomID:'parent1'})),
          React.createElement(CourseChatTab, {roomId:'parent1',roomWritable:true,allowThreadCreation:true}),
        ),
      ),
    ),
    ),
  ),
);
