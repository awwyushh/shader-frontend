import React, { useState, useEffect } from 'react';
import init, { calculate } from '../pkg/simple_calcy.js'; // Adjust the path as necessary

export default function Calculator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [wasmInitialized, setWasmInitialized] = useState(false);

  useEffect(() => {
    // Initialize the WASM module
    init()
      .then(() => {
        setWasmInitialized(true);
      })
      .catch((error) => {
        console.error('Failed to initialize WebAssembly:', error);
      });
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCalculate();
    }
  };

  const handleCalculate = () => {
    if (!wasmInitialized) {
      setOutput('WASM not initialized');
      return;
    }

    try {
      // Use the calculate function exported from WebAssembly
      const result = calculate(input);
      setOutput(result.toString());
    } catch (error) {
      setOutput('Error');
      console.error('Calculation error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown} // Add this line
        className="w-full bg-blue-800 bg-opacity-50 text-blue-100 text-lg rounded-lg p-4 outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        placeholder="Enter expression (e.g., 3 + 5 * (2 - 1))..."
      />
      <div className="bg-blue-700 bg-opacity-50 rounded-lg p-4">
        <p className="text-blue-100 text-xl font-semibold break-words">{output || 'Result'}</p>
      </div>
      <button
        onClick={handleCalculate}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition duration-200"
      >
        Calculate
      </button>
    </div>
  );
}
