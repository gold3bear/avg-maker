import React from 'react';

export interface AIMessageData {
  id: number;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

interface AIMessageProps {
  message: AIMessageData;
}

const formatTime = (date: Date) =>
  date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

export const AIMessage: React.FC<AIMessageProps> = ({ message }) => {
  const isAI = message.type === 'ai';
  return (
    <div className={`text-sm ${isAI ? 'text-left' : 'text-right'}`}>
      <div
        className={`rounded px-3 py-2 inline-block whitespace-pre-wrap ${
          isAI ? 'bg-gray-700 text-gray-100' : 'bg-blue-600 text-white'
        }`}
      >
        {message.content}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};

export default AIMessage;
