import React, { useState } from 'react';

export function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const MASTER_PIN = '1234'; // Change to your preferred PIN

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === MASTER_PIN) {
          onUnlock();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div 
      className="relative min-h-screen w-full flex flex-col items-center justify-between p-6 bg-cover bg-center bg-no-repeat select-none"
      style={{ backgroundImage: `url('/sovereign_logo.jpg')` }}
    >
      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-0"></div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-xs flex flex-col items-center my-auto space-y-8">
        
        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20">
            <img src="/sovereign_logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wider">SOVEREIGN TOOLS</h1>
          <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">Sovereignty & Privacy in Your Pocket</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex space-x-4 my-4">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > idx
                  ? error ? 'bg-red-500 border-red-500 scale-110' : 'bg-cyan-400 border-cyan-400 scale-110'
                  : 'border-zinc-500 bg-black/40'
              }`}
            />
          ))}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-16 rounded-full bg-zinc-900/80 border border-zinc-700/60 text-white text-xl font-bold hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center shadow-md"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-full bg-zinc-900/80 border border-zinc-700/60 text-white text-xl font-bold hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center shadow-md"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-16 rounded-full bg-zinc-900/40 border border-zinc-800 text-zinc-400 text-sm font-bold hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

      </div>

      {/* Footer Info */}
      <div className="relative z-10 text-center text-[10px] text-zinc-500 font-mono">
        🔒 Encrypted Local Sandbox
      </div>

    </div>
  );
}
