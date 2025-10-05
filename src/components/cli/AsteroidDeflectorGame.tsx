import { asteroidData } from '../../data/asteroids';
import type { Asteroid } from '../../types/asteroid';
import { DeflectionPhysics, type DeflectionMethod, type DeflectionResult } from '../../utils/deflectionPhysics';
import { DeflectionDatabase, type DeflectionRecord } from '../../utils/deflectionDatabase';
import { DEBUG_CONFIG, DebugControls } from '../../config/debug';
import * as THREE from 'three';

// DeflectionMethod interface is now imported from deflectionPhysics.ts

export interface GameState {
  selectedAsteroid: Asteroid | null;
  deflectionAttempts: number;
  maxAttempts: number;
  gameStatus: 'WAITING' | 'ACTIVE' | 'SUCCESS' | 'FAILED';
  confirmedDeflection: boolean;
  waitingForConfirmation: boolean;
  userCancelled: boolean;
  selectedMethod: DeflectionMethod | null;
  missionStartTime: number | null;
  deflectionResult: 'PENDING' | 'SUCCESS' | 'FAILED' | null;
  newOrbitCalculated: boolean;
  deflectionPhysicsResult?: DeflectionResult | null;
}

export class AsteroidDeflectorGame {
  private gameState: GameState;
  private deflectionMethods: DeflectionMethod[] = DeflectionPhysics.getDeflectionMethods();

  constructor(asteroidId?: string) {
    // Auto-select asteroid from URL or use fallback
    const selectedAsteroid = this.selectAsteroid(asteroidId);
    
    this.gameState = {
      selectedAsteroid: selectedAsteroid,
      deflectionAttempts: 0,
      maxAttempts: 3,
      gameStatus: 'WAITING',
      confirmedDeflection: false,
      waitingForConfirmation: false,
      userCancelled: false,
      selectedMethod: null,
      missionStartTime: null,
      deflectionResult: null,
      newOrbitCalculated: false
    };
  }

  private selectAsteroid(asteroidId?: string): Asteroid | null {
    if (asteroidId) {
      const asteroid = asteroidData.find(a => a.id === asteroidId);
      if (asteroid) return asteroid;
    }
    // Fallback to first asteroid
    return asteroidData.length > 0 ? asteroidData[0] : null;
  }

  public getInitialStatus(): string[] {
    const output: string[] = [];
    
    if (!this.gameState.selectedAsteroid) {
      output.push('\x1b[31m[ERROR] No asteroid data available\x1b[0m');
      return output;
    }

    const asteroid = this.gameState.selectedAsteroid;
    const diameter = asteroid.estimated_diameter.kilometers.estimated_diameter_max;
    const velocity = parseFloat(asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_second || '0');
    const missDistance = parseFloat(asteroid.close_approach_data[0]?.miss_distance.astronomical || '0');
    const approachDate = asteroid.close_approach_data[0]?.close_approach_date_full || 'Unknown';
    
    const threatLevel = this.calculateThreatLevel(diameter, velocity, missDistance);
    const threatColor = this.getThreatColor(threatLevel);
    const isHazardous = asteroid.is_potentially_hazardous_asteroid;

    // Banner
    output.push('\x1b[32mASTEROID DEFLECTION COMMAND CENTER\x1b[0m');
    output.push('');

    // Asteroid Information
    output.push('\x1b[36m[TARGET ASTEROID ANALYSIS]\x1b[0m');
    output.push(`\x1b[33m>>\x1b[0m Name: ${asteroid.name}`);
    output.push(`\x1b[33m>>\x1b[0m ID: ${asteroid.id}`);
    output.push(`\x1b[33m>>\x1b[0m Size: ${diameter.toFixed(2)} km diameter`);
    output.push(`\x1b[33m>>\x1b[0m Velocity: ${velocity.toFixed(1)} km/s`);
    output.push(`\x1b[33m>>\x1b[0m Miss Distance: ${missDistance.toFixed(3)} AU`);
    output.push(`\x1b[33m>>\x1b[0m Approach Date: ${approachDate}`);
    output.push(`\x1b[33m>>\x1b[0m Threat Level: ${threatColor}${threatLevel}\x1b[0m`);
    output.push(`\x1b[33m>>\x1b[0m Hazardous: ${isHazardous ? 'YES' : 'NO'}`);
    output.push('');

    // Orbital Characteristics
    output.push('\x1b[36m[ORBITAL CHARACTERISTICS]\x1b[0m');
    output.push(`\x1b[33m>>\x1b[0m Orbit Class: ${asteroid.orbital_data.orbit_class.orbit_class_type}`);
    output.push(`\x1b[33m>>\x1b[0m Eccentricity: ${parseFloat(asteroid.orbital_data.eccentricity).toFixed(3)}`);
    output.push(`\x1b[33m>>\x1b[0m Inclination: ${parseFloat(asteroid.orbital_data.inclination).toFixed(1)}°`);
    output.push(`\x1b[33m>>\x1b[0m Orbital Period: ${parseFloat(asteroid.orbital_data.orbital_period).toFixed(1)} days`);
    output.push(`\x1b[33m>>\x1b[0m Semi-major Axis: ${parseFloat(asteroid.orbital_data.semi_major_axis).toFixed(3)} AU`);
    output.push('');

    // Warning for non-hazardous asteroids
    if (!isHazardous) {
      output.push('\x1b[33m[WARNING] This asteroid is not classified as potentially hazardous.\x1b[0m');
      output.push('\x1b[33m[WARNING] Deflection may not be necessary.\x1b[0m');
      output.push('\x1b[33m[WARNING] Type \'y\' to continue or \'n\' to cancel.\x1b[0m');
      output.push('');
      this.gameState.waitingForConfirmation = true;
    }

    // Only show commands if not waiting for confirmation
    if (!this.gameState.waitingForConfirmation) {
      output.push('\x1b[32m[AVAILABLE COMMANDS]\x1b[0m');
      output.push('  \x1b[35mstatus\x1b[0m     - Show asteroid status');
      output.push('  \x1b[35mdeflect\x1b[0m    - Show deflection methods');
      output.push('  \x1b[35mconfirm\x1b[0m    - Confirm deflection mission');
      output.push('  \x1b[35mcancel\x1b[0m     - Cancel deflection mission');
      output.push('  \x1b[35mhelp\x1b[0m       - Show help');
      output.push('  \x1b[35mquit\x1b[0m       - Exit system');
      output.push('');
    }

    return output;
  }

  public async handleCommand(command: string): Promise<string[]> {
    const [cmd, ...args] = command.toLowerCase().split(' ');
    const output: string[] = [];

    // Handle confirmation responses
    if (this.gameState.waitingForConfirmation) {
      if (cmd === 'y' || cmd === 'yes') {
        this.gameState.waitingForConfirmation = false;
        output.push('\x1b[32m[CONFIRMED] Proceeding with deflection analysis...\x1b[0m');
        output.push('\x1b[33mYou may now use deflection commands.\x1b[0m');
        output.push('');
        output.push('\x1b[32m[AVAILABLE COMMANDS]\x1b[0m');
        output.push('  \x1b[35mstatus\x1b[0m     - Show asteroid status');
        output.push('  \x1b[35mdeflect\x1b[0m    - Show deflection methods');
        output.push('  \x1b[35mconfirm\x1b[0m    - Confirm deflection mission');
        output.push('  \x1b[35mcancel\x1b[0m     - Cancel deflection mission');
        output.push('  \x1b[35mhelp\x1b[0m       - Show help');
        output.push('  \x1b[35mquit\x1b[0m       - Exit system');
        return output;
      } else if (cmd === 'n' || cmd === 'no') {
        this.gameState.waitingForConfirmation = false;
        this.gameState.userCancelled = true;
        output.push('\x1b[31m[CANCELLED] Deflection analysis cancelled.\x1b[0m');
        output.push('\x1b[33mTerminal will close in 3 seconds...\x1b[0m');
        return output;
      } else {
        output.push('\x1b[31m[ERROR] Please respond with \'y\' or \'n\'\x1b[0m');
        output.push('\x1b[33mType \'y\' to continue or \'n\' to cancel.\x1b[0m');
        return output;
      }
    }

    switch (cmd) {
      case 'help':
        output.push(...this.showHelp());
        break;
      case 'status':
        output.push(...this.showAsteroidStatus());
        break;
      case 'deflect':
        output.push(...this.handleDeflectCommand(args));
        break;
      case 'confirm':
        output.push(...this.confirmDeflection());
        break;
      case 'cancel':
        output.push(...this.cancelDeflection());
        break;
      case 'history':
        output.push(...await this.showDeflectionHistory());
        break;
      case 'stats':
        output.push(...await this.showDeflectionStats());
        break;
      case 'debug':
        output.push(...this.handleDebugCommand(args));
        break;
      case 'clear':
        return ['\x1b[2J\x1b[H'];
      case 'quit':
        output.push(...this.quitGame());
        break;
      default:
        output.push('\x1b[31mUnknown command: ' + command + '\x1b[0m');
        output.push('Type \'help\' for available commands.');
    }

    return output;
  }

  private showHelp(): string[] {
    return [
      '\x1b[32mDEFLECTION COMMANDS\x1b[0m',
      '',
      '\x1b[32m[ASTEROID ANALYSIS]\x1b[0m',
      '  \x1b[35mstatus\x1b[0m     - Show current asteroid status and orbital data',
      '',
      '\x1b[32m[DEFLECTION OPERATIONS]\x1b[0m',
      '  \x1b[35mdeflect\x1b[0m    - Show available deflection methods',
      '  \x1b[35mconfirm\x1b[0m    - Confirm deflection mission',
      '  \x1b[35mcancel\x1b[0m     - Cancel deflection mission',
      '',
      '\x1b[32m[DATA & STATISTICS]\x1b[0m',
      '  \x1b[35mhistory\x1b[0m    - Show deflection history',
      '  \x1b[35mstats\x1b[0m     - Show deflection statistics',
      '',
      '\x1b[32m[DEBUG CONTROLS]\x1b[0m',
      '  \x1b[35mdebug\x1b[0m     - Debug controls (debug mode only)',
      '',
      '\x1b[32m[SYSTEM]\x1b[0m',
      '  \x1b[35mclear\x1b[0m      - Clear terminal',
      '  \x1b[35mquit\x1b[0m       - Exit deflection system',
      '',
      '\x1b[33mType any command for detailed usage\x1b[0m'
    ];
  }

  private showAsteroidStatus(): string[] {
    if (!this.gameState.selectedAsteroid) {
      return ['\x1b[31m[ERROR] No asteroid selected\x1b[0m'];
    }

    const asteroid = this.gameState.selectedAsteroid;
    const diameter = asteroid.estimated_diameter.kilometers.estimated_diameter_max;
    const velocity = parseFloat(asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_second || '0');
    const missDistance = parseFloat(asteroid.close_approach_data[0]?.miss_distance.astronomical || '0');
    const approachDate = asteroid.close_approach_data[0]?.close_approach_date_full || 'Unknown';
    
    const threatLevel = this.calculateThreatLevel(diameter, velocity, missDistance);
    const threatColor = this.getThreatColor(threatLevel);

    const output = [
      '\x1b[36m[CURRENT TARGET STATUS]\x1b[0m',
      `\x1b[33m>>\x1b[0m Name: ${asteroid.name}`,
      `\x1b[33m>>\x1b[0m ID: ${asteroid.id}`,
      `\x1b[33m>>\x1b[0m Size: ${diameter.toFixed(2)} km diameter`,
      `\x1b[33m>>\x1b[0m Velocity: ${velocity.toFixed(1)} km/s`,
      `\x1b[33m>>\x1b[0m Miss Distance: ${missDistance.toFixed(3)} AU`,
      `\x1b[33m>>\x1b[0m Approach Date: ${approachDate}`,
      `\x1b[33m>>\x1b[0m Threat Level: ${threatColor}${threatLevel}\x1b[0m`,
      `\x1b[33m>>\x1b[0m Hazardous: ${asteroid.is_potentially_hazardous_asteroid ? 'YES' : 'NO'}`,
      '',
      '\x1b[32m[SYSTEM STATUS]\x1b[0m',
      '  Attempts: ' + this.gameState.deflectionAttempts + '/' + this.gameState.maxAttempts,
      '  Status: ' + this.gameState.gameStatus,
      '  Confirmed: ' + (this.gameState.confirmedDeflection ? 'YES' : 'NO')
    ];

    // If there's an active mission, show mission status
    if (this.gameState.confirmedDeflection) {
      output.push('');
      output.push(...this.getMissionStatus());
    }

    return output;
  }

  private handleDeflectCommand(args: string[]): string[] {
    const output: string[] = [];
    
    // Check if we need confirmation first
    if (this.gameState.waitingForConfirmation) {
      output.push('\x1b[31m[ERROR] Please confirm continuation first.\x1b[0m');
      output.push('\x1b[33mType \'y\' to continue or \'n\' to cancel.\x1b[0m');
    return output;
  }

    // If no method specified, show available methods
    if (args.length === 0) {
      return this.showDeflectionMethods();
    }

    // Parse method selection
    const methodIndex = parseInt(args[0]) - 1;
    if (isNaN(methodIndex) || methodIndex < 0 || methodIndex >= this.deflectionMethods.length) {
      output.push('\x1b[31m[ERROR] Invalid method selection.\x1b[0m');
      output.push('\x1b[33mPlease select a method number (1-' + this.deflectionMethods.length + ')\x1b[0m');
      return output;
    }

    // Select the method
    this.gameState.selectedMethod = this.deflectionMethods[methodIndex];
    const method = this.gameState.selectedMethod;

    output.push('\x1b[32m[METHOD SELECTED]\x1b[0m');
    output.push('\x1b[36m' + method.name + '\x1b[0m');
    output.push('  ' + method.description);
    output.push('  Success Rate: ' + (method.successRate * 100).toFixed(0) + '%');
    output.push('  Cost: $' + method.cost.toLocaleString() + 'M');
    output.push('  Time Required: ' + method.timeRequired + ' hours');
    output.push('');
    output.push('\x1b[33m[READY FOR CONFIRMATION]\x1b[0m');
    output.push('  \x1b[35mconfirm\x1b[0m - Confirm deflection mission');
    output.push('  \x1b[35mcancel\x1b[0m - Cancel selection');

    return output;
  }

  private showDeflectionMethods(): string[] {
    const output: string[] = [];
    
    output.push('\x1b[36m[AVAILABLE DEFLECTION METHODS]\x1b[0m');
    
    this.deflectionMethods.forEach((method, index) => {
      const successPercent = (method.successRate * 100).toFixed(0);
      output.push(`\x1b[33m>>\x1b[0m ${index + 1}. ${method.name}`);
      output.push(`    Description: ${method.description}`);
      output.push(`    Success Rate: ${successPercent}%`);
      output.push(`    Cost: $${method.cost.toLocaleString()}M`);
      output.push(`    Time: ${method.timeRequired} hours`);
      if (index < this.deflectionMethods.length - 1) {
        output.push('');
      }
    });
    output.push('');
    output.push('\x1b[32m[USAGE]\x1b[0m');
    output.push('  \x1b[35mdeflect <method_id>\x1b[0m - Select deflection method');
    output.push('  \x1b[35mconfirm\x1b[0m - Confirm deflection mission');
    
    return output;
  }

  private confirmDeflection(): string[] {
    if (this.gameState.confirmedDeflection) {
      return ['\x1b[33m[INFO] Deflection already confirmed\x1b[0m'];
    }

    if (!this.gameState.selectedMethod) {
      return [
        '\x1b[31m[ERROR] No deflection method selected\x1b[0m',
        '\x1b[33mUse \'deflect <method_id>\' to select a method first\x1b[0m'
      ];
    }

    this.gameState.confirmedDeflection = true;
    this.gameState.gameStatus = 'ACTIVE';
    this.gameState.missionStartTime = Date.now();
    this.gameState.deflectionResult = 'PENDING';

    const method = this.gameState.selectedMethod;
    const asteroid = this.gameState.selectedAsteroid;

    if (!asteroid) {
      return ['\x1b[31m[ERROR] No asteroid selected\x1b[0m'];
    }

    // Calculate time to impact (approximate)
    const approachDate = new Date(asteroid.close_approach_data[0]?.close_approach_date || '2025-01-01');
    const timeToImpact = Math.max(1, (approachDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)); // days

    // Use real physics calculations
    const asteroidOrbitData = {
      eccentricity: parseFloat(asteroid.orbital_data.eccentricity),
      inclination: parseFloat(asteroid.orbital_data.inclination),
      semiMajorAxis: parseFloat(asteroid.orbital_data.semi_major_axis),
      velocity: parseFloat(asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_second || '20'),
      position: new THREE.Vector3(0, 0, 0), // Simplified for now
      approachDate: asteroid.close_approach_data[0]?.close_approach_date || '2025-01-01',
      missDistance: parseFloat(asteroid.close_approach_data[0]?.miss_distance.astronomical || '0.1')
    };

    const deflectionResult = DeflectionPhysics.calculateDeflection(
      asteroidOrbitData,
      method,
      timeToImpact
    );

    this.gameState.deflectionResult = deflectionResult.success ? 'SUCCESS' : 'FAILED';
    this.gameState.newOrbitCalculated = true;
    
    // Store the deflection result for later use
    this.gameState.deflectionPhysicsResult = deflectionResult;

    // Store deflection record in database
    this.saveDeflectionRecord(deflectionResult, asteroid, method);

    // Calculate estimated completion time
    const estimatedCompletion = new Date(Date.now() + (method.timeRequired * 60 * 60 * 1000));

    const output = [
      '\x1b[32m[DEFLECTION CONFIRMED]\x1b[0m',
      '\x1b[33mMission parameters locked in\x1b[0m',
      '\x1b[33mDeflection systems activated\x1b[0m',
      '\x1b[33mTrajectory calculations in progress...\x1b[0m',
      '',
      '\x1b[32m[MISSION DETAILS]\x1b[0m',
      '  Status: ACTIVE',
      '  Target: ' + asteroid.name,
      '  Method: ' + method.name,
      '  Success Rate: ' + (method.successRate * 100).toFixed(0) + '%',
      '  Cost: $' + method.cost.toLocaleString() + 'M',
      '  Time: ' + method.timeRequired + ' hours',
      '  Estimated Completion: ' + estimatedCompletion.toLocaleString(),
      '',
      '\x1b[33mDeflection mission is now active in the impact simulation.\x1b[0m'
    ];

    // Add result after a short delay
    setTimeout(() => {
      this.showDeflectionResult();
      // Emit deflection result event for 3D simulation
      this.emitDeflectionResult();
    }, 2000);

    return output;
  }

  private cancelDeflection(): string[] {
    this.gameState.confirmedDeflection = false;
    this.gameState.gameStatus = 'WAITING';

    return [
      '\x1b[31m[DEFLECTION CANCELLED]\x1b[0m',
      '\x1b[33mMission parameters reset\x1b[0m',
      '\x1b[33mDeflection systems deactivated\x1b[0m',
      '',
      '\x1b[32m[SYSTEM STATUS]\x1b[0m',
      '  Status: WAITING',
      '  Confirmed: NO'
    ];
  }

  private quitGame(): string[] {
      return [
      '\x1b[33m[SYSTEM SHUTDOWN]\x1b[0m',
      '\x1b[33mDeflection systems offline\x1b[0m',
      '\x1b[33mTerminal session ended\x1b[0m',
      '',
      '\x1b[32mThank you for using the Asteroid Deflection System.\x1b[0m'
    ];
  }

  private calculateThreatLevel(diameter: number, velocity: number, missDistance: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    let threatScore = 0;
    
    // Size factor
    if (diameter > 1.0) threatScore += 3;
    else if (diameter > 0.5) threatScore += 2;
    else if (diameter > 0.1) threatScore += 1;
    
    // Velocity factor
    if (velocity > 20) threatScore += 3;
    else if (velocity > 15) threatScore += 2;
    else if (velocity > 10) threatScore += 1;
    
    // Miss distance factor
    if (missDistance < 0.01) threatScore += 3;
    else if (missDistance < 0.05) threatScore += 2;
    else if (missDistance < 0.1) threatScore += 1;
    
    if (threatScore >= 7) return 'CRITICAL';
    if (threatScore >= 5) return 'HIGH';
    if (threatScore >= 3) return 'MEDIUM';
    return 'LOW';
  }

  private getThreatColor(threatLevel: string): string {
    switch (threatLevel) {
      case 'CRITICAL': return '\x1b[31m';
      case 'HIGH': return '\x1b[33m';
      case 'MEDIUM': return '\x1b[35m';
      case 'LOW': return '\x1b[32m';
      default: return '\x1b[37m';
    }
  }

  // Getter for external access
  public getGameState(): GameState {
    return this.gameState;
  }

  public getSelectedAsteroid(): Asteroid | null {
    return this.gameState.selectedAsteroid;
  }

  public isDeflectionConfirmed(): boolean {
    return this.gameState.confirmedDeflection;
  }

  public isWaitingForConfirmation(): boolean {
    return this.gameState.waitingForConfirmation;
  }

  public shouldCloseTerminal(): boolean {
    // Only close if user explicitly cancelled
    return this.gameState.userCancelled;
  }

  private showDeflectionResult(): void {
    // This would be called by the terminal interface to show results
    // For now, we'll handle it in the status command
  }

  private emitDeflectionResult(): void {
    const orbitData = this.getNewOrbitData();
    if (orbitData && orbitData.deflected.success) {
      // Emit custom event with new orbital data
      const deflectionEvent = new CustomEvent('asteroidDeflected', {
        detail: {
          asteroidId: this.gameState.selectedAsteroid?.id,
          asteroidName: this.gameState.selectedAsteroid?.name,
          originalOrbit: orbitData.original,
          deflectedOrbit: orbitData.deflected,
          method: this.gameState.selectedMethod?.name,
          success: true,
          impactProbabilityReduction: orbitData.deflected.impactProbabilityReduction
        }
      });
      
      window.dispatchEvent(deflectionEvent);
      console.log('Deflection result emitted:', deflectionEvent.detail);
    }
  }

  private async saveDeflectionRecord(
    deflectionResult: DeflectionResult,
    asteroid: Asteroid,
    method: DeflectionMethod
  ): Promise<void> {
    try {
      const record: DeflectionRecord = {
        id: `deflection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        asteroidId: asteroid.id,
        asteroidName: asteroid.name,
        timestamp: Date.now(),
        method: method.name,
        success: deflectionResult.success,
        originalOrbit: {
          eccentricity: parseFloat(asteroid.orbital_data.eccentricity),
          inclination: parseFloat(asteroid.orbital_data.inclination),
          semiMajorAxis: parseFloat(asteroid.orbital_data.semi_major_axis),
          velocity: parseFloat(asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_second || '20'),
          missDistance: parseFloat(asteroid.close_approach_data[0]?.miss_distance.astronomical || '0.1')
        },
        deflectedOrbit: {
          eccentricity: deflectionResult.newOrbit.eccentricity,
          inclination: deflectionResult.newOrbit.inclination,
          semiMajorAxis: deflectionResult.newOrbit.semiMajorAxis,
          velocity: deflectionResult.newOrbit.velocity,
          missDistance: deflectionResult.newOrbit.missDistance
        },
        impactProbabilityReduction: deflectionResult.impactProbabilityReduction,
        energyRequired: deflectionResult.energyRequired,
        confidence: deflectionResult.confidence,
        cost: method.cost,
        timeRequired: method.timeRequired
      };

      await DeflectionDatabase.saveDeflection(record);
      console.log('Deflection record saved:', record);
    } catch (error) {
      console.error('Failed to save deflection record:', error);
    }
  }

  public getDeflectionResult(): string[] {
    if (!this.gameState.confirmedDeflection || !this.gameState.deflectionResult) {
      return ['\x1b[33m[INFO] No deflection mission active\x1b[0m'];
    }

    const method = this.gameState.selectedMethod;
    const isSuccess = this.gameState.deflectionResult === 'SUCCESS';
    const resultColor = isSuccess ? '\x1b[32m' : '\x1b[31m';
    const resultText = isSuccess ? 'SUCCESS' : 'FAILED';

    const output = [
      '\x1b[36m[DEFLECTION MISSION RESULT]\x1b[0m',
      '',
      resultColor + '[RESULT] ' + resultText + '\x1b[0m',
      '',
      '\x1b[32m[MISSION SUMMARY]\x1b[0m',
      '  Target: ' + (this.gameState.selectedAsteroid?.name || 'Unknown'),
      '  Method: ' + (method?.name || 'Unknown'),
      '  Success Rate: ' + (method ? (method.successRate * 100).toFixed(0) + '%' : 'N/A'),
      '  Result: ' + resultColor + resultText + '\x1b[0m',
      '  New Orbit Calculated: ' + (this.gameState.newOrbitCalculated ? 'YES' : 'NO'),
      ''
    ];

    if (isSuccess) {
      output.push('\x1b[32m[SUCCESS] Asteroid trajectory successfully altered!\x1b[0m');
      output.push('\x1b[33m[SUCCESS] New orbit parameters calculated and applied to 3D simulation.\x1b[0m');
      output.push('\x1b[33m[SUCCESS] Impact probability reduced by 85-95%.\x1b[0m');
    } else {
      output.push('\x1b[31m[FAILED] Deflection attempt unsuccessful.\x1b[0m');
      output.push('\x1b[33m[FAILED] Asteroid continues on original trajectory.\x1b[0m');
      output.push('\x1b[33m[FAILED] Consider alternative deflection methods.\x1b[0m');
    }

    output.push('');
    output.push('\x1b[32m[3D SIMULATION UPDATE]\x1b[0m');
    if (isSuccess) {
      output.push('  \x1b[33mNew asteroid orbit rendered in impact simulation\x1b[0m');
      output.push('  \x1b[33mTrajectory visualization updated\x1b[0m');
      output.push('  \x1b[33mImpact probability recalculated\x1b[0m');
    } else {
      output.push('  \x1b[31mOriginal trajectory maintained\x1b[0m');
      output.push('  \x1b[31mImpact simulation unchanged\x1b[0m');
    }

    return output;
  }

  public getMissionStatus(): string[] {
    if (!this.gameState.confirmedDeflection) {
      return ['\x1b[33m[INFO] No active deflection mission\x1b[0m'];
    }

    const method = this.gameState.selectedMethod;
    const elapsedTime = this.gameState.missionStartTime ? 
      Math.floor((Date.now() - this.gameState.missionStartTime) / 1000) : 0;
    const totalTime = method ? method.timeRequired * 3600 : 0; // Convert hours to seconds
    const progress = totalTime > 0 ? Math.min((elapsedTime / totalTime) * 100, 100) : 0;

    const output = [
      '\x1b[36m[MISSION STATUS]\x1b[0m',
      `\x1b[33m>>\x1b[0m Status: ${this.gameState.gameStatus}`,
      `\x1b[33m>>\x1b[0m Target: ${this.gameState.selectedAsteroid?.name || 'Unknown'}`,
      `\x1b[33m>>\x1b[0m Method: ${method?.name || 'Unknown'}`,
      `\x1b[33m>>\x1b[0m Progress: ${progress.toFixed(1)}%`,
      `\x1b[33m>>\x1b[0m Elapsed: ${Math.floor(elapsedTime / 60)} minutes`,
      `\x1b[33m>>\x1b[0m Remaining: ${Math.max(0, Math.floor((totalTime - elapsedTime) / 60))} minutes`,
      ''
    ];

    if (this.gameState.deflectionResult) {
      output.push(...this.getDeflectionResult());
    } else {
      output.push('\x1b[33m[MISSION IN PROGRESS]\x1b[0m');
      output.push('\x1b[33mDeflection systems are actively altering asteroid trajectory...\x1b[0m');
      output.push('\x1b[33mResults will be available upon completion.\x1b[0m');
    }

    return output;
  }

  public getNewOrbitData(): any {
    if (!this.gameState.confirmedDeflection || !this.gameState.newOrbitCalculated) {
      return null;
    }

    const asteroid = this.gameState.selectedAsteroid;
    const method = this.gameState.selectedMethod;

    if (!asteroid || !method) {
      return null;
    }

    // Use real physics calculations
    const originalEccentricity = parseFloat(asteroid.orbital_data.eccentricity);
    const originalInclination = parseFloat(asteroid.orbital_data.inclination);
    const originalSemiMajorAxis = parseFloat(asteroid.orbital_data.semi_major_axis);
    const originalVelocity = parseFloat(asteroid.close_approach_data[0]?.relative_velocity.kilometers_per_second || '0');

    // Calculate time to impact for physics calculations
    const approachDate = new Date(asteroid.close_approach_data[0]?.close_approach_date || '2025-01-01');
    const timeToImpact = Math.max(1, (approachDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const asteroidOrbitData = {
      eccentricity: originalEccentricity,
      inclination: originalInclination,
      semiMajorAxis: originalSemiMajorAxis,
      velocity: originalVelocity,
      position: new THREE.Vector3(0, 0, 0),
      approachDate: asteroid.close_approach_data[0]?.close_approach_date || '2025-01-01',
      missDistance: parseFloat(asteroid.close_approach_data[0]?.miss_distance.astronomical || '0.1')
    };

    // Use stored deflection result if available, otherwise calculate new one
    const deflectionResult = this.gameState.deflectionPhysicsResult || 
      DeflectionPhysics.calculateDeflection(asteroidOrbitData, method, timeToImpact);

    // Always return both original and deflected paths
    // The deflected path is a COPY for visualization, original orbit remains unchanged
    return {
      original: {
        eccentricity: originalEccentricity,
        inclination: originalInclination,
        semiMajorAxis: originalSemiMajorAxis,
        velocity: originalVelocity,
        missDistance: asteroidOrbitData.missDistance
      },
      deflected: {
        eccentricity: deflectionResult.success ? deflectionResult.newOrbit.eccentricity : originalEccentricity,
        inclination: deflectionResult.success ? deflectionResult.newOrbit.inclination : originalInclination,
        semiMajorAxis: deflectionResult.success ? deflectionResult.newOrbit.semiMajorAxis : originalSemiMajorAxis,
        velocity: deflectionResult.success ? deflectionResult.newOrbit.velocity : originalVelocity,
        missDistance: deflectionResult.success ? deflectionResult.newOrbit.missDistance : asteroidOrbitData.missDistance,
        success: deflectionResult.success,
        method: method.name,
        impactProbabilityReduction: deflectionResult.success ? deflectionResult.impactProbabilityReduction : 0,
        energyRequired: deflectionResult.energyRequired,
        confidence: deflectionResult.confidence,
        isDeflectedPath: true // Flag to indicate this is a deflected path copy
      },
      asteroid: {
        id: asteroid.id,
        name: asteroid.name,
        diameter: asteroid.estimated_diameter.kilometers.estimated_diameter_max
      }
    };
  }

  private async showDeflectionHistory(): Promise<string[]> {
    try {
      const history = await DeflectionDatabase.getRecentDeflections(10);
      
      if (history.length === 0) {
    return [
          '\x1b[33m[DEFLECTION HISTORY]\x1b[0m',
          '\x1b[33mNo deflection attempts recorded\x1b[0m'
        ];
      }

      const output = [
        '\x1b[36m[DEFLECTION HISTORY]\x1b[0m',
        '\x1b[33mRecent deflection attempts:\x1b[0m',
        ''
      ];

      history.forEach((record, index) => {
        const date = new Date(record.timestamp).toLocaleString();
        const status = record.success ? '\x1b[32mSUCCESS\x1b[0m' : '\x1b[31mFAILED\x1b[0m';
        const method = record.method;
        const asteroid = record.asteroidName;
        
        output.push(`\x1b[36m[${index + 1}] ${asteroid}\x1b[0m`);
        output.push(`  \x1b[33mDate:\x1b[0m ${date}`);
        output.push(`  \x1b[33mMethod:\x1b[0m ${method}`);
        output.push(`  \x1b[33mStatus:\x1b[0m ${status}`);
        output.push(`  \x1b[33mCost:\x1b[0m $${record.cost.toLocaleString()}M`);
        output.push(`  \x1b[33mEnergy:\x1b[0m ${(record.energyRequired / 1e12).toFixed(2)} TJ`);
        if (record.success) {
          output.push(`  \x1b[33mImpact Reduction:\x1b[0m ${record.impactProbabilityReduction.toFixed(1)}%`);
        }
        output.push('');
      });

      return output;
    } catch (error) {
      return [
        '\x1b[31m[ERROR] Failed to load deflection history\x1b[0m',
        '\x1b[33mDatabase may not be initialized\x1b[0m'
      ];
    }
  }

  private async showDeflectionStats(): Promise<string[]> {
    try {
      const stats = await DeflectionDatabase.getDeflectionStats();
      
      const output = [
        '\x1b[36m[DEFLECTION STATISTICS]\x1b[0m',
        ''
      ];

      // Overall stats
      output.push('\x1b[32m[OVERALL PERFORMANCE]\x1b[0m');
      output.push(`  \x1b[33mTotal Attempts:\x1b[0m ${stats.totalAttempts}`);
      output.push(`  \x1b[33mSuccessful Deflections:\x1b[0m ${stats.successfulDeflections}`);
      output.push(`  \x1b[33mSuccess Rate:\x1b[0m ${(stats.successRate * 100).toFixed(1)}%`);
      output.push(`  \x1b[33mTotal Cost:\x1b[0m $${stats.totalCost.toLocaleString()}M`);
      output.push(`  \x1b[33mAverage Energy:\x1b[0m ${(stats.averageEnergyRequired / 1e12).toFixed(2)} TJ`);
      output.push('');

      // Methods used
      if (Object.keys(stats.methodsUsed).length > 0) {
        output.push('\x1b[32m[METHODS USED]\x1b[0m');
        Object.entries(stats.methodsUsed).forEach(([method, count]) => {
          output.push(`  \x1b[33m${method}:\x1b[0m ${count} attempts`);
        });
        output.push('');
      }

      // Asteroids deflected
      if (stats.asteroidsDeflected.length > 0) {
        output.push('\x1b[32m[ASTEROIDS SUCCESSFULLY DEFLECTED]\x1b[0m');
        stats.asteroidsDeflected.forEach(asteroidId => {
          output.push(`  \x1b[33m${asteroidId}\x1b[0m`);
        });
        output.push('');
      }

      return output;
    } catch (error) {
    return [
        '\x1b[31m[ERROR] Failed to load deflection statistics\x1b[0m',
        '\x1b[33mDatabase may not be initialized\x1b[0m'
      ];
    }
  }

  private handleDebugCommand(args: string[]): string[] {
    if (!DEBUG_CONFIG.ENABLE_DEBUG_CONTROLS) {
      return [
        '\x1b[31m[ERROR] Debug controls not enabled\x1b[0m',
        '\x1b[33mWays to enable debug mode:\x1b[0m',
        '  \x1b[35m1. Set VITE_DEBUG_MODE=true in .env file\x1b[0m',
        '  \x1b[35m2. Run in development mode (npm run dev)\x1b[0m',
        '  \x1b[35m3. Type: debug enable\x1b[0m',
        '',
        '\x1b[33mTry: debug enable\x1b[0m'
      ];
    }

    if (args.length === 0) {
      return [
        '\x1b[36m[DEBUG CONTROLS]\x1b[0m',
        '\x1b[33mAvailable debug commands:\x1b[0m',
        '',
        '  \x1b[35mdebug enable\x1b[0m     - Enable debug mode (if not already enabled)',
        '  \x1b[35mdebug success\x1b[0m     - Force next deflection to succeed',
        '  \x1b[35mdebug failure\x1b[0m     - Force next deflection to fail',
        '  \x1b[35mdebug reset\x1b[0m       - Reset to normal physics',
        '  \x1b[35mdebug rate <0-1>\x1b[0m   - Override success rate (0-1)',
        '  \x1b[35mdebug energy <joules>\x1b[0m - Override energy required',
        '  \x1b[35mdebug status\x1b[0m      - Show current debug status',
        '',
        '\x1b[33mExamples:\x1b[0m',
        '  debug success',
        '  debug failure', 
        '  debug rate 0.5',
        '  debug energy 1e12',
        '  debug reset'
      ];
    }

    const subCommand = args[0].toLowerCase();

    switch (subCommand) {
      case 'enable':
        localStorage.setItem('debug_mode', 'true');
        return [
          '\x1b[32m[DEBUG] Debug mode enabled via localStorage\x1b[0m',
          '\x1b[33mRefresh the page or restart the dev server to activate\x1b[0m'
        ];
      
      case 'success':
        DebugControls.forceSuccess();
        return ['\x1b[32m[DEBUG] Forcing next deflection to succeed\x1b[0m'];
      
      case 'failure':
        DebugControls.forceFailure();
        return ['\x1b[31m[DEBUG] Forcing next deflection to fail\x1b[0m'];
      
      case 'reset':
        DebugControls.resetToNormal();
        return ['\x1b[33m[DEBUG] Reset to normal physics calculations\x1b[0m'];
      
      case 'rate':
        const rate = parseFloat(args[1]);
        if (isNaN(rate) || rate < 0 || rate > 1) {
          return [
            '\x1b[31m[ERROR] Invalid success rate\x1b[0m',
            '\x1b[33mRate must be between 0 and 1\x1b[0m'
          ];
        }
        DebugControls.setSuccessRate(rate);
        return [`\x1b[32m[DEBUG] Success rate set to ${(rate * 100).toFixed(1)}%\x1b[0m`];
      
      case 'energy':
        const energy = parseFloat(args[1]);
        if (isNaN(energy) || energy < 0) {
          return [
            '\x1b[31m[ERROR] Invalid energy value\x1b[0m',
            '\x1b[33mEnergy must be a positive number\x1b[0m'
          ];
        }
        DebugControls.setEnergyRequired(energy);
        return [`\x1b[32m[DEBUG] Energy required set to ${energy.toExponential(2)} J\x1b[0m`];
      
      case 'status':
        return [
          '\x1b[36m[DEBUG STATUS]\x1b[0m',
          DebugControls.getStatus()
        ];
      
      default:
        return [
          '\x1b[31m[ERROR] Unknown debug command\x1b[0m',
          '\x1b[33mType \'debug\' for available commands\x1b[0m'
        ];
    }
  }
}