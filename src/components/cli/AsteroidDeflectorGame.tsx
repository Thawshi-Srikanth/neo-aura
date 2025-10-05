
export interface Player {
  id: string;
  name: string;
  money: number;
  level: number;
  experience: number;
}

export interface DeflectionMethod {
  id: string;
  name: string;
  cost: number;
  successRate: number;
  description: string;
  parameters: {
    power: number;
    precision: number;
    timing: number;
  };
}

export interface GameState {
  currentPlayer: Player | null;
  asteroid: {
    id: string;
    name: string;
    size: number;
    velocity: number;
    distance: number;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  deflectionAttempts: number;
  maxAttempts: number;
  gameStatus: 'WAITING' | 'ACTIVE' | 'SUCCESS' | 'FAILED';
  score: number;
}

export class AsteroidDeflectorGame {
  private gameState: GameState;
  private players: Map<string, Player> = new Map();
  private deflectionMethods: DeflectionMethod[] = [
    {
      id: 'kinetic_impactor',
      name: 'Kinetic Impactor',
      cost: 1000,
      successRate: 0.7,
      description: 'Launch a spacecraft to collide with the asteroid',
      parameters: { power: 8, precision: 6, timing: 7 }
    },
    {
      id: 'gravity_tractor',
      name: 'Gravity Tractor',
      cost: 2000,
      successRate: 0.6,
      description: 'Use gravitational force to slowly alter trajectory',
      parameters: { power: 4, precision: 9, timing: 3 }
    },
    {
      id: 'nuclear_blast',
      name: 'Nuclear Deflection',
      cost: 5000,
      successRate: 0.8,
      description: 'Detonate nuclear device near asteroid',
      parameters: { power: 10, precision: 5, timing: 6 }
    },
    {
      id: 'laser_ablation',
      name: 'Laser Ablation',
      cost: 3000,
      successRate: 0.65,
      description: 'Use focused laser to vaporize surface material',
      parameters: { power: 7, precision: 8, timing: 5 }
    }
  ];

  constructor() {
    this.gameState = {
      currentPlayer: null,
      asteroid: {
        id: 'AST-001',
        name: 'Apophis',
        size: 370,
        velocity: 12.5,
        distance: 0.1,
        threatLevel: 'HIGH'
      },
      deflectionAttempts: 0,
      maxAttempts: 3,
      gameStatus: 'WAITING',
      score: 0
    };
    this.loadPlayers();
  }

  private loadPlayers() {
    const savedPlayers = localStorage.getItem('asteroid_deflector_players');
    if (savedPlayers) {
      const players = JSON.parse(savedPlayers);
      players.forEach((player: Player) => {
        this.players.set(player.id, player);
      });
    }
  }

  private savePlayers() {
    const players = Array.from(this.players.values());
    localStorage.setItem('asteroid_deflector_players', JSON.stringify(players));
  }

  public handleCommand(command: string): string[] {
    const [cmd, ...args] = command.toLowerCase().split(' ');
    const output: string[] = [];

    switch (cmd) {
      case 'help':
        output.push(...this.showHelp());
        break;
      case 'login':
        output.push(...this.handleLogin(args));
        break;
      case 'register':
        output.push(...this.handleRegister(args));
        break;
      case 'status':
        output.push(...this.showStatus());
        break;
      case 'methods':
        output.push(...this.showDeflectionMethods());
        break;
      case 'deflect':
        output.push(...this.handleDeflection(args));
        break;
      case 'start':
        output.push(...this.startGame());
        break;
      case 'quit':
        output.push(...this.quitGame());
        break;
      case 'clear':
        return ['Terminal cleared'];
      default:
        output.push(`Unknown command: ${command}`);
        output.push('Type \'help\' for available commands.');
    }

    return output;
  }

  private showHelp(): string[] {
    return [
      'Available Commands:',
      '  login <name>     - Login as existing player',
      '  register <name>  - Register new player',
      '  status          - Show current game status',
      '  methods        - Show available deflection methods',
      '  deflect <method> - Attempt deflection with method',
      '  start           - Start new deflection mission',
      '  quit            - Exit game',
      '  clear           - Clear terminal',
      '  help            - Show this help'
    ];
  }

  private handleLogin(args: string[]): string[] {
    if (args.length === 0) {
      return ['Usage: login <name>'];
    }

    const name = args.join(' ');
    const player = Array.from(this.players.values()).find(p => p.name.toLowerCase() === name.toLowerCase());
    
    if (player) {
      this.gameState.currentPlayer = player;
      return [
        `Welcome back, ${player.name}!`,
        `Money: $${player.money.toLocaleString()} | Level: ${player.level} | XP: ${player.experience}`
      ];
    } else {
      return [`Player '${name}' not found. Use 'register' to create a new player.`];
    }
  }

  private handleRegister(args: string[]): string[] {
    if (args.length === 0) {
      return ['Usage: register <name>'];
    }

    const name = args.join(' ');
    const existingPlayer = Array.from(this.players.values()).find(p => p.name.toLowerCase() === name.toLowerCase());
    
    if (existingPlayer) {
      return [`Player '${name}' already exists. Use 'login' to access.`];
    } else {
      const newPlayer: Player = {
        id: Date.now().toString(),
        name,
        money: 10000, // Starting money
        level: 1,
        experience: 0
      };
      this.players.set(newPlayer.id, newPlayer);
      this.savePlayers();
      this.gameState.currentPlayer = newPlayer;
      return [`Welcome, ${name}! You have $${newPlayer.money.toLocaleString()} to start.`];
    }
  }

  private showStatus(): string[] {
    if (!this.gameState.currentPlayer) {
      return ['No player logged in. Use \'login\' or \'register\' first.'];
    }

    const player = this.gameState.currentPlayer;
    return [
      '=== PLAYER STATUS ===',
      `Name: ${player.name}`,
      `Money: $${player.money.toLocaleString()}`,
      `Level: ${player.level}`,
      `Experience: ${player.experience}`,
      '',
      '=== MISSION STATUS ===',
      `Asteroid: ${this.gameState.asteroid.name}`,
      `Threat Level: ${this.gameState.asteroid.threatLevel}`,
      `Attempts: ${this.gameState.deflectionAttempts}/${this.gameState.maxAttempts}`,
      `Status: ${this.gameState.gameStatus}`
    ];
  }

  private showDeflectionMethods(): string[] {
    const output = ['=== AVAILABLE DEFLECTION METHODS ==='];
    this.deflectionMethods.forEach((method, index) => {
      output.push(`${index + 1}. ${method.name}`);
      output.push(`   Cost: $${method.cost.toLocaleString()}`);
      output.push(`   Success Rate: ${(method.successRate * 100).toFixed(0)}%`);
      output.push(`   Description: ${method.description}`);
      output.push('');
    });
    return output;
  }

  private handleDeflection(args: string[]): string[] {
    if (!this.gameState.currentPlayer) {
      return ['No player logged in. Use \'login\' or \'register\' first.'];
    }

    if (this.gameState.gameStatus !== 'ACTIVE') {
      return ['No active mission. Use \'start\' to begin a new mission.'];
    }

    if (this.gameState.deflectionAttempts >= this.gameState.maxAttempts) {
      return ['Maximum deflection attempts reached!'];
    }

    if (args.length === 0) {
      return [
        'Usage: deflect <method_name>',
        'Available methods: kinetic_impactor, gravity_tractor, nuclear_blast, laser_ablation'
      ];
    }

    const methodName = args.join('_');
    const method = this.deflectionMethods.find(m => m.id === methodName);
    
    if (!method) {
      return [`Unknown method: ${methodName}`];
    }

    if (this.gameState.currentPlayer.money < method.cost) {
      return [`Insufficient funds! Need $${method.cost.toLocaleString()}, have $${this.gameState.currentPlayer.money.toLocaleString()}`];
    }

    // Deduct cost
    this.gameState.currentPlayer.money -= method.cost;
    this.gameState.deflectionAttempts++;

    const output = [
      `Attempting ${method.name} deflection...`,
      `Cost: $${method.cost.toLocaleString()} | Success Rate: ${(method.successRate * 100).toFixed(0)}%`
    ];

    // Simulate deflection attempt
    const success = Math.random() < method.successRate;
    
    if (success) {
      this.gameState.gameStatus = 'SUCCESS';
      this.gameState.currentPlayer.experience += 100;
      this.gameState.currentPlayer.money += 2000; // Bonus for success
      output.push('🎉 DEFLECTION SUCCESSFUL! 🎉');
      output.push('Asteroid trajectory successfully altered!');
      output.push('Earth is safe! +$2,000 bonus +100 XP');
    } else {
      output.push('❌ DEFLECTION FAILED! ❌');
      output.push('Asteroid continues on collision course...');
      
      if (this.gameState.deflectionAttempts >= this.gameState.maxAttempts) {
        this.gameState.gameStatus = 'FAILED';
        output.push('💥 MISSION FAILED - EARTH IMPACT IMMINENT! 💥');
      }
    }

    this.savePlayers();
    return output;
  }

  private startGame(): string[] {
    if (!this.gameState.currentPlayer) {
      return ['No player logged in. Use \'login\' or \'register\' first.'];
    }

    this.gameState.gameStatus = 'ACTIVE';
    this.gameState.deflectionAttempts = 0;
    this.gameState.asteroid = {
      id: 'AST-' + Math.floor(Math.random() * 1000),
      name: ['Apophis', 'Bennu', 'Didymos', 'Ryugu', 'Eros'][Math.floor(Math.random() * 5)],
      size: 200 + Math.random() * 500,
      velocity: 10 + Math.random() * 20,
      distance: 0.05 + Math.random() * 0.2,
      threatLevel: ['HIGH', 'CRITICAL', 'MEDIUM'][Math.floor(Math.random() * 3)] as 'HIGH' | 'CRITICAL' | 'MEDIUM'
    };

    return [
      '🚨 NEW ASTEROID THREAT DETECTED! 🚨',
      `Asteroid: ${this.gameState.asteroid.name}`,
      `Size: ${this.gameState.asteroid.size.toFixed(0)}m`,
      `Velocity: ${this.gameState.asteroid.velocity.toFixed(1)} km/s`,
      `Threat Level: ${this.gameState.asteroid.threatLevel}`,
      'Earth impact in 24 hours! Use \'deflect\' to attempt deflection.'
    ];
  }

  private quitGame(): string[] {
    this.savePlayers();
    return [
      'Thanks for playing Asteroid Deflector!',
      'Saving progress...',
      'Progress saved. Goodbye!'
    ];
  }
}