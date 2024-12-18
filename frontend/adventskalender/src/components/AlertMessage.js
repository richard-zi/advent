import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const messages = {
  notAvailable: [
    "Ho ho ho! Noch nicht so voreilig!",
    "Geduld, junger Padawan!",
    "Tür ist noch im Winterschlaf...",
    "Netter Versuch, aber das Türchen hat noch Ruhepause!",
    "Sorry, dieses Türchen macht noch einen Powernap!",
    "Da war wohl jemand zu neugierig! 😉",
    "Nicht spicken - Vorfreude ist die schönste Freude!",
    "Diese Tür ist noch im Wartungsmodus... 🔧",
    "Komm später wieder, jetzt ist Siesta!",
    "Das Türchen ist noch beim Wellness-Tag..."
  ],
  error: [
    "Ups! Der Inhalt konnte nicht geladen werden... 😕",
    "Oh nein! Da ist etwas schiefgelaufen...",
    "Da hat der Weihnachtsmann wohl was verlegt!",
    "Content.exe hat nicht geklappt - Versuche es später nochmal!",
    "Houston, wir haben ein Problem mit dem Inhalt!",
    "Die Rentiere suchen noch nach dem Inhalt...",
    "Der Weihnachtself konnte den Inhalt nicht finden 🧝‍♂️",
    "Technische Schwierigkeiten in der Geschenkefabrik!",
    "Error 404: Weihnachtszauber temporarily unavailable",
    "Die Geschenkeproduktion stockt gerade... 🎁"
  ]
};

const AlertMessage = ({ isVisible, onClose, darkMode, type = 'notAvailable' }) => {
  const [isShowing, setIsShowing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isVisible) {
      const messageList = messages[type] || messages.notAvailable;
      setMessage(messageList[Math.floor(Math.random() * messageList.length)]);
      setIsShowing(true);
      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(onClose, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, type]);

  if (!isVisible && !isShowing) return null;

  return (
    <div
      className={`
        fixed bottom-4 right-4 max-w-sm w-full transform transition-all duration-300 ease-in-out z-50
        ${isShowing ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}
      `}
    >
      <div className={`
        rounded-lg shadow-lg p-4 pr-12 
        ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'}
        flex items-start space-x-3
      `}>
        <AlertTriangle className={`h-5 w-5 ${type === 'error' ? 'text-red-500' : 'text-yellow-500'} mt-0.5`} />
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsShowing(false);
            setTimeout(onClose, 300);
          }}
          className={`
            absolute right-4 top-4 
            ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}
            transition-colors duration-200
          `}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AlertMessage;