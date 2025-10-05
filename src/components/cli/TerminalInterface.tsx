import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Terminal as XTerm } from 'xterm';
import 'xterm/css/xterm.css';
import { AsteroidDeflectorGame } from './AsteroidDeflectorGame';

interface TerminalInterfaceProps {
  onCommand: (command: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

export const TerminalInterface: React.FC<TerminalInterfaceProps> = ({
  onCommand,
  isVisible,
  onClose,
}) => {
  const gameRef = useRef<AsteroidDeflectorGame | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Initialize game if not already done
  if (!gameRef.current) {
    gameRef.current = new AsteroidDeflectorGame();
  }

  useEffect(() => {
    if (!terminalRef.current || !isVisible) return;

    // Only create terminal if it doesn't exist
    if (!xtermRef.current) {
      // Create xterm instance
      const terminal = new XTerm({
        theme: {
          background: '#0a0a0a',
          foreground: '#ffffff',
          cursor: '#ffffff',
          black: '#000000',
          red: '#ff5555',
          green: '#50fa7b',
          yellow: '#f1fa8c',
          blue: '#8be9fd',
          magenta: '#ff79c6',
          cyan: '#8be9fd',
          white: '#ffffff',
          brightBlack: '#6272a4',
          brightRed: '#ff6e6e',
          brightGreen: '#69ff94',
          brightYellow: '#ffffa5',
          brightBlue: '#a4ffff',
          brightMagenta: '#ff92df',
          brightCyan: '#a4ffff',
          brightWhite: '#ffffff'
        },
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: 'block'
      });

      // Open terminal
      terminal.open(terminalRef.current);

      // Set initial content only once
      terminal.writeln('╔══════════════════════════════════════════════════════════════╗');
      terminal.writeln('║                    ASTEROID DEFLECTOR v2.0                  ║');
      terminal.writeln('║                                                              ║');
      terminal.writeln('║  Welcome to the Asteroid Deflection Command Center!        ║');
      terminal.writeln('║  Type \'help\' for available commands.                        ║');
      terminal.writeln('╚══════════════════════════════════════════════════════════════╝');
      terminal.writeln('');
      terminal.write('deflector@neo-aura:~$ ');

      // Handle input
      terminal.onData((data) => {
        if (data === '\r') { // Enter key
          const line = terminal.buffer.active.getLine(terminal.buffer.active.cursorY);
          const command = line?.translateToString().replace('deflector@neo-aura:~$ ', '') || '';
          
          if (command.trim()) {
            // Process the command through the game
            if (gameRef.current) {
              const output = gameRef.current.handleCommand(command);
              output.forEach(line => terminal.writeln(line));
            }
            
            // Process the command for external handlers
            onCommand(command);
          }
          
          terminal.write('deflector@neo-aura:~$ ');
        } else if (data === '\u007f') { // Backspace
          if (terminal.buffer.active.cursorX > 20) { // Don't delete the prompt
            terminal.write('\b \b');
          }
        } else if (data >= ' ') { // Printable characters
          terminal.write(data);
        }
      });

      xtermRef.current = terminal;
      
      // Focus the terminal when it becomes visible
      setTimeout(() => {
        if (xtermRef.current) {
          xtermRef.current.focus();
        }
      }, 100);
    }

    // Handle resize with ResizeObserver for better performance
    let resizeObserver: ResizeObserver | null = null;
    
    if (terminalRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (xtermRef.current) {
          // Use requestAnimationFrame to avoid excessive calls
          requestAnimationFrame(() => {
            if (xtermRef.current) {
              xtermRef.current.refresh(0, xtermRef.current.rows - 1);
            }
          });
        }
      });
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isVisible, onCommand]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
      }
    };
  }, []);

  if (!isVisible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      <div
        className="pointer-events-auto shadow-2xl"
        style={{
          position: 'relative',
          resize: isMaximized ? 'none' : 'both',
          width: isMaximized ? '95vw' : '900px',
          height: isMinimized ? '50px' : (isMaximized ? '95vh' : '700px'),
          minWidth: isMaximized ? '95vw' : '700px',
          minHeight: isMinimized ? '50px' : (isMaximized ? '95vh' : '500px'),
          maxWidth: '95vw',
          maxHeight: '95vh',
          zIndex: 10000,
          backgroundColor: '#0a0a0a',
          border: '2px solid #4a5568',
          borderRadius: '8px',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
        onMouseDown={(e) => {
          const terminal = e.currentTarget;
          const startX = e.clientX;
          const startY = e.clientY;
          const startLeft = parseInt(terminal.style.left) || 0;
          const startTop = parseInt(terminal.style.top) || 0;

          const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            terminal.style.left = `${startLeft + deltaX}px`;
            terminal.style.top = `${startTop + deltaY}px`;
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        {/* Terminal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            backgroundColor: '#1a1a1a',
            borderBottom: '1px solid #4a5568',
            cursor: 'move'
          }}
        >
          <div style={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}>
            Asteroid Deflector Terminal
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#ff5555',
                border: 'none',
                cursor: 'pointer'
              }}
              title="Close"
            />
            <button
              onClick={() => {
                setIsMinimized(!isMinimized);
                if (isMinimized) setIsMaximized(false);
              }}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#f1fa8c',
                border: 'none',
                cursor: 'pointer'
              }}
              title="Minimize"
            />
            <button
              onClick={() => {
                setIsMaximized(!isMaximized);
                if (isMaximized) setIsMinimized(false);
              }}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#50fa7b',
                border: 'none',
                cursor: 'pointer'
              }}
              title="Maximize"
            />
          </div>
        </div>
        
        {/* XTerm Terminal */}
        <div
          ref={terminalRef}
          style={{
            width: '100%',
            height: isMinimized ? '0px' : 'calc(100% - 40px)',
            overflow: 'hidden'
          }}
        />
      </div>
    </div>,
    document.body
  );
};