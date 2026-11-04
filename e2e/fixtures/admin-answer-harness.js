import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AdminQuestionAnswers } from '../../src/features/admin/components/molecules/AdminQuestionAnswers';

function Harness() {
  const [count, setCount] = useState(2);
  const [resolved, setResolved] = useState(true);
  const [error, setError] = useState('');
  return React.createElement(BrowserRouter, null,
    React.createElement('main', null,
      React.createElement('p', null, `回答数: ${count} / ${resolved ? '解決済み' : '未解決'}`),
      React.createElement('p', { role: 'alert' }, error),
      React.createElement(AdminQuestionAnswers, {
        questionID: 'q1', addenda: [], answerCount: count,
        onQuestionAddendaChange: () => {}, onError: setError,
        onAnswerDeleted: wasBest => { setCount(v => v - 1); if (wasBest) setResolved(false); },
      }),
    ),
  );
}
createRoot(document.getElementById('root')).render(React.createElement(Harness));
