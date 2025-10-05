import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { AsteroidDeflectorGame } from './AsteroidDeflectorGame';
import { terminalSounds } from './TerminalSoundEffects';
import './TerminalInterface.css';

interface TerminalInterfaceProps {
  onCommand: (command: string) => void;
  isVisible: boolean;
  onClose: () => void;
  asteroidId?: string;
}

export const TerminalInterface: React.FC<TerminalInterfaceProps> = ({
  onCommand,
  isVisible,
  onClose,
  asteroidId,
}) => {
  const gameRef = useRef<AsteroidDeflectorGame | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [terminalPosition, setTerminalPosition] = useState({ x: 0, y: 0 });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Initialize game if not already done
  if (!gameRef.current) {
    gameRef.current = new AsteroidDeflectorGame(asteroidId);
  }

  useEffect(() => {
    if (!terminalRef.current || !isVisible) return;

    // Only create terminal if it doesn't exist
    if (!xtermRef.current) {
      // Create xterm instance with enhanced theme
      const terminal = new XTerm({
        theme: {
          background: '#0a0a0a',
          foreground: '#00ff41',
          cursor: '#00ff41',
          cursorAccent: '#0a0a0a',
          black: '#000000',
          red: '#ff0040',
          green: '#00ff41',
          yellow: '#ffaa00',
          blue: '#0080ff',
          magenta: '#ff0080',
          cyan: '#00ffff',
          white: '#ffffff',
          brightBlack: '#404040',
          brightRed: '#ff4040',
          brightGreen: '#40ff40',
          brightYellow: '#ffff40',
          brightBlue: '#4040ff',
          brightMagenta: '#ff40ff',
          brightCyan: '#40ffff',
          brightWhite: '#ffffff'
        },
        fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", Monaco, Menlo, "Ubuntu Mono", monospace',
        fontSize: 13,
        lineHeight: 1.3,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 1000,
        tabStopWidth: 4
      });

      // Add fit addon for better resizing
      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);
      fitAddonRef.current = fitAddon;

      // Open terminal
      terminal.open(terminalRef.current);
      
      // Fit terminal to container
      setTimeout(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      }, 100);

      // Show initial asteroid status
      const showInitialStatus = async () => {
        if (gameRef.current) {
          const initialStatus = gameRef.current.getInitialStatus();
          
          for (let i = 0; i < initialStatus.length; i++) {
            terminal.writeln(initialStatus[i]);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          terminal.writeln('');
          terminal.write('\x1b[32mdeflector@neo-aura:\x1b[36m~\x1b[0m$ ');
          setConnectionStatus('connected');
          terminalSounds.playStartup();
        }
      };
      
      showInitialStatus();

      // Simple command buffer approach
      let commandBuffer = '';
      let commandHistory: string[] = [];
      let historyIndex = -1;
      let isProcessing = false;

      terminal.onData(async (data) => {
        if (isProcessing) return; // Prevent processing during command execution

        if (data === '\r') { // Enter key
          // Always create a new line when Enter is pressed
          terminal.writeln('');
          
          if (commandBuffer.trim()) {
            isProcessing = true;
            const command = commandBuffer.trim();
            console.log('Executing command:', command);
            
            // Add to history
            commandHistory.unshift(command);
            if (commandHistory.length > 50) commandHistory.pop();
            historyIndex = -1;

            // Play command sound
            terminalSounds.playCommand();
            
            // Process the command through the game
            if (gameRef.current) {
              const output = await gameRef.current.handleCommand(command);
              
              // Handle clear command specially
              if (command === 'clear') {
                terminal.clear();
                terminalSounds.playSuccess();
              } else {
                // Add output lines immediately
                output.forEach((line) => {
                  terminal.writeln(line);
                });
                
                // Play appropriate sound based on command
                setTimeout(() => {
                  if (command.startsWith('deflect')) {
                    terminalSounds.playDeflection();
                  } else if (command.startsWith('scan')) {
                    terminalSounds.playScan();
                  } else if (command.startsWith('analyze')) {
                    terminalSounds.playAnalysis();
                  } else if (command.startsWith('emergency')) {
                    terminalSounds.playEmergency();
                  }
                }, 100);
              }
            }
            
            // Process the command for external handlers
            onCommand(command);

            // Check if terminal should close (user said 'n' to non-hazardous asteroid)
            if (gameRef.current && gameRef.current.shouldCloseTerminal()) {
              setTimeout(() => {
                onClose();
              }, 3000); // Close after 3 seconds
            }
          }
          
          // Reset command buffer and write new prompt
          commandBuffer = '';
          isProcessing = false;
          
          // Add a small delay to ensure output is complete
          setTimeout(() => {
            // Check if we're waiting for confirmation
            if (gameRef.current && gameRef.current.isWaitingForConfirmation()) {
              terminal.write('\x1b[33m[CONFIRM] \x1b[0m');
            } else {
              terminal.write('\x1b[32mdeflector@neo-aura:\x1b[36m~\x1b[0m$ ');
            }
          }, 50);
          
        } else if (data === '\u007f') { // Backspace
          if (commandBuffer.length > 0) {
            commandBuffer = commandBuffer.slice(0, -1);
            terminal.write('\b \b');
          }
        } else if (data === '\u001b[A') { // Up arrow - history
          if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            const historyCommand = commandHistory[historyIndex];
            terminal.write('\r\x1b[K');
            terminal.write('\x1b[32mdeflector@neo-aura:\x1b[36m~\x1b[0m$ ');
            terminal.write(historyCommand);
            commandBuffer = historyCommand;
          }
        } else if (data === '\u001b[B') { // Down arrow - history
          if (historyIndex > 0) {
            historyIndex--;
            const historyCommand = commandHistory[historyIndex];
            terminal.write('\r\x1b[K');
            terminal.write('\x1b[32mdeflector@neo-aura:\x1b[36m~\x1b[0m$ ');
            terminal.write(historyCommand);
            commandBuffer = historyCommand;
          } else if (historyIndex === 0) {
            historyIndex = -1;
            terminal.write('\r\x1b[K');
            terminal.write('\x1b[32mdeflector@neo-aura:\x1b[36m~\x1b[0m$ ');
            commandBuffer = '';
          }
        } else if (data === '\t') { // Tab - autocomplete
          const suggestions = ['help', 'status', 'deflect', 'confirm', 'cancel', 'clear', 'quit'];
          const matches = suggestions.filter(cmd => cmd.startsWith(commandBuffer));
          if (matches.length === 1) {
            const completion = matches[0].slice(commandBuffer.length);
            terminal.write(completion);
            commandBuffer += completion;
          }
        } else if (data >= ' ') { // Printable characters
          // Only add characters if we're not processing
          if (!isProcessing) {
            terminal.write(data);
            commandBuffer += data;
            terminalSounds.playTyping();
          }
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
      className="terminal-overlay fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        className={`terminal-container pointer-events-auto ${isDragging ? 'dragging' : ''}`}
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
          border: '2px solid #00ff41',
          borderRadius: '12px',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          left: `${terminalPosition.x}px`,
          top: `${terminalPosition.y}px`,
          padding: '16px'
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.terminal-header')) {
            setIsDragging(true);
            const terminal = e.currentTarget;
            const startX = e.clientX;
            const startY = e.clientY;
            const startLeft = terminalPosition.x;
            const startTop = terminalPosition.y;

            const handleMouseMove = (e: MouseEvent) => {
              const deltaX = e.clientX - startX;
              const deltaY = e.clientY - startY;
              setTerminalPosition({
                x: Math.max(0, Math.min(window.innerWidth - terminal.offsetWidth, startLeft + deltaX)),
                y: Math.max(0, Math.min(window.innerHeight - terminal.offsetHeight, startTop + deltaY))
              });
            };

            const handleMouseUp = () => {
              setIsDragging(false);
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }
        }}
      >
        {/* Enhanced Terminal Header */}
        <div
          className="terminal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            backgroundColor: '#0d1117',
            borderBottom: '1px solid #00ff41',
            cursor: 'move',
            background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: connectionStatus === 'connected' ? '#00ff41' : connectionStatus === 'connecting' ? '#ffaa00' : '#ff0040',
              animation: connectionStatus === 'connecting' ? 'pulse 2s infinite' : 'none'
            }} />
            <div style={{ color: '#00ff41', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace' }}>
              Asteroid Deflector Terminal v3.0
            </div>
            <div style={{ 
              color: connectionStatus === 'connected' ? '#00ff41' : connectionStatus === 'connecting' ? '#ffaa00' : '#ff0040',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              {connectionStatus === 'connected' ? 'ONLINE' : connectionStatus === 'connecting' ? 'CONNECTING...' : 'OFFLINE'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                terminalSounds.playShutdown();
                onClose();
              }}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#ff0040',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(255, 0, 64, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.backgroundColor = '#ff4040';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = '#ff0040';
              }}
              title="Close Terminal"
            >
              <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>×</span>
            </button>
            <button
              onClick={() => {
                setIsMinimized(!isMinimized);
                if (isMinimized) setIsMaximized(false);
              }}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#ffaa00',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(255, 170, 0, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.backgroundColor = '#ffcc00';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = '#ffaa00';
              }}
              title={isMinimized ? "Restore Terminal" : "Minimize Terminal"}
            >
              <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
                {isMinimized ? '□' : '−'}
              </span>
            </button>
            <button
              onClick={() => {
                setIsMaximized(!isMaximized);
                if (isMaximized) setIsMinimized(false);
              }}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#00ff41',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 255, 65, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.backgroundColor = '#40ff40';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.backgroundColor = '#00ff41';
              }}
              title={isMaximized ? "Restore Terminal" : "Maximize Terminal"}
            >
              <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
                {isMaximized ? '⧉' : '⧠'}
              </span>
            </button>
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