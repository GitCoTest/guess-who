import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';

// Import Firebase at top level
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, arrayUnion, serverTimestamp } from 'firebase/firestore';

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Character data
const defaultCharacters = [
    { id: 1, name: 'Alex', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
    { id: 2, name: 'Ben', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ben' },
    { id: 3, name: 'Carmen', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carmen' },
    { id: 4, name: 'David', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
    { id: 5, name: 'Emily', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily' },
    { id: 6, name: 'Frank', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frank' },
    { id: 7, name: 'Grace', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace' },
    { id: 8, name: 'Henry', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Henry' },
    { id: 9, name: 'Ivy', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivy' },
    { id: 10, name: 'Jack', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack' },
    { id: 11, name: 'Kate', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kate' },
    { id: 12, name: 'Leo', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo' },
    { id: 13, name: 'Maria', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria' },
    { id: 14, name: 'Noah', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah' },
    { id: 15, name: 'Olivia', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia' },
    { id: 16, name: 'Paul', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Paul' },
    { id: 17, name: 'Quinn', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quinn' },
    { id: 18, name: 'Rachel', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rachel' },
    { id: 19, name: 'Sam', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam' },
    { id: 20, name: 'Tina', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tina' },
    { id: 21, name: 'Uma', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Uma' },
    { id: 22, name: 'Victor', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Victor' },
    { id: 23, name: 'Wendy', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wendy' },
    { id: 24, name: 'Zane', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zane' }
];

// Helper functions
const generateGameId = () => Math.random().toString(36).substring(2, 8);

// Components - DEFINE ALL COMPONENTS FIRST
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

// Custom Character Form Component
const CustomCharacterForm = ({ customCharacters, setCustomCharacters, setCustomDeckProgress, onComplete, onCancel }) => {
    const [currentName, setCurrentName] = useState('');
    const [currentImage, setCurrentImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Image must be smaller than 5MB');
                return;
            }
            
            setCurrentImage(file);
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const addCharacter = async () => {
        if (!currentName.trim() || !currentImage) {
            alert('Please enter a name and select an image');
            return;
        }

        if (customCharacters.find(c => c.name.toLowerCase() === currentName.trim().toLowerCase())) {
            alert('Character name already exists');
            return;
        }

        setIsUploading(true);
        try {
            // Use base64 data URL (works without external services)
            const imageUrl = previewUrl;
            
            const newCharacter = {
                id: customCharacters.length + 1,
                name: currentName.trim(),
                image: imageUrl
            };

            const updatedCharacters = [...customCharacters, newCharacter];
            setCustomCharacters(updatedCharacters);
            setCustomDeckProgress(updatedCharacters.length);

            // Reset form
            setCurrentName('');
            setCurrentImage(null);
            setPreviewUrl('');
            
            // Auto-complete when 24 characters are added
            if (updatedCharacters.length === 24) {
                setTimeout(() => onComplete(), 500);
            }
        } catch (error) {
            alert('Failed to add character. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const removeCharacter = (id) => {
        const updatedCharacters = customCharacters.filter(c => c.id !== id);
        // Re-index the remaining characters
        const reindexedCharacters = updatedCharacters.map((char, index) => ({
            ...char,
            id: index + 1
        }));
        setCustomCharacters(reindexedCharacters);
        setCustomDeckProgress(reindexedCharacters.length);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Character Form */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Add New Character</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Character Name</label>
                        <input
                            type="text"
                            value={currentName}
                            onChange={(e) => setCurrentName(e.target.value)}
                            className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                            placeholder="Enter character name"
                            maxLength={20}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Character Photo</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full bg-gray-700 text-white p-3 rounded border border-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                        />
                        <p className="text-xs text-gray-400 mt-1">Max size: 5MB. Recommended: Square images</p>
                    </div>

                    {previewUrl && (
                        <div className="text-center">
                            <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover rounded mx-auto" />
                        </div>
                    )}

                    <button
                        onClick={addCharacter}
                        disabled={isUploading || !currentName.trim() || !currentImage}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded transition-colors"
                    >
                        {isUploading ? 'Adding...' : 'Add Character'}
                    </button>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Cancel
                    </button>
                    
                    {customCharacters.length === 24 && (
                        <button
                            onClick={onComplete}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Create Game
                        </button>
                    )}
                </div>
            </div>

            {/* Character Grid */}
            <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">Your Characters ({customCharacters.length}/24)</h3>
                
                <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {customCharacters.map(char => (
                        <div key={char.id} className="relative group">
                            <img src={char.image} alt={char.name} className="w-full h-20 object-cover rounded" />
                            <p className="text-xs text-center mt-1 truncate">{char.name}</p>
                            <button
                                onClick={() => removeCharacter(char.id)}
                                className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    
                    {/* Empty slots */}
                    {Array.from({length: 24 - customCharacters.length}).map((_, i) => (
                        <div key={`empty-${i}`} className="w-full h-20 bg-gray-700 rounded border-2 border-dashed border-gray-600 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">Empty</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// MAIN COMPONENT
export default function GuessWhoGame() {
    const router = useRouter();
    
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
    const [showCharacterSelection, setShowCharacterSelection] = useState(false);
    const [selectedCharacter, setSelectedCharacter] = useState(null);

    // Custom deck states
    const [showDeckSelection, setShowDeckSelection] = useState(false);
    const [deckType, setDeckType] = useState('standard');
    const [customCharacters, setCustomCharacters] = useState([]);
    const [isCreatingCustomDeck, setIsCreatingCustomDeck] = useState(false);
    const [customDeckProgress, setCustomDeckProgress] = useState(0);

    const chatEndRef = useRef(null);

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

    // COMBINED useEffect
    useEffect(() => {
        let unsubscribeAuth = null;
        let unsubscribeGame = null;

        // Firebase Auth Setup
        const setupAuth = () => {
            unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
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
        };

        // URL Detection
        const checkURL = () => {
            if (typeof window !== 'undefined') {
                const path = window.location.pathname;
                if (path.startsWith('/play/')) {
                    const id = path.split('/play/')[1];
                    if (id && id !== gameId) {
                        console.log('Setting game ID from URL:', id);
                        setGameId(id);
                        setGameState('waiting');
                    }
                }
            }
        };

        // Game Listener Setup
        const setupGameListener = () => {
            if (!gameId || !user || !db) return;

            console.log('Setting up game listener for:', gameId, 'user:', user.uid);
            const gameRef = doc(db, 'games', gameId);
            
            unsubscribeGame = onSnapshot(gameRef, 
                async (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        console.log("Game data updated:", data);
                        setGameData(data);
                        
                        // Update game state based on data
                        if (data.gameState?.status === 'waiting') {
                            setGameState('waiting');
                        } else if (data.gameState?.status === 'character-selection') {
                            setGameState('character-selection');
                            if (!data.players[user.uid]?.hasSelectedCharacter) {
                                setShowCharacterSelection(true);
                            }
                        } else if (data.gameState?.status === 'playing') {
                            setGameState('playing');
                        } else if (data.gameState?.status === 'finished') {
                            setGameState('finished');
                        }

                        // Auto-join logic
                        const currentPlayers = Object.keys(data.players || {});
                        const isPlayerInGame = currentPlayers.includes(user.uid);
                        const hasSpace = currentPlayers.length < 2;
                        
                        if (data.gameState?.status === 'waiting' && !isPlayerInGame && hasSpace) {
                            console.log('Auto-joining game...');
                            try {
                                await joinGame();
                            } catch (error) {
                                console.error('Auto-join failed:', error);
                            }
                        }

                        // Character selection completion check
                        if (data.gameState?.status === 'character-selection') {
                            const players = Object.values(data.players || {});
                            const playersWithCharacters = players.filter(p => p.hasSelectedCharacter);
                            
                            if (playersWithCharacters.length === 2 && data.hostId === user?.uid) {
                                console.log('Both players selected characters, starting game...');
                                try {
                                    const gameRef = doc(db, 'games', gameId);
                                    const playerKeys = Object.keys(data.players);
                                    const player1Id = playerKeys.find(id => data.players[id].joinOrder === 1);
                                    
                                    await updateDoc(gameRef, {
                                        'gameState.status': 'playing',
                                        'gameState.currentPlayerId': player1Id,
                                        chat: arrayUnion({
                                            userId: 'System',
                                            message: 'Both players have chosen! Game begins now. Player 1 goes first.',
                                            timestamp: new Date()
                                        })
                                    });
                                } catch (error) {
                                    console.error("Error starting actual game:", error);
                                }
                            }
                        }

                        // Auto-scroll chat
                        setTimeout(() => {
                            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);

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
        };

        setupAuth();
        checkURL();
        
        if (gameId && user) {
            setupGameListener();
        }

        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
            if (unsubscribeGame) unsubscribeGame();
        };
    }, [gameId, user]);

    // Game functions
    const joinGame = async () => {
        if (!user || !gameId || !db) {
            console.error('Missing requirements for join:', { user: !!user, gameId, db: !!db });
            return;
        }
        
        try {
            console.log('Attempting to join game:', gameId, 'as user:', user.uid);
            const gameRef = doc(db, 'games', gameId);
            
            await updateDoc(gameRef, {
                [`players.${user.uid}`]: {
                    id: user.uid,
                    joinOrder: 2,
                    name: 'Player 2'
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
            const gameRef = doc(db, 'games', newGameId);

            // Use custom characters if available, otherwise use default
            const gameCharacters = deckType === 'custom' && customCharacters.length === 24 
                ? customCharacters 
                : defaultCharacters;

            const initialData = {
                id: newGameId,
                hostId: user.uid,
                deckType: deckType,
                characters: gameCharacters,
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
            
            await updateDoc(gameRef, {
                chat: arrayUnion({
                    userId: 'System',
                    message: `Game created with ${deckType} deck. Waiting for another player...`,
                    timestamp: new Date()
                })
            });

            setGameId(newGameId);
            setGameState('waiting');
            setShowDeckSelection(false);
            setIsCreatingCustomDeck(false);
            
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

        const playerKeys = Object.keys(gameData.players);
        const safePlayer1Id = playerKeys.find(id => gameData.players[id].joinOrder === 1) || playerKeys[0];
        const safePlayer2Id = playerKeys.find(id => gameData.players[id].joinOrder === 2) || playerKeys[1];

        if (!safePlayer1Id || !safePlayer2Id) {
            console.error('Could not find both players!');
            setError('Could not find both players to start game');
            return;
        }

        try {
            const gameRef = doc(db, 'games', gameId);
            await updateDoc(gameRef, {
                'gameState.status': 'character-selection',
                'gameState.currentPlayerId': safePlayer1Id,
                chat: arrayUnion({
                    userId: 'System',
                    message: 'Game started! Both players need to choose their secret character.',
                    timestamp: new Date()
                })
            });
            
            setShowCharacterSelection(true);
            console.log("Game started - character selection phase");
        } catch (error) {
            console.error("Error starting game:", error);
            setError(`Failed to start game: ${error.message}`);
        }
    };

    const selectCharacter = async (character) => {
        if (!gameId || !user || !db) return;

        try {
            console.log('Attempting to select character:', character.name);
            const gameRef = doc(db, 'games', gameId);
            
            await updateDoc(gameRef, {
                [`players.${user.uid}.secretCharacter`]: character,
                [`players.${user.uid}.hasSelectedCharacter`]: true,
                chat: arrayUnion({
                    userId: 'System',
                    message: `${me?.name || 'Player'} has chosen their secret character.`,
                    timestamp: new Date()
                })
            });
            
            setSelectedCharacter(character);
            setShowCharacterSelection(false);
            console.log("Character selected:", character.name);
        } catch (error) {
            console.error("Error selecting character:", error);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!gameId || !chatInput.trim() || !user || !db) return;

        try {
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
        if (!gameId || !questionInput.trim() || !user || !me || !opponent || !db) return;

        try {
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
                    message: `${me.name} asked: "${questionInput.trim()}" - Waiting for ${opponent.name} to answer...`,
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
            const gameRef = doc(db, 'games', gameId);
            await updateDoc(gameRef, {
                questions: updatedQuestions,
                'gameState.currentPlayerId': user.uid,
                chat: arrayUnion({
                    userId: 'System',
                    message: `${me.name} answered: ${answer.toUpperCase()}. Now it's ${me.name}'s turn to ask a question!`,
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
        setShowDeckSelection(false);
        setIsCreatingCustomDeck(false);
        setCustomCharacters([]);
        setCustomDeckProgress(0);
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

    // Error state
    if (error) {
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
                <div className="text-center bg-gray-800 p-8 rounded-lg max-w-md">
                    <h1 className="text-2xl font-bold mb-4 text-red-400">Error</h1>
                    <p className="mb-4 text-gray-300 text-sm">{error}</p>
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

    // Custom Character Creation Screen
    if (isCreatingCustomDeck) {
        return (
            <div className="bg-gray-900 min-h-screen text-white p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold mb-2">Create Custom Character Deck</h1>
                        <p className="text-gray-400">Add 24 unique characters with names and photos</p>
                        <div className="bg-gray-800 rounded-full h-4 mt-4">
                            <div 
                                className="bg-purple-600 h-4 rounded-full transition-all duration-300"
                                style={{width: `${(customDeckProgress / 24) * 100}%`}}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">{customDeckProgress} / 24 characters added</p>
                    </div>

                    <CustomCharacterForm 
                        customCharacters={customCharacters}
                        setCustomCharacters={setCustomCharacters}
                        setCustomDeckProgress={setCustomDeckProgress}
                        onComplete={() => {
                            setIsCreatingCustomDeck(false);
                            createGame();
                        }}
                        onCancel={() => {
                            setIsCreatingCustomDeck(false);
                            setShowDeckSelection(false);
                            setCustomCharacters([]);
                            setCustomDeckProgress(0);
                        }}
                    />
                </div>
            </div>
        );
    }

    // Menu state
    if (gameState === 'menu') {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white p-4">
                <div className="text-center max-w-md w-full">
                    <h1 className="text-4xl font-bold mb-4 text-indigo-400">Guess Who? Online</h1>
                    <p className="text-lg text-gray-300 mb-8">Play the classic guessing game with a friend!</p>
                    
                    {!showDeckSelection ? (
                        <button 
                            onClick={() => setShowDeckSelection(true)} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
                        >
                            Create New Game
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold mb-4">Choose Your Character Deck</h2>
                            
                            <button
                                onClick={() => {
                                    setDeckType('standard');
                                    createGame();
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors mb-3"
                            >
                                🎲 Standard Deck
                                <p className="text-sm text-green-200 mt-1">24 pre-made characters</p>
                            </button>
                            
                            <button
                                onClick={() => {
                                    setDeckType('custom');
                                    setIsCreatingCustomDeck(true);
                                }}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors mb-3"
                            >
                                🎨 Custom Deck
                                <p className="text-sm text-purple-200 mt-1">Create your own 24 characters</p>
                            </button>
                            
                            <button
                                onClick={() => setShowDeckSelection(false)}
                                className="text-gray-400 hover:text-white underline"
                            >
                                Back
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="mt-8 text-center text-gray-500">
                    <p>User ID: <span className="font-mono bg-gray-800 p-1 rounded text-xs">{user?.uid?.substring(0, 8)}...</span></p>
                </div>
            </div>
        );
    }

    // Character Selection Modal
    if (showCharacterSelection || (gameData?.gameState?.status === 'character-selection' && !me?.hasSelectedCharacter)) {
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white p-4">
                <div className="bg-gray-800 p-6 rounded-lg max-w-4xl w-full">
                    <h2 className="text-2xl font-bold mb-4 text-center">Choose Your Secret Character</h2>
                    <p className="text-center text-gray-400 mb-6">
                        Select the character your opponent will try to guess:
                    </p>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-96 overflow-y-auto">
                        {gameData?.characters?.map(char => (
                            <div
                                key={char.id}
                                onClick={() => selectCharacter(char)}
                                className="cursor-pointer hover:bg-gray-700 p-2 rounded transition-all hover:scale-105 border-2 border-transparent hover:border-indigo-500"
                            >
                                <img src={char.image} alt={char.name} className="w-full rounded mb-1" />
                                <p className="text-xs text-center">{char.name}</p>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-4 text-center text-sm text-gray-500">
                        Click on a character to select them as your secret character
                    </div>
                </div>
            </div>
        );
    }

    // Waiting for other player to choose
    if (gameData?.gameState?.status === 'character-selection' && me?.hasSelectedCharacter) {
        const players = Object.values(gameData.players || {});
        const playersWithCharacters = players.filter(p => p.hasSelectedCharacter);
        
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white p-4">
                <div className="text-center bg-gray-800 p-8 rounded-lg">
                    <h2 className="text-2xl font-bold mb-4">Waiting for opponent...</h2>
                    <p className="text-gray-400 mb-4">You chose: <span className="text-indigo-400 font-bold">{me.secretCharacter?.name}</span></p>
                    <p className="text-gray-500">Waiting for the other player to choose their character.</p>
                    <div className="mt-4 text-sm text-gray-600">
                        Players ready: {playersWithCharacters.length} / 2
                    </div>
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
                    
                    {playerIds.length < 2 && (
                        <div className="mb-4 p-3 bg-red-900/30 rounded border border-red-600">
                            <p className="text-red-400 mb-2 text-sm">Auto-join not working?</p>
                            <button 
                                onClick={async () => {
                                    console.log('Manual join clicked');
                                    await joinGame();
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            >
                                🚨 JOIN GAME MANUALLY
                            </button>
                        </div>
                    )}
                    
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
                        <br />
                        Deck: {gameData?.deckType || 'standard'}
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
                            <h2 className="text-lg font-bold mb-4">
                                Characters - Click to eliminate 
                                <span className="text-sm text-gray-400 ml-2">
                                    ({gameData?.deckType === 'custom' ? 'Custom' : 'Standard'} deck)
                                </span>
                            </h2>
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