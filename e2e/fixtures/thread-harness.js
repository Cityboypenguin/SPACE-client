// Isolated component fixture: API and WebSocket responses are provided by Playwright.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeContext } from '../../src/context/themeContextValue';
import { ThreadWorkspace } from '../../src/features/user/components/organisms/ThreadWorkspace';
import { CourseChatTab } from '../../src/features/user/components/organisms/CourseChatTab';
import '../../src/index.css';

createRoot(document.getElementById('root')).render(
  React.createElement(BrowserRouter, null,
    React.createElement(ThemeContext.Provider, { value: {theme:'light',setTheme:()=>{}} },
      React.createElement('main', {style:{display:'flex',flexDirection:'column',height:'100dvh'}},
        React.createElement(ThreadWorkspace, {parentRoomID:'parent1',writable:true}),
        React.createElement(CourseChatTab, {roomId:'parent1',roomWritable:true}),
      ),
    ),
  ),
);
