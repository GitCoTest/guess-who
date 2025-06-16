import { useRouter } from 'next/router';
import { useEffect } from 'react';
import GuessWhoGame from '../index';

export default function PlayGame() {
    const router = useRouter();
    const { gameId } = router.query;

    // Pass the gameId to the main component via URL
    useEffect(() => {
        if (gameId && typeof window !== 'undefined') {
            // The main component will detect this URL and set the gameId
            console.log('Game ID from URL:', gameId);
        }
    }, [gameId]);

    return <GuessWhoGame />;
}