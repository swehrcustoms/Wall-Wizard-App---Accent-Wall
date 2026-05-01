import { useState, useCallback } from 'react';

let _show = null;

export function showToast(message, type = 'info') {
  _show?.({ message, type });
}

export function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  const show = useCallback(({ message, type }) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  _show = show;

  const colors = {
    info: 'bg-gray-900 text-white',
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-500 text-white',
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(({ id, message, type }) => (
        <div
          key={id}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg ${colors[type] ?? colors.info} animate-fade-in`}
        >
          {message}
        </div>
      ))}
    </div>
  );
}
