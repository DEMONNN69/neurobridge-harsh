import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { UserRole } from '../../context/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotProps {
  userRole: UserRole;
}

const Chatbot: React.FC<ChatbotProps> = ({ userRole }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: userRole === 'teacher' 
        ? 'Hello teacher! How can I assist you today?' 
        : 'Hi there! I\'m here to help with your learning. What would you like help with today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInput('');

    // Simulate bot response
    setTimeout(() => {
      const botResponses = {
        teacher: [
          "I've analyzed the data and found that 3 students might need extra help with fractions.",
          "Here's a summary of class performance on the latest quiz: 80% passed with a score above 70%.",
          "I can help you create a personalized learning plan for students with dyslexia.",
          "Based on my analysis, visual learning materials might be more effective for this topic."
        ],
        student: [
          "That's a great question! Let me explain fractions in a simple way...",
          "I notice you're having trouble with this concept. Would you like me to explain it differently?",
          "You're making excellent progress! Keep up the good work.",
          "Let's break this problem down into smaller steps so it's easier to understand."
        ]
      };

      const randomResponse = botResponses[userRole][Math.floor(Math.random() * botResponses[userRole].length)];
      
      const botMessage: Message = {
        id: Date.now().toString(),
        content: randomResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Text-to-speech for bot response
      if (isSpeechEnabled && 'speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(randomResponse);
        speech.rate = 0.9; // Slightly slower for better comprehension
        window.speechSynthesis.speak(speech);
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      // Start recording
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        // This is a simplified version - in a real app you'd use the Web Speech API
        setIsRecording(true);
        // Simulate receiving speech after 3 seconds
        setTimeout(() => {
          setInput(prev => prev + (prev ? ' ' : '') + "Can you help me understand this math problem?");
          setIsRecording(false);
        }, 3000);
      } else {
        alert('Speech recognition is not supported in your browser.');
      }
    } else {
      // Stop recording
      setIsRecording(false);
    }
  };

  const toggleSpeech = () => {
    setIsSpeechEnabled(!isSpeechEnabled);
    if (isSpeechEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          AI Assistant
        </h1>
        <button
          onClick={toggleSpeech}
          className={`p-2 rounded-full ${
            isSpeechEnabled 
              ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' 
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {isSpeechEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex flex-col">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
                  message.sender === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.sender === 'user' 
                    ? 'text-indigo-200' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <button
              onClick={toggleRecording}
              className={`p-2 rounded-full mr-2 ${
                isRecording 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 animate-pulse' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={input.trim() === ''}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                  input.trim() === '' 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300'
                }`}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          
          {isRecording && (
            <div className="mt-2 text-sm text-center text-red-600 dark:text-red-400">
              Listening... Speak now
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;