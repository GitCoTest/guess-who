import React, { useState, useEffect } from 'react';

const characters = [
    { id: 1, name: 'Alex', image: 'https://placehold.co/150x150/F4A261/000000?text=Alex' },
    { id: 2, name: 'Ben', image: 'https://placehold.co/150x150/2A9D8F/FFFFFF?text=Ben' },
    { id: 3, name: 'Carmen', image: 'https://placehold.co/150x150/E9C46A/000000?text=Carmen' },
    { id: 4, name: 'David', image: 'https://placehold.co/150x150/F4A261/000000?text=David' },
    { id: 5, name: 'Emily', image: 'https://placehold.co/150x150/264653/FFFFFF?text=Emily' },
    { id: 6, name: 'Frank', image: 'https://placehold.co/150x150/E76F51/000000?text=Frank' },
    { id: 7, name: 'Grace', image: 'https://placehold.co/150x150/F4A261/000000?text=Grace' },
    { id: 8, name: 'Henry', image: 'https://placehold.co/150x150/2A9D8F/FFFFFF?text=Henry' },
    { id: 9, name: 'Ivy', image: 'https://placehold.co/150x150/E9C46A/000000?text=Ivy' },
    { id: 10, name: 'Jack', image: 'https://placehold.co/150x150/F4A261/000000?text=Jack' },
    { id: 11, name: 'Kate', image: 'https://placehold.co/150x150/264653/FFFFFF?text=Kate' },
    { id: 12, name: 'Leo', image: 'https://placehold.co/150x150/E76F51/000000?text=Leo' },
];

export default function GuessWhoGame() {
    const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'won', 'lost'
    const [secretCharacter, setSecretCharacter] = useState(null);
    const [eliminatedChars, setEliminatedChars] = useState(new Set());
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState('');

    const startGame = () => {
        const randomChar = characters[Math.floor(Math.random() * characters.length)];
        setSecretCharacter(randomChar);
        setEliminatedChars(new Set());
        setQuestions([]);
        setGameState('playing');
    };

    const toggleEliminated = (charId) => {
        setEliminatedChars(prev => {
            const newSet = new Set(prev);
            if (newSet.has(charId)) {
                newSet.delete(charId);
            } else {
                newSet.add(charId);
            }
            return newSet;
        });
    };

    const askQuestion = (e) => {
        e.preventDefault();
        if (!currentQuestion.trim()) return;

        // Simple AI response logic
        const question = currentQuestion.toLowerCase();
        let answer = 'no';
        
        if (question.includes('glasses') && secretCharacter.name === 'Alex') answer = 'yes';
        if (question.includes('hat') && ['Ben', 'Henry'].includes(secretCharacter.name)) answer = 'yes';
        if (question.includes('brown') && ['Alex', 'Frank'].includes(secretCharacter.name)) answer = 'yes';

        setQuestions(prev => [...prev, { question: currentQuestion, answer }]);
        setCurrentQuestion('');
    };

    const makeGuess = (charId) => {
        if (charId === secretCharacter.id) {
            setGameState('won');
        } else {
            setGameState('lost');
        }
    };

    const resetGame = () => {
        setGameState('menu');
        setSecretCharacter(null);
        setEliminatedChars(new Set());
        setQuestions([]);
    };

    // Menu screen
    if (gameState === 'menu') {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white p-4">
                <h1 className="text-4xl font-bold mb-4 text-indigo-400">Guess Who? Game</h1>
                <p className="text-lg text-gray-300 mb-8">Single player practice mode</p>
                <button 
                    onClick={startGame}
                    className="bg-indigo-600