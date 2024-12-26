import React, { useState } from 'react';
import Calculator from './Calculator';
import ShaderGen from './ShaderGen';

export default function TabbedInterface() {
  const [activeTab, setActiveTab] = useState('calculator');

  return (
    <div className="w-full max-w-4xl bg-blue-900 bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden">
      <div className="flex border-b border-blue-800">
        <button
          className={`flex-1 py-4 px-6 text-lg font-semibold focus:outline-none transition duration-200 ${
            activeTab === 'calculator' ? 'bg-blue-800 bg-opacity-50 text-blue-200' : 'text-blue-400 hover:bg-blue-800 hover:bg-opacity-25'
          }`}
          onClick={() => setActiveTab('calculator')}
        >
          Calculator
        </button>
        <button
          className={`flex-1 py-4 px-6 text-lg font-semibold focus:outline-none transition duration-200 ${
            activeTab === 'shadergen' ? 'bg-blue-800 bg-opacity-50 text-blue-200' : 'text-blue-400 hover:bg-blue-800 hover:bg-opacity-25'
          }`}
          onClick={() => setActiveTab('shadergen')}
        >
          ShaderGen
        </button>
      </div>
      <div className="p-8">
        {activeTab === 'calculator' ? <Calculator /> : <ShaderGen />}
      </div>
    </div>
  );
}

