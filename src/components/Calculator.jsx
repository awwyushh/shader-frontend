import React, { useState } from 'react';

export default function Calculator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleCalculate = () => {
    try {
      // Note: Using eval() can be dangerous if the input is not properly sanitized
      const result = eval(input);
      setOutput(result.toString());
    } catch (error) {
      setOutput('Error');
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        className="w-full bg-blue-800 bg-opacity-50 text-blue-100 text-lg rounded-lg p-4 outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        placeholder="Enter expression..."
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

