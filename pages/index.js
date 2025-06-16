import React, { useState, useEffect, useMemo, useRef } from 'react';

// Firebase imports with error handling
let firebaseApp, auth, db;
let firebaseError = null;

try {
  const { initializeApp } = require('firebase/app');
  const { getAuth, onAuthStateChanged, signInAnonymously } = require('firebase/auth');
  const { getFirestore, doc, setDoc, updateDoc, onSnapshot, arrayUnion, serverTimestamp } = require('firebase/firestore');

  // Firebase Configuration
  const firebaseConfig = {
    apiKey: "AIzaSyC0fkCgGrLziXCuoImv54prBczTv4i59h8",
    authDomain: "guess-who-1978e.firebaseapp.com",
    projectId: "guess-who-1978e",
    storageBucket: "guess-who-1978e.firebasestorage.app",
    messagingSenderId: "1030946591786",
    appId: "1:1030946591786:web:dd5c91449f1ea72fee5f53",
    measurementId: "G-L721TEEPPT"
  };

  // Initialize Firebase
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
} catch (error) {
  console.error("Firebase initialization error:", error);
  firebaseError = error.message;
}

// Character data
const defaultCharacters = [
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
    { id: 13, name: 'Maria', image: 'https://placehold.co/150x150/F4A261/000000?text=Maria' },
    { id: 14, name: 'Noah', image: 'https://placehold.co/150x150/2A9D8F/FFFFFF?text=Noah' },
    { id: 15, name: 'Olivia', image: 'https://placehold.co/150x150/E9C46A/000000?text=Olivia' },
    { id: 16, name: 'Paul', image: 'https://placehold.co/150x150/F4A261/000000?text=Paul' },
    { id: 17, name: 'Quinn', image: 'https://placehold.co/150x150/264653/FFFFFF?text=Quinn' },
    { id: 18, name: 'Rachel', image: 'https://placehold.co/150x150/E76F51/000000?text=Rachel' },
    { id: 19, name: 'Sam', image: 'https://placehold.co/150x150/F4A261/000000?text=Sam' },
    { id: 20, name: 'Tina', image: 'https://placehold.co/150x150/2A9D8F/FFFFFF?text=Tina' },
    { id: 21, name: 'Uma', image: 'https://placehold.co/150x150/E9C46A/000000?text=Uma' },
    { id: 22, name: 'Victor', image: 'https://placehold.co/150x150/F4A261/000000?text=Victor' },
    { id: 23, name: 'Wendy', image: 'https://placehold.co/150x150/264653/FFFFFF?text=Wendy' },
    { id: 24, name: 'Zane', image: 'https://placehold.co/150x150/E76F51/000000?text=Zane' }
];

// Helper functions
const generateGameId = () => Math.random().toString(36).substring(2, 8);

// Components
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <p className="mt-4 text-lg">Loading...</p>
    </div>
);

const GameModal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 text-white border border-gray-600">
            <h2 className="text-xl font-bold mb-4 text-center">{title}</h2>
            <div className="text-center">{children}</div>
            {onClose && (
                <button 
                    onClick={onClose} 
                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Close
                </button>
            )}
        </div>
    </div>
);

export default function GuessWhoGame() {
    // State
    const [user, setUser] = useState(null);
    const [gameState, setGameState] = useState('menu');
    const [gameId, setGameId] = useState(null);
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eliminatedChars, setEliminatedChars] = useState(new Set());
    const [chatInput, setChatInput] = useState('');
    const [questionInput, setQuestionInput] = useState('');
    const [showGuessModal, setShowGuessModal] = useState(false);

    const chatEndRef = useRef(null);

    // Check for Firebase errors first
    useEffect(() => {
        if (firebaseError) {
            setError(`Firebase initialization failed: ${firebaseError}`);
            setLoading(false);
            return;
        }
    }, []);

    // Memoized values
    const playerIds = useMemo(() => 
        gameData?.players ? Object.keys(gameData.players) : [], 
        [gameData?.players]
    );
    
    const me = useMemo(() => 
        user && gameData?.players?.[user.uid], 
        [user, gameData?.players]
    );
    
    const opponent = useMemo(() => {
        const opponentId = playerIds.find(id => id !== user?.uid);
        return opponentId ? gameData.players[opponentId] : null;
    }, [playerIds, user?.uid, gameData?.players]);

    const isMyTurn = useMemo(() => 
        gameData?.gameState?.currentPlayerId === user?.uid, 
        [gameData?.gameState?.currentPlayerId, user?.uid]
    );

    const lastQuestion = useMemo(() => {
        const questions = gameData?.questions || [];
        return questions.length > 0 ? questions[questions.length - 1] : null;
    }, [gameData?.questions]);

    // Firebase Auth with better error handling
    useEffect(() => {
        if (firebaseError || !auth) {
            setLoading(false);
            return;
        }

        const { onAuthStateChanged, signInAnonymously } = require('firebase/auth');

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                console.log("User authenticated:", currentUser.uid);
                setUser(currentUser);
                setLoading(false);
            } else {
                console.log("No user, signing in anonymously...");
                try {
                    const result = await signInAnonymously(auth);
                    console.log("Anonymous sign-in successful:", result.user.uid);
                    setUser(result.user);
                } catch (error) {
                    console.error("Auth error:", error);
                    setError(`Authentication failed: ${error.message}`);
                } finally {
                    setLoading(false);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    // Check URL for game ID
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path.startsWith('/play/')) {
                const id = path.split('/play/')[1];
                if (id) {
                    setGameId(id);
                    setGameState('waiting');
                }
            }
        }
    }, []);

    // Listen to game updates
    useEffect(() => {
        if (!gameId || !user || !db) return;

        const { doc, onSnapshot } = require('firebase/firestore');

        const gameRef = doc(db, 'games', gameId);
        const unsubscribe = onSnapshot(gameRef, 
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    console.log("Game data updated:", data);
                    setGameData(data);
                    
                    // Update game state based on data
                    if (data.gameState?.status === 'waiting') {
                        setGameState('waiting');
                    } else if (data.gameState?.status === 'playing') {
                        setGameState('playing');
                    } else if (data.gameState?.status === 'finished') {
                        setGameState('finished');
                    }

                    // Auto-join if waiting and less than 2 players
                    if (data.gameState?.status === 'waiting' && 
                        !data.players?.[user.uid] && 
                        Object.keys(data.players || {}).length < 2) {
                        joinGame();
                    }
                } else {
                    console.log("Game not found");
                    setError("Game not found");
                    setGameState('menu');
                    setGameId(null);
                }
            },
            (error) => {
                console.error("Game listener error:", error);
                setError(`Failed to connect to game: ${error.message}`);
            }
        );

        return () => unsubscribe();
    }, [gameId, user]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameData?.chat]);

    // Game functions
    const joinGame = async () => {
        if (!user || !gameData || !db) return;
        
        try {
            const { doc, updateDoc } = require('firebase/firestore');
            const gameRef = doc(db, 'games', gameId);
            await updateDoc(gameRef, {
                [`players.${user.uid}`]: {
                    id: user.uid,
                    joinOrder: Object.keys(gameData.players || {}).length + 1,
                    name: `Player ${Object.keys(gameData.players || {}).length + 1}`
                }
            });
            console.log("Successfully joined game");
        } catch (error) {
            console.error("Error joining game:", error);
            setError(`Failed to join game: ${error.message}`);
        }
    };

    const createGame = async () => {
        if (!user || !db) return;

        const newGameId = generateGameId();
        console.log("Creating game with ID:", newGameId);

        try {
            const { doc, setDoc, updateDoc, arrayUnion, serverTimestamp } = require('firebase/firestore');
            const gameRef = doc(db, 'games', newGameId);

            const initialData = {
                id: newGameId,
                hostId: user.uid,
                characters: defaultCharacters,
                players: {
                    [user.uid]: { 
                        id: user.uid, 
                        joinOrder: 1, 
                        name: 'Player 1' 
                    }
                },
                gameState: {
                    status: 'waiting',
                    currentPlayerId: null,
                    winnerId: null,
                },
                questions: [],
                chat: [],
                createdAt: serverTimestamp(),
            };

            await setDoc(gameRef, initialData);
            console.log("Game created successfully");
            
            // Add initial chat message
            await updateDoc(gameRef, {
                chat: arrayUnion({
                    userId: 'System',
                    message: 'Game created. Waiting for another player...',
                    timestamp: new Date()
                })
            });

            setGameId(newGameId);
            setGameState('waiting');
            
            if (typeof window !== 'undefined') {
                window.history.pushState({}, '', `/play/${newGameId}`);
            }
        } catch (error) {
            console.error("Error creating game:", error);
            setError(`Failed to create game: ${error.message}`);
        }
    };

    const startGame = async () => {
        if (!gameId || !gameData || !user || !db) return;

        const chars = [...gameData.characters];
        const p1Secret = chars.splice(Math.floor(Math.random() * chars.length), 1)[0];
        const p2Secret = chars.splice(Math.floor(Math.random() * chars.length), 1)[0];
        
        const playerKeys = Object.keys(gameData.players);
        const player1Id = playerKeys.find(id => gameData.players[id].joinOrder === 1);
        const player2Id = playerKeys.find(id => gameData.players[id].joinOrder === 2);

        try {
            const { doc, updateDoc, arrayUnion } = require('firebase/firestore');
            const gameRef = doc(db, 'games', gameId);
            await updateDoc(gameRef, {
                [`players.${player1Id}.secretCharacter`]: p1Secret,
                [`players.${player2Id}.secretCharacter`]: p2Secret,
                'gameState.status': 'playing',
                'gameState.currentPlayerId': player1Id,
                chat: arrayUnion({
                    userId: 'System',
                    message: 'Game started! Player 1 goes first.',
                    timestamp: new Date()
                })
            });
            console.log("Game started successfully");
        } catch (error) {
            console.error("Error starting game:", error);
            setError(`Failed to start game: ${error.message}`);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!gameId || !chatInput.trim() || !user || !db) return;

        try {
            const { doc, updateDoc, arrayUnion } = require('firebase/firestore');
            const gameRef = doc(db, 'games', gameId);
            await updateDoc(gameRef, {
                chat: arrayUnion({
                    userId: user.uid,
                    message: chatInput.trim(),
                    timestamp: new Date()
                })
            });
            setChatInput('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const askQuestion = async (e) => {
        e.preventDefault();
        if (!gameId || !questionInput.trim() || !user || !me || !db) return;

        try {
            const { doc, updateDoc, arrayUnion } = require('firebase/firestore');
            const gameRef = doc(db, 'games', gameId);
            await updateDoc(gameRef, {
                questions: arrayUnion({
                    askerId: user.uid,
                    question: questionInput.trim(),
                    answer: null,
                    timestamp: new Date()
                }),
                chat: arrayUnion({
                    userId: 'System',
                    message: `${me.name} asked: "${questionInput.trim()}"`,
                    timestamp: new Date()
                })
            });
            setQuestionInput('');
        } catch (error) {
            console.error("Error asking question:", error);
        }
    };

    const answerQuestion = async (answer) => {
        if (!gameId || !lastQuestion || !user || !me || !opponent || !db) return;

        const updatedQuestions = [...(gameData.questions || [])];
        updatedQuestions[updatedQuestions.length - 1].answer = answer;

        try {
            const { doc, updateDoc, arrayUnion } = require('firebase/firestore');
            const gameRef = doc(db, 'games', gameId);
            await updateDoc(gameRef, {
                questions: updatedQuestions,
                'gameState.currentPlayerId': lastQuestion.askerId,
                chat: arrayUnion({
                    userId: 'System',
                    message: `${me.name} answered: ${answer.toUpperCase()}. It's ${opponent.name}'s turn.`,
                    timestamp: new Date()
                })
            });
        } catch (error) {
            console.error("Error answering question:", error);
        }
    };

    const makeGuess = async (characterId) => {
        if (!gameId || !user || !me || !opponent?.secretCharacter || !db) return;

        const isCorrect = characterId === opponent.secretCharacter.id;
        const character = gameData.characters.find(c => c.id === characterId);

        try {
            const { doc, updateDoc, arrayUnion } = require('firebase/firestore');
            const gameRef = doc(db, 'games', gameId);
            if (isCorrect) {
                await updateDoc(gameRef, {
                    'gameState.status': 'finished',
                    'gameState.winnerId': user.uid,
                    chat: arrayUnion({
                        userId: 'System',
                        message: `${me.name} guessed ${character.name} correctly and wins!`,
                        timestamp: new Date()
                    })
                });
            } else {
                await updateDoc(gameRef, {
                    'gameState.currentPlayerId': opponent.id,
                    chat: arrayUnion({
                        userId: 'System',
                        message: `${me.name} guessed ${character.name} incorrectly. ${opponent.name}'s turn.`,
                        timestamp: new Date()
                    })
                });
            }
            setShowGuessModal(false);
        } catch (error) {
            console.error("Error making guess:", error);
        }
    };

    const resetGame = () => {
        setGameState('menu');
        setGameId(null);
        setGameData(null);
        setEliminatedChars(new Set());
        setError(null);
        if (typeof window !== 'undefined') {
            window.history.pushState({}, '', '/');
        }
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

    const copyGameLink = () => {
        if (typeof window !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert('Game link copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy link');
            });
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // Error state with more details
    if (error) {
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
                <div className="text-center bg-gray-800 p-8 rounded-lg max-w-md">
                    <h1 className="text-2xl font-bold mb-4 text-red-400">Error</h1>
                    <p className="mb-4 text-gray-300 text-sm">{error}</p>
                    <div className="mb-4 text-xs text-gray-500">
                        <p>Debug info:</p>
                        <p>Firebase Error: {firebaseError ? 'Yes' : 'No'}</p>
                        <p>Auth: {auth ? 'Initialized' : 'Not initialized'}</p>
                        <p>DB: {db ? 'Initialized' : 'Not initialized'}</p>
                    </div>
                    <button 
                        onClick={() => {
                            setError(null);
                            if (typeof window !== 'undefined') {
                                window.location.reload();
                            }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded font-bold"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Menu state
    if (gameState === 'menu') {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white p-4">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4 text-indigo-400">Guess Who? Online</h1>
                    <p className="text-lg text-gray-300 mb-8">Play the classic guessing game with a friend!</p>
                    <button 
                        onClick={createGame} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
                    >
                        Create New Game
                    </button>
                </div>
                <div className="mt-8 text-center text-gray-500">
                    <p>User ID: <span className="font-mono bg-gray-800 p-1 rounded text-xs">{user?.uid?.substring(0, 8)}...</span></p>
                </div>
            </div>
        );
    }

    // Waiting state
    if (gameState === 'waiting') {
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white p-4">
                <div className="text-center bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700 max-w-md w-full">
                    <h2 className="text-2xl font-bold mb-4">Waiting for Player 2...</h2>
                    <p className="text-gray-400 mb-6">Share this link with a friend:</p>
                    <input 
                        type="text" 
                        readOnly 
                        value={typeof window !== 'undefined' ? window.location.href : ''}
                        className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 text-center mb-4 text-sm"
                        onFocus={(e) => e.target.select()}
                    />
                    <button 
                        onClick={copyGameLink}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors mb-6"
                    >
                        Copy Link
                    </button>
                    
                    {playerIds.length === 2 && gameData?.hostId === user?.uid && (
                        <div className="pt-6 border-t border-gray-600">
                            <p className="text-green-400 mb-4">Both players joined!</p>
                            <button
                                onClick={startGame}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                            >
                                Start Game
                            </button>
                        </div>
                    )}
                    
                    <div className="mt-4 text-sm text-gray-500">
                        Players: {playerIds.length} / 2
                    </div>
                    
                    <button 
                        onClick={resetGame}
                        className="mt-4 text-gray-400 hover:text-white underline"
                    >
                        Back to Menu
                    </button>
                </div>
            </div>
        );
    }

    // Game finished state
    if (gameState === 'finished') {
        const won = gameData?.gameState?.winnerId === user?.uid;
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center">
                <GameModal title="Game Over!" onClose={resetGame}>
                    <p className="text-xl mb-4">
                        {won ? "🎉 You Won! 🎉" : "😢 You Lost 😢"}
                    </p>
                    <p className="text-gray-300 mb-4">
                        The secret character was: <span className="font-bold text-indigo-400">{opponent?.secretCharacter?.name}</span>
                    </p>
                    <button 
                        onClick={resetGame}
                        className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2 rounded font-bold"
                    >
                        Play Again
                    </button>
                </GameModal>
            </div>
        );
    }

    // Main game view
    if (gameState === 'playing' && gameData) {
        return (
            <div className="bg-gray-900 text-white min-h-screen p-4">
                {/* Guess Modal */}
                {showGuessModal && (
                    <GameModal title="Make Your Final Guess!" onClose={() => setShowGuessModal(false)}>
                        <p className="mb-4 text-gray-300">Click on the character you think your opponent has:</p>
                        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                            {gameData.characters.map(char => (
                                <div 
                                    key={char.id} 
                                    onClick={() => makeGuess(char.id)} 
                                    className="cursor-pointer hover:bg-gray-700 p-2 rounded transition-colors"
                                >
                                    <img src={char.image} alt={char.name} className="w-full rounded" />
                                    <p className="text-xs text-center mt-1">{char.name}</p>
                                </div>
                            ))}
                        </div>
                    </GameModal>
                )}

                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Character Board */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="text-lg font-bold mb-4">Characters - Click to eliminate</h2>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {gameData.characters.map(char => {
                                    const isEliminated = eliminatedChars.has(char.id);
                                    return (
                                        <div 
                                            key={char.id} 
                                            onClick={() => toggleEliminated(char.id)}
                                            className={`cursor-pointer rounded overflow-hidden transition-all ${
                                                isEliminated ? 'opacity-30 grayscale' : 'hover:scale-105'
                                            }`}
                                        >
                                            <img src={char.image} alt={char.name} className="w-full" />
                                            <p className={`text-xs text-center p-1 ${
                                                isEliminated ? 'bg-red-900' : 'bg-gray-700'
                                            }`}>
                                                {char.name}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Side Panel */}
                    <div className="space-y-4">
                        {/* Game Info */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="text-lg font-bold mb-3">Game Info</h2>
                            
                            {me?.secretCharacter && (
                                <div className="mb-3 p-2 bg-indigo-900/50 rounded text-center">
                                    <p className="text-sm text-gray-300">Your secret character:</p>
                                    <p className="font-bold text-indigo-400">{me.secretCharacter.name}</p>
                                </div>
                            )}
                            
                            <div className={`p-2 rounded text-center ${
                                isMyTurn ? 'bg-green-600/30' : 'bg-red-600/30'
                            }`}>
                                <p className="font-bold">
                                    {isMyTurn ? "Your Turn!" : `${opponent?.name || 'Opponent'}'s Turn`}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <h2 className="text-lg font-bold mb-3">Actions</h2>
                            
                            {/* Answer question */}
                            {lastQuestion && !lastQuestion.answer && lastQuestion.askerId !== user?.uid && (
                                <div className="text-center">
                                    <p className="mb-2 text-gray-300">Opponent asks:</p>
                                    <p className="mb-3 p-2 bg-gray-700 rounded text-sm">
                                        "{lastQuestion.question}"
                                    </p>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => answerQuestion('yes')} 
                                            className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded font-bold"
                                        >
                                            Yes
                                        </button>
                                        <button 
                                            onClick={() => answerQuestion('no')} 
                                            className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded font-bold"
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* Ask question */}
                            {isMyTurn && (!lastQuestion || lastQuestion.answer) && (
                                <div>
                                    <form onSubmit={askQuestion} className="mb-3">
                                        <input 
                                            type="text"
                                            value={questionInput}
                                            onChange={(e) => setQuestionInput(e.target.value)}
                                            placeholder="Ask a yes/no question..."
                                            className="w-full bg-gray-700 p-2 rounded mb-2 text-sm"
                                        />
                                        <button 
                                            type="submit" 
                                            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded font-bold"
                                        >
                                            Ask Question
                                        </button>
                                    </form>
                                    <button 
                                        onClick={() => setShowGuessModal(true)} 
                                        className="w-full bg-yellow-600 hover:bg-yellow-700 py-2 rounded font-bold"
                                    >
                                        Make Final Guess
                                    </button>
                                </div>
                            )}
                            
                            {/* Waiting */}
                            {!isMyTurn && (!lastQuestion || lastQuestion.answer || lastQuestion.askerId === user?.uid) && (
                                <div className="text-center text-gray-400">
                                    <p>Waiting for opponent...</p>
                                </div>
                            )}
                        </div>

                        {/* Chat */}
                        <div className="bg-gray-800 p-4 rounded-lg h-64 flex flex-col">
                            <h2 className="text-lg font-bold mb-3">Chat</h2>
                            <div className="flex-1 overflow-y-auto mb-3 space-y-1">
                                {(gameData.chat || []).map((msg, index) => (
                                    <div key={index} className="text-sm">
                                        {msg.userId === 'System' ? (
                                            <p className="text-gray-400 italic text-center">
                                                {msg.message}
                                            </p>
                                        ) : (
                                            <p>
                                                <span className={`font-bold ${
                                                    msg.userId === user?.uid ? 'text-indigo-400' : 'text-green-400'
                                                }`}>
                                                    {gameData.players[msg.userId]?.name || 'Player'}:
                                                </span>
                                                <span className="ml-1">{msg.message}</span>
                                            </p>
                                        )}
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <form onSubmit={sendMessage}>
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full bg-gray-700 p-2 rounded text-sm"
                                />
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}