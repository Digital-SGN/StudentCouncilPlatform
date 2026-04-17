import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeUp, faVolumeOff } from '@fortawesome/free-solid-svg-icons';

export default function MusicButton() {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        audioRef.current = new Audio('/music/background.mp3');
        audioRef.current.loop = true;
        
        const savedState = localStorage.getItem('musicEnabled');
        if (savedState === 'true') {
            audioRef.current.play().catch(e => console.log('Автовоспроизведение заблокировано'));
            setIsPlaying(true);
        }
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const toggleMusic = () => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            localStorage.setItem('musicEnabled', 'false');
        } else {
            audioRef.current.play().catch(e => console.log('Не удалось воспроизвести:', e));
            setIsPlaying(true);
            localStorage.setItem('musicEnabled', 'true');
        }
    };

    return (
        <button 
            className="music-control" 
            onClick={toggleMusic}
            title={isPlaying ? 'Выключить музыку' : 'Включить музыку'}
            style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                marginLeft: '10px'
            }}
        >
            <FontAwesomeIcon icon={isPlaying ? faVolumeUp : faVolumeOff} />
        </button>
    );
}