// Mission Scenarios System
export interface MissionScenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  asteroid: {
    name: string;
    size: number;
    velocity: number;
    distance: number;
    composition: string;
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timeToImpact: number; // hours
  };
  constraints: {
    maxAttempts: number;
    timeLimit: number; // hours
    budget: number;
    availableMethods: string[];
  };
  objectives: string[];
  rewards: {
    experience: number;
    money: number;
    unlock?: string;
  };
  briefing: string[];
}

export class MissionScenarioManager {
  private scenarios: MissionScenario[] = [
    {
      id: 'tutorial_001',
      name: 'First Contact',
      description: 'A small asteroid has been detected on a collision course with Earth. Perfect for training new operators.',
      difficulty: 'EASY',
      asteroid: {
        name: 'Tutorial-1',
        size: 50,
        velocity: 8.5,
        distance: 0.3,
        composition: 'Carbonaceous chondrite',
        threatLevel: 'LOW',
        timeToImpact: 48
      },
      constraints: {
        maxAttempts: 5,
        timeLimit: 24,
        budget: 5000,
        availableMethods: ['kinetic_impactor', 'gravity_tractor']
      },
      objectives: [
        'Successfully deflect the asteroid',
        'Complete mission within budget',
        'Use no more than 3 attempts'
      ],
      rewards: {
        experience: 100,
        money: 1000,
        unlock: 'Advanced deflection methods'
      },
      briefing: [
        'Welcome to the Asteroid Deflection Command Center!',
        'A small asteroid has been detected approaching Earth.',
        'This is a training mission - perfect for learning the basics.',
        'Use the available deflection methods to alter its trajectory.',
        'Remember: time is critical, but so is precision!'
      ]
    },
    {
      id: 'mission_002',
      name: 'Apophis Threat',
      description: 'The famous asteroid Apophis has been recalculated to have a higher impact probability. Immediate action required.',
      difficulty: 'MEDIUM',
      asteroid: {
        name: 'Apophis',
        size: 370,
        velocity: 12.5,
        distance: 0.1,
        composition: 'S-type silicate',
        threatLevel: 'HIGH',
        timeToImpact: 18
      },
      constraints: {
        maxAttempts: 3,
        timeLimit: 12,
        budget: 15000,
        availableMethods: ['kinetic_impactor', 'nuclear_blast', 'laser_ablation']
      },
      objectives: [
        'Deflect Apophis successfully',
        'Minimize collateral damage',
        'Complete within time limit'
      ],
      rewards: {
        experience: 300,
        money: 5000
      },
      briefing: [
        'URGENT: Apophis trajectory recalculated!',
        'Impact probability increased to 2.7%',
        'This is a high-priority mission.',
        'Use any available method to deflect the asteroid.',
        'Failure is not an option!'
      ]
    },
    {
      id: 'mission_003',
      name: 'Binary System',
      description: 'A binary asteroid system is approaching Earth. Both objects must be deflected simultaneously.',
      difficulty: 'HARD',
      asteroid: {
        name: 'Didymos System',
        size: 780,
        velocity: 15.2,
        distance: 0.05,
        composition: 'Mixed silicate and metal',
        threatLevel: 'CRITICAL',
        timeToImpact: 6
      },
      constraints: {
        maxAttempts: 2,
        timeLimit: 4,
        budget: 50000,
        availableMethods: ['nuclear_blast', 'mass_driver', 'ion_beam']
      },
      objectives: [
        'Deflect both asteroids in the binary system',
        'Prevent system breakup',
        'Complete mission in record time'
      ],
      rewards: {
        experience: 500,
        money: 10000,
        unlock: 'Emergency protocols'
      },
      briefing: [
        'CRITICAL ALERT: Binary asteroid system detected!',
        'Both objects must be deflected simultaneously.',
        'System breakup could create multiple impactors.',
        'This is the most challenging mission yet.',
        'Use coordinated deflection strategies!'
      ]
    },
    {
      id: 'mission_004',
      name: 'Stealth Asteroid',
      description: 'A dark, low-albedo asteroid has been detected very late. Limited time and resources available.',
      difficulty: 'EXPERT',
      asteroid: {
        name: 'Stealth-1',
        size: 200,
        velocity: 20.1,
        distance: 0.02,
        composition: 'Carbonaceous with high metal content',
        threatLevel: 'CRITICAL',
        timeToImpact: 2
      },
      constraints: {
        maxAttempts: 1,
        timeLimit: 1,
        budget: 10000,
        availableMethods: ['nuclear_blast']
      },
      objectives: [
        'Deflect asteroid with single attempt',
        'Minimize environmental impact',
        'Prevent global catastrophe'
      ],
      rewards: {
        experience: 1000,
        money: 25000,
        unlock: 'Master deflector status'
      },
      briefing: [
        'EMERGENCY: Stealth asteroid detected!',
        'Very limited time remaining!',
        'Only one deflection attempt possible.',
        'This is a do-or-die situation.',
        'The fate of Earth is in your hands!'
      ]
    },
    {
      id: 'mission_005',
      name: 'Comet Interception',
      description: 'A long-period comet has entered the inner solar system and is on a collision course with Earth.',
      difficulty: 'HARD',
      asteroid: {
        name: 'Comet-2029A',
        size: 1200,
        velocity: 25.3,
        distance: 0.15,
        composition: 'Ice and dust with rocky core',
        threatLevel: 'HIGH',
        timeToImpact: 36
      },
      constraints: {
        maxAttempts: 4,
        timeLimit: 30,
        budget: 75000,
        availableMethods: ['kinetic_impactor', 'nuclear_blast', 'laser_ablation', 'mass_driver']
      },
      objectives: [
        'Deflect comet before it fragments',
        'Prevent ice sublimation effects',
        'Coordinate with international agencies'
      ],
      rewards: {
        experience: 400,
        money: 15000
      },
      briefing: [
        'ALERT: Long-period comet detected!',
        'Comet is approaching at high velocity.',
        'Ice sublimation could create debris field.',
        'International coordination required.',
        'Use multiple deflection methods if needed.'
      ]
    }
  ];

  public getScenario(id: string): MissionScenario | undefined {
    return this.scenarios.find(scenario => scenario.id === id);
  }

  public getAllScenarios(): MissionScenario[] {
    return this.scenarios;
  }

  public getScenariosByDifficulty(difficulty: string): MissionScenario[] {
    return this.scenarios.filter(scenario => scenario.difficulty === difficulty);
  }

  public getRandomScenario(): MissionScenario {
    const availableScenarios = this.scenarios;
    return availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
  }

  public getScenarioBriefing(id: string): string[] {
    const scenario = this.getScenario(id);
    return scenario ? scenario.briefing : [];
  }

  public validateMissionConstraints(scenarioId: string, attempts: number, timeElapsed: number, budgetUsed: number): {
    valid: boolean;
    warnings: string[];
  } {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) {
      return { valid: false, warnings: ['Scenario not found'] };
    }

    const warnings: string[] = [];
    let valid = true;

    if (attempts >= scenario.constraints.maxAttempts) {
      warnings.push('Maximum attempts exceeded');
      valid = false;
    }

    if (timeElapsed >= scenario.constraints.timeLimit) {
      warnings.push('Time limit exceeded');
      valid = false;
    }

    if (budgetUsed >= scenario.constraints.budget) {
      warnings.push('Budget exceeded');
      valid = false;
    }

    if (attempts >= scenario.constraints.maxAttempts * 0.8) {
      warnings.push('Approaching maximum attempts');
    }

    if (timeElapsed >= scenario.constraints.timeLimit * 0.8) {
      warnings.push('Time running out');
    }

    if (budgetUsed >= scenario.constraints.budget * 0.8) {
      warnings.push('Budget nearly exhausted');
    }

    return { valid, warnings };
  }

  public calculateMissionScore(scenarioId: string, success: boolean, attempts: number, timeElapsed: number, budgetUsed: number): {
    score: number;
    grade: string;
    feedback: string[];
  } {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) {
      return { score: 0, grade: 'F', feedback: ['Scenario not found'] };
    }

    if (!success) {
      return { 
        score: 0, 
        grade: 'F', 
        feedback: ['Mission failed - Earth impact occurred'] 
      };
    }

    let score = 100;
    const feedback: string[] = [];

    // Penalize for excessive attempts
    const attemptPenalty = Math.max(0, (attempts - 1) * 10);
    score -= attemptPenalty;
    if (attemptPenalty > 0) {
      feedback.push(`Used ${attempts} attempts (penalty: -${attemptPenalty} points)`);
    }

    // Penalize for time overrun
    const timePenalty = Math.max(0, (timeElapsed - scenario.constraints.timeLimit * 0.5) * 2);
    score -= timePenalty;
    if (timePenalty > 0) {
      feedback.push(`Time overrun penalty: -${timePenalty} points`);
    }

    // Penalize for budget overrun
    const budgetPenalty = Math.max(0, (budgetUsed - scenario.constraints.budget * 0.5) / 100);
    score -= budgetPenalty;
    if (budgetPenalty > 0) {
      feedback.push(`Budget overrun penalty: -${budgetPenalty} points`);
    }

    // Bonus for efficiency
    if (attempts === 1) {
      score += 20;
      feedback.push('Perfect execution bonus: +20 points');
    }

    if (timeElapsed < scenario.constraints.timeLimit * 0.5) {
      score += 15;
      feedback.push('Quick completion bonus: +15 points');
    }

    if (budgetUsed < scenario.constraints.budget * 0.5) {
      score += 10;
      feedback.push('Budget efficiency bonus: +10 points');
    }

    score = Math.max(0, Math.min(100, score));

    let grade: string;
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 60) grade = 'C';
    else if (score >= 50) grade = 'D';
    else grade = 'F';

    feedback.unshift(`Final score: ${score.toFixed(1)}/100 (Grade: ${grade})`);

    return { score, grade, feedback };
  }
}

// Global mission scenario manager
export const missionScenarios = new MissionScenarioManager();
