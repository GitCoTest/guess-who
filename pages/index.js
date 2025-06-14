import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from '@firebase/app';
import { getAuth } from '@firebase/auth';
import { getFirestore } from '@firebase/firestore';
// --- Firebase Configuration ---
// This configuration is automatically provided in the execution environment.
const firebaseConfig = typeof __firebase_config !== 'undefined' 
    ? JSON.parse(__firebase_config) 
    : { apiKey: "YOUR_API_KEY", authDomain: "YOUR_AUTH_DOMAIN", projectId: "YOUR_PROJECT_ID" };

// --- App ID ---
// The app ID is also provided by the environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-guess-who';

// --- Default Character Set ---
// A default set of characters to use if players don't upload their own.
const defaultCharacters = [
    { id: 1, name: 'Alex', image: 'https://placehold.co/150x150/F4A261/000000?text=Alex', features: { glasses: true, hat: false, hairColor: 'brown' } },
    { id: 2, name: 'Ben', image: 'https://placehold.co/150x150/2A9D8F/FFFFFF?text=Ben', features: { glasses: false, hat: true, hairColor: 'black' } },
    { id: 3, name: 'Carmen', image: 'https://placehold.co/150x150/E9C46A/000000?text=Carmen', features: { glasses: false, hat: false, hairColor: 'blonde' } },
    { id: 4, name: 'David', image: 'https://placehold.co/150x150/F4A261/000000?text=David', features: { glasses: true, hat: true, hairColor: 'red' } },
    { id: 5, name: 'Emily', image: 'https://placehold.co/150x150/264653/FFFFFF?text=Emily', features: { glasses: true, hat: false, hairColor: 'black' } },
    { id: 6, name: 'Frank', image: 'https://placehold.co/150x150/E76F51/000000?text=Frank', features: { glasses: false, hat: false, hairColor: 'brown' } },
    { id: 7, name: 'Grace', image: 'https://placehold.co/150x150/F4A261/000000?text=Grace', features: { glasses: true, hat: false, hairColor: 'blonde' } },
    { id: 8, name: 'Henry', image: 'https://placehold.co/150x150/2A9D8F/FFFFFF?text=Henry', features: { glasses: false, hat: true, hairColor: 'brown' } },
    { id: 9, name: 'Ivy', image: 'https://placehold.co/150x150/E9C46A/000000?text=Ivy', features: { glasses: true, hat: true, hairColor: 'black' } },
    { id: 10, name: 'Jack', image: 'https://placehold.co/150x150/F4A261/000000?text=Jack', features: { glasses: false, hat: false, hairColor: 'red' } },
    { id: 11, name: 'Kate', image: 'https://placehold.co/150x150/264653/FFFFFF?text=Kate', features: { glasses: false, hat: true, hairColor: 'blonde' } },
    { id: 12, name: 'Leo', image: 'https://placehold.co/150x150/E76F51/000000?text=Leo', features: { glasses: true, hat: false, hairColor: 'brown' } },
    { id: 13, name: 'Maria', image: 'https://placehold.co/150x150/F4A261/000000?text=Maria', features: { glasses: true, hat: false, hairColor: 'black' } },
    { id: 14, name: 'Noah', image: 'https://placehold.co/150x150/2A9D8F/FFFFFF?text=Noah', features: { glasses: false, hat: true, hairColor: 'red' } },
    { id: 15, name: 'Olivia', image: 'https://placehold.co/150x150/E9C46A/000000?text=Olivia', features: { glasses: false, hat: false, hairColor: 'brown' } },
    { id: 16, name: 'Paul', image: 'https://placehold.co/150x150/F4A261/000000?text=Paul', features: { glasses: true, hat: true, hairColor: 'blonde' } },
    { id: 17, name: 'Quinn', image: 'https://placehold.co/150x150/264653/FFFFFF?text=Quinn', features: { glasses: false, hat: false, hairColor: 'black' } },
    { id: 18, name: 'Rachel', image: 'https://placehold.co/150x150/E76F51/000000?text=Rachel', features: { glasses: true, hat: false, hairColor: 'red' } },
    { id: 19, name: 'Sam', image: 'https://placehold.co/150x150/F4A261/000000?text=Sam', features: { glasses: false, hat: true, hairColor: 'brown' } },
    { id: 20, name: 'Tina', image: 'https://placehold.co/150x150/2A9D8F/FFFFFF?text=Tina', features: { glasses: true, hat: true, hairColor: 'blonde' } },
    { id: 21, name: 'Uma', image: 'https://placehold.co/150x150/E9C46A/000000?text=Uma', features: { glasses: false, hat: false, hairColor: 'black' } },
    { id: 22, name: 'Victor', image: 'https://placehold.co/150x150/F4A261/000000?text=Victor', features: { glasses: true, hat: false, hairColor: 'red' } },
    { id: 23, name: 'Wendy', image: 'https://placehold.co/150x150/264653/FFFFFF?text=Wendy', features: { glasses: false, hat: true, hairColor: 'brown' } },
    { id: 24, name: 'Zane', image: 'https://placehold.co/150x150/E76F51/000000?text=Zane', features: { glasses: true, hat: true, hairColor: 'black' } },
];

// --- Helper Functions ---
const generateGameId = () => Math.random().toString(36).substring(2, 8);

// --- React Components ---

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full text-white">
        <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-2 text-lg">Loading Game...</p>
    </div>
);

const GameModal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-sm w-full text-white border border-gray-600">
            <h2 className="text-2xl font-bold mb-4 text-center">{title}</h2>
            <div className="text-center">{children}</div>
            {onClose && (
                 <button onClick={onClose} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Close
                 </button>
            )}
        </div>
    </div>
);

const App = () => {
    // --- State Management ---
    const [page, setPage] = useState('home'); // 'home', 'game'
    const [gameId, setGameId] = useState(null);
    const [gameData, setGameData] = useState(null);
    const [userId, setUserId] = useState(null);
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [eliminatedChars, setEliminatedChars] = useState(new Set());
    const [chatInput, setChatInput] = useState('');
    const [questionInput, setQuestionInput] = useState('');
    const [isGuessing, setIsGuessing] = useState(false);

    const chatEndRef = useRef(null);

    // --- Memoized Values for Performance ---
    const playerIds = useMemo(() => gameData?.players ? Object.keys(gameData.players) : [], [gameData]);
    const me = useMemo(() => userId && gameData?.players?.[userId], [userId, gameData]);
    const opponent = useMemo(() => {
        const opponentId = playerIds.find(id => id !== userId);
        return opponentId ? gameData.players[opponentId] : null;
    }, [playerIds, userId, gameData]);
    const isMyTurn = useMemo(() => gameData?.gameState.currentPlayerId === userId, [gameData, userId]);
    const lastQuestion = useMemo(() => gameData?.questions?.[gameData.questions.length - 1], [gameData]);

    // --- Firebase Initialization and Auth ---
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        
        setAuth(authInstance);
        setDb(dbInstance);

        const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    await signInAnonymously(authInstance);
                } catch (error) {
                    console.error("Anonymous sign-in failed:", error);
                }
            }
        });

        return () => unsubscribe();
    }, []);
    
    // --- Game Logic and Real-time Sync ---
    useEffect(() => {
        if (!db || !gameId) return;

        // Listen for real-time updates to the game document
        const gameRef = doc(db, `artifacts/${appId}/public/data/games`, gameId);
        const unsubscribe = onSnapshot(gameRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setGameData(data);
                // When a new player joins a waiting game, they add themselves to the players list
                if (userId && data.gameState.status === 'waiting' && !data.players[userId] && Object.keys(data.players).length < 2) {
                     updateDoc(gameRef, {
                        [`players.${userId}`]: {
                            id: userId,
                            joinOrder: Object.keys(data.players).length + 1,
                            name: `Player ${Object.keys(data.players).length + 1}`
                        }
                    });
                }
            } else {
                console.log("Game not found!");
                // Handle game not found, e.g., redirect to home
                setPage('home');
                setGameId(null);
            }
        });

        return () => unsubscribe();

    }, [db, gameId, userId]);
    
    // Auto-scroll chat to the bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameData?.chat]);
    
     // --- Handle URL on initial load ---
    useEffect(() => {
        const path = window.location.pathname;
        if (path.startsWith('/play/')) {
            const id = path.split('/play/')[1];
            if (id) {
                setGameId(id);
                setPage('game');
            }
        }
    }, []);

    // --- Game Actions ---
    const createGame = async () => {
        if (!db || !userId) return;
        const newGameId = generateGameId();
        const gameRef = doc(db, `artifacts/${appId}/public/data/games`, newGameId);

        const initialGameData = {
            id: newGameId,
            hostId: userId,
            characters: defaultCharacters,
            players: {
                [userId]: { id: userId, joinOrder: 1, name: 'Player 1' }
            },
            gameState: {
                status: 'waiting', // 'waiting', 'playing', 'finished'
                currentPlayerId: null,
                winnerId: null,
            },
            questions: [],
            chat: [{
                userId: 'System',
                message: 'Game created. Waiting for another player...',
                timestamp: new Date() // FIX: Cannot use serverTimestamp in an array on create
            }],
            createdAt: serverTimestamp(),
        };

        try {
            await setDoc(gameRef, initialGameData);
            setGameId(newGameId);
            setPage('game');
            window.history.pushState({}, '', `/play/${newGameId}`);
        } catch (error) {
            console.error("Error creating game:", error);
        }
    };

    const startGame = async () => {
        if (!db || !gameId || !gameData) return;
        
        // Randomly assign secret characters
        const availableChars = [...gameData.characters];
        const p1Index = Math.floor(Math.random() * availableChars.length);
        const p1SecretChar = availableChars.splice(p1Index, 1)[0];

        const p2Index = Math.floor(Math.random() * availableChars.length);
        const p2SecretChar = availableChars.splice(p2Index, 1)[0];
        
        const playerKeys = Object.keys(gameData.players);
        const player1Id = playerKeys.find(id => gameData.players[id].joinOrder === 1);
        const player2Id = playerKeys.find(id => gameData.players[id].joinOrder === 2);
        
        await updateDoc(doc(db, `artifacts/${appId}/public/data/games`, gameId), {
            [`players.${player1Id}.secretCharacter`]: p1SecretChar,
            [`players.${player2Id}.secretCharacter`]: p2SecretChar,
            'gameState.status': 'playing',
            'gameState.currentPlayerId': player1Id, // Player 1 starts
             chat: arrayUnion({
                userId: 'System',
                message: 'Game started! Player 1, ask your first question.',
                timestamp: new Date() // FIX
            })
        });
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
    
    const sendChatMessage = async (e) => {
        e.preventDefault();
        if (!db || !gameId || !chatInput.trim()) return;

        await updateDoc(doc(db, `artifacts/${appId}/public/data/games`, gameId), {
            chat: arrayUnion({
                userId: userId,
                message: chatInput,
                timestamp: new Date() // FIX
            })
        });
        setChatInput('');
    };
    
    const askQuestion = async (e) => {
        e.preventDefault();
        if (!db || !gameId || !questionInput.trim()) return;
        
        await updateDoc(doc(db, `artifacts/${appId}/public/data/games`, gameId), {
            questions: arrayUnion({
                askerId: userId,
                question: questionInput,
                answer: null, // Awaiting answer
                timestamp: new Date() // FIX
            }),
             chat: arrayUnion({
                userId: 'System',
                message: `${me.name} asked: "${questionInput}"`,
                timestamp: new Date() // FIX
            })
        });
        setQuestionInput('');
    };

    const answerQuestion = async (answer) => {
        if (!db || !gameId || !lastQuestion) return;

        const updatedQuestions = [...gameData.questions];
        updatedQuestions[updatedQuestions.length - 1].answer = answer;

        await updateDoc(doc(db, `artifacts/${appId}/public/data/games`, gameId), {
            questions: updatedQuestions,
            'gameState.currentPlayerId': lastQuestion.askerId, // Switch turn back to asker
            chat: arrayUnion({
                userId: 'System',
                message: `${me.name} answered: "${answer.toUpperCase()}". It's ${opponent.name}'s turn.`,
                timestamp: new Date() // FIX
            })
        });
    };
    
    const makeFinalGuess = async (charId) => {
        if (!db || !gameId || !opponent.secretCharacter) return;
        
        const guessedCorrectly = charId === opponent.secretCharacter.id;
        
        if(guessedCorrectly) {
            await updateDoc(doc(db, `artifacts/${appId}/public/data/games`, gameId), {
                'gameState.status': 'finished',
                'gameState.winnerId': userId,
                chat: arrayUnion({
                    userId: 'System',
                    message: `${me.name} guessed ${gameData.characters.find(c => c.id === charId).name} and was CORRECT! ${me.name} wins!`,
                    timestamp: new Date() // FIX
                })
            });
        } else {
             await updateDoc(doc(db, `artifacts/${appId}/public/data/games`, gameId), {
                'gameState.currentPlayerId': opponent.id, // Wrong guess, opponent's turn
                chat: arrayUnion({
                    userId: 'System',
                    message: `${me.name} guessed ${gameData.characters.find(c => c.id === charId).name} and was WRONG! It is now ${opponent.name}'s turn.`,
                    timestamp: new Date() // FIX
                })
            });
        }
        setIsGuessing(false);
    };

    const resetGame = () => {
        window.location.href = '/';
    }


    // --- Render Logic ---

    if (!userId || !db) {
        return (
            <div className="bg-gray-900 min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    if (page === 'home') {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white p-4">
                <div className="text-center">
                    <h1 className="text-5xl font-extrabold mb-2 text-indigo-400">Guess Who? Online</h1>
                    <p className="text-lg text-gray-300 mb-8">The classic mystery face-guessing game, with a friend.</p>
                    <button 
                        onClick={createGame} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all"
                    >
                        Create New Game
                    </button>
                </div>
                <div className="mt-12 text-center text-gray-500">
                    <p>Your User ID: <span className="font-mono bg-gray-800 p-1 rounded">{userId}</span></p>
                </div>
            </div>
        );
    }
    
    if (page === 'game') {
        if (!gameData) {
            return (
                <div className="bg-gray-900 min-h-screen flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            );
        }

        const mySecretChar = me?.secretCharacter;
        
        // --- Render different game states ---
        if (gameData.gameState.status === 'waiting') {
             return (
                <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white p-4">
                    <div className="text-center bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700">
                        <h2 className="text-2xl font-bold mb-4">Waiting for Player 2...</h2>
                        <p className="text-gray-400 mb-6">Share this link with a friend to play:</p>
                        <input 
                            type="text" 
                            readOnly 
                            value={window.location.href}
                            className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600 text-center mb-4"
                            onFocus={(e) => e.target.select()}
                        />
                        <button 
                           onClick={() => navigator.clipboard.writeText(window.location.href)}
                           className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                            Copy Link
                        </button>
                        <div className="mt-6 text-sm text-gray-500">
                            Players connected: {playerIds.length} / 2
                        </div>
                    </div>
                </div>
             );
        }

        if (gameData.gameState.status === 'playing' && playerIds.length === 2 && !mySecretChar) {
             return (
                <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white p-4">
                    <div className="text-center bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700">
                        <h2 className="text-2xl font-bold mb-4">Both players have joined!</h2>
                        {gameData.hostId === userId ? (
                            <>
                                <p className="text-gray-400 mb-6">As the host, you can start the game.</p>
                                <button
                                    onClick={startGame}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-xl shadow-lg transform hover:scale-105 transition-all"
                                >
                                    Start Game
                                </button>
                            </>
                        ) : (
                            <p className="text-gray-400 mb-6">Waiting for the host ({gameData.players[gameData.hostId].name}) to start the game...</p>
                        )}
                    </div>
                </div>
            );
        }
        
        // --- Main Game View ---
        return (
            <div className="bg-gray-900 text-white min-h-screen p-2 sm:p-4 lg:p-6">
                
                {gameData.gameState.status === 'finished' && (
                    <GameModal title="Game Over!" onClose={resetGame}>
                        <p className="text-xl mb-4">{gameData.gameState.winnerId === userId ? "🎉 You Won! 🎉" : "😢 You Lost 😢"}</p>
                        <p className="text-gray-300">The opponent's character was <span className="font-bold text-indigo-400">{opponent?.secretCharacter?.name}</span>.</p>
                    </GameModal>
                )}
                
                 {isGuessing && (
                    <GameModal title="Make Your Final Guess!" onClose={() => setIsGuessing(false)}>
                        <p className="mb-4 text-gray-300">Click on the character you think your opponent has. If you're wrong, you lose your turn!</p>
                         <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                            {gameData.characters.map(char => (
                                <div key={char.id} onClick={() => makeFinalGuess(char.id)} className="cursor-pointer transition-transform transform hover:scale-110">
                                    <img src={char.image} alt={char.name} className="w-full rounded-md" />
                                    <p className="text-xs text-center mt-1">{char.name}</p>
                                </div>
                            ))}
                        </div>
                    </GameModal>
                )}

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Main Game Board */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
                             <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 md:gap-4">
                                {gameData.characters.map(char => {
                                    const isEliminated = eliminatedChars.has(char.id);
                                    return (
                                        <div 
                                            key={char.id} 
                                            onClick={() => toggleEliminated(char.id)}
                                            className={`cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ${isEliminated ? 'opacity-30 grayscale' : 'hover:scale-105 hover:shadow-2xl'}`}
                                        >
                                            <img src={char.image} alt={char.name} className="w-full h-auto block" />
                                            <p className={`text-center text-xs sm:text-sm p-1 ${isEliminated ? 'bg-red-900' : 'bg-gray-700'}`}>{char.name}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Side Panel: Info, Actions, Chat */}
                    <div className="flex flex-col gap-4">
                        {/* Player Info */}
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
                            <h2 className="text-xl font-bold border-b border-gray-600 pb-2 mb-3">Game Info</h2>
                            {mySecretChar && (
                                <div className="mb-4 p-3 bg-indigo-900/50 rounded-lg text-center">
                                    <p className="text-sm text-gray-300">Your Secret Character is:</p>
                                    <p className="text-lg font-bold text-indigo-300">{mySecretChar.name}</p>
                                </div>
                            )}
                             <div className={`p-3 rounded-lg text-center transition-colors ${isMyTurn ? 'bg-green-600/70' : 'bg-red-600/70'}`}>
                               <p className="font-bold text-lg">{isMyTurn ? "It's Your Turn!" : `Waiting for ${opponent?.name}...`}</p>
                            </div>
                        </div>

                        {/* Action Panel */}
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
                            <h2 className="text-xl font-bold border-b border-gray-600 pb-2 mb-3">Actions</h2>
                            {/* Opponent needs to answer */}
                            {lastQuestion && !lastQuestion.answer && lastQuestion.askerId !== userId && (
                                <div className="text-center">
                                    <p className="mb-2 text-gray-300">Opponent asks:</p>
                                    <p className="text-lg font-semibold mb-4 bg-gray-700 p-3 rounded-md">"{lastQuestion.question}"</p>
                                    <div className="flex justify-center gap-4">
                                        <button onClick={() => answerQuestion('yes')} className="bg-green-600 hover:bg-green-700 font-bold py-2 px-6 rounded-lg">Yes</button>
                                        <button onClick={() => answerQuestion('no')} className="bg-red-600 hover:bg-red-700 font-bold py-2 px-6 rounded-lg">No</button>
                                    </div>
                                </div>
                            )}
                            
                            {/* You need to ask a question */}
                            {isMyTurn && (!lastQuestion || lastQuestion.answer) && (
                                <div>
                                    <form onSubmit={askQuestion}>
                                        <input 
                                            type="text"
                                            value={questionInput}
                                            onChange={(e) => setQuestionInput(e.target.value)}
                                            placeholder="e.g., Does your character wear glasses?"
                                            className="w-full bg-gray-700 p-2 rounded-md border border-gray-600 mb-2"
                                        />
                                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-2 px-4 rounded-lg">Ask Question</button>
                                    </form>
                                    <div className="relative flex py-3 items-center">
                                        <div className="flex-grow border-t border-gray-600"></div>
                                        <span className="flex-shrink mx-4 text-gray-400">OR</span>
                                        <div className="flex-grow border-t border-gray-600"></div>
                                    </div>
                                     <button onClick={() => setIsGuessing(true)} className="w-full bg-yellow-600 hover:bg-yellow-700 font-bold py-2 px-4 rounded-lg">Make Final Guess</button>
                                </div>
                            )}

                            {/* Waiting for opponent's action */}
                            {(!isMyTurn || (lastQuestion && !lastQuestion.answer && lastQuestion.askerId === userId)) && (
                                <div className="text-center text-gray-400">
                                    <p>{lastQuestion && !lastQuestion.answer ? 'Waiting for opponent to answer...' : 'Waiting for opponent to ask a question...'}</p>
                                </div>
                            )}
                        </div>

                        {/* Chat Box */}
                        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 flex flex-col h-64">
                             <h2 className="text-xl font-bold border-b border-gray-600 pb-2 mb-3 flex-shrink-0">Chat</h2>
                             <div className="flex-grow overflow-y-auto pr-2">
                                {gameData.chat.map((msg, index) => (
                                    <div key={index} className="mb-2">
                                        {msg.userId === 'System' ? (
                                            <p className="text-sm text-gray-400 italic text-center">-- {msg.message} --</p>
                                        ) : (
                                            <p>
                                                <span className={`font-bold ${msg.userId === userId ? 'text-indigo-400' : 'text-green-400'}`}>{gameData.players[msg.userId]?.name || 'Player'}: </span>
                                                <span className="text-gray-200">{msg.message}</span>
                                            </p>
                                        )}
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                             </div>
                             <form onSubmit={sendChatMessage} className="mt-3 flex-shrink-0">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Say something..."
                                    className="w-full bg-gray-700 p-2 rounded-md border border-gray-600"
                                />
                             </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
     
    return null; // Should not be reached
}

export default App;