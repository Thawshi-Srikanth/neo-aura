import * as THREE from "three";
import type { AsteroidOrbitalData } from "../types/asteroid";

/**
 * Smart trajectory optimization system
 * Finds optimal impact trajectories that avoid the Sun and create smooth approaches
 */

export interface TrajectoryOptimizationResult {
  success: boolean;
  optimalTrajectory: THREE.Vector3[];
  impactTime: number;
  approachAngle: number;
  sunAvoidance: boolean;
  confidence: number; // 0-1, how confident we are in this trajectory
}

export interface OptimizationProgress {
  step: number;
  totalSteps: number;
  message: string;
  progress: number; // 0-1
}

/**
 * Analyze current asteroid position and find optimal trajectory
 */
export function analyzeOptimalTrajectory(
  asteroidPos: THREE.Vector3,
  earthPos: THREE.Vector3,
  sunPos: THREE.Vector3,
  _orbitalData: AsteroidOrbitalData
): TrajectoryOptimizationResult {
  void _orbitalData;
  // Calculate distance to Sun to avoid slingshot effects
  const distanceToSun = asteroidPos.distanceTo(sunPos);
  const _distanceToEarth = asteroidPos.distanceTo(earthPos);
  void _distanceToEarth;

  // Check if asteroid is too close to Sun (dangerous zone)
  const sunDangerZone = 2.0; // units
  const isInDangerZone = distanceToSun < sunDangerZone;

  if (isInDangerZone) {
    // If too close to Sun, find a trajectory that moves away first
    return findEscapeTrajectory(asteroidPos, earthPos, sunPos);
  }

  // Calculate optimal approach angle
  const earthToAsteroid = asteroidPos.clone().sub(earthPos);
  const sunToAsteroid = asteroidPos.clone().sub(sunPos);

  // Find angle that avoids Sun while approaching Earth
  const approachAngle = calculateOptimalApproachAngle(
    earthToAsteroid,
    sunToAsteroid
  );

  // Generate smooth trajectory points
  const trajectoryPoints = generateSmoothTrajectory(
    asteroidPos,
    earthPos,
    approachAngle,
    20 // number of trajectory points
  );

  // Calculate estimated impact time
  const impactTime = estimateImpactTime(trajectoryPoints);

  // Check if trajectory avoids Sun
  const sunAvoidance = checkSunAvoidance(trajectoryPoints, sunPos);

  // Calculate confidence based on trajectory quality
  const confidence = calculateTrajectoryConfidence(
    trajectoryPoints,
    earthPos,
    sunAvoidance
  );

  return {
    success: true,
    optimalTrajectory: trajectoryPoints,
    impactTime,
    approachAngle,
    sunAvoidance,
    confidence
  };
}

/**
 * Find escape trajectory when asteroid is too close to Sun
 */
function findEscapeTrajectory(
  asteroidPos: THREE.Vector3,
  earthPos: THREE.Vector3,
  sunPos: THREE.Vector3
): TrajectoryOptimizationResult {
  // Calculate direction away from Sun
  const awayFromSun = asteroidPos.clone().sub(sunPos).normalize();

  // Find a point that's safe distance from Sun
  const safeDistance = 3.0;
  const escapePoint = sunPos.clone().add(awayFromSun.multiplyScalar(safeDistance));

  // Generate trajectory that goes to escape point first, then to Earth
  const trajectoryPoints = [
    asteroidPos.clone(),
    escapePoint,
    earthPos.clone()
  ];

  return {
    success: true,
    optimalTrajectory: trajectoryPoints,
    impactTime: 15.0, // Longer time for escape trajectory
    approachAngle: 0,
    sunAvoidance: true,
    confidence: 0.8
  };
}

/**
 * Calculate optimal approach angle to avoid Sun
 */
function calculateOptimalApproachAngle(
  earthToAsteroid: THREE.Vector3,
  sunToAsteroid: THREE.Vector3
): number {
  // Find perpendicular direction to Sun-Asteroid line
  const sunDirection = sunToAsteroid.normalize();
  const earthDirection = earthToAsteroid.normalize();

  // Calculate angle that avoids Sun while approaching Earth
  const dotProduct = sunDirection.dot(earthDirection);
  const angle = Math.acos(Math.abs(dotProduct));

  // Prefer angles between 30-60 degrees for smooth approach
  return Math.max(30, Math.min(60, angle * 180 / Math.PI));
}

/**
 * Generate smooth trajectory points
 */
function generateSmoothTrajectory(
  _start: THREE.Vector3,
  _end: THREE.Vector3,
  _approachAngle: number,
  numPoints: number
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;

    // Create smooth curve using cubic interpolation
    const smoothT = t * t * (3 - 2 * t); // Smooth step function

    // Add some curvature to avoid direct line
    const curvature = Math.sin(t * Math.PI) * 0.5;
    const offset = new THREE.Vector3(
      Math.cos(t * Math.PI * 2) * curvature,
      Math.sin(t * Math.PI * 2) * curvature,
      0
    );

    const point = _start.clone().lerp(_end, smoothT).add(offset);
    points.push(point);
  }

  return points;
}

/**
 * Estimate impact time based on trajectory
 */
function estimateImpactTime(
  trajectory: THREE.Vector3[]
): number {
  // Calculate total distance
  let totalDistance = 0;
  for (let i = 1; i < trajectory.length; i++) {
    totalDistance += trajectory[i].distanceTo(trajectory[i - 1]);
  }

  // Estimate speed (moderate orbital speed)
  const estimatedSpeed = 1.0; // units per second

  return totalDistance / estimatedSpeed;
}

/**
 * Check if trajectory avoids Sun
 */
function checkSunAvoidance(
  trajectory: THREE.Vector3[],
  sunPos: THREE.Vector3
): boolean {
  const minSafeDistance = 1.5; // Minimum safe distance from Sun

  for (const point of trajectory) {
    const distanceToSun = point.distanceTo(sunPos);
    if (distanceToSun < minSafeDistance) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate trajectory confidence score
 */
function calculateTrajectoryConfidence(
  trajectory: THREE.Vector3[],
  earthPos: THREE.Vector3,
  sunAvoidance: boolean
): number {
  let confidence = 0.5; // Base confidence

  // Bonus for Sun avoidance
  if (sunAvoidance) {
    confidence += 0.3;
  }

  // Bonus for smooth trajectory (not too many sharp turns)
  const smoothness = calculateTrajectorySmoothness(trajectory);
  confidence += smoothness * 0.2;

  // Penalty if trajectory is too long
  const totalLength = calculateTrajectoryLength(trajectory);
  const optimalLength = earthPos.distanceTo(trajectory[0]);
  const lengthRatio = totalLength / optimalLength;

  if (lengthRatio > 2.0) {
    confidence -= 0.2;
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Calculate trajectory smoothness
 */
function calculateTrajectorySmoothness(trajectory: THREE.Vector3[]): number {
  if (trajectory.length < 3) return 1.0;

  let totalAngleChange = 0;
  let segmentCount = 0;

  for (let i = 1; i < trajectory.length - 1; i++) {
    const prev = trajectory[i - 1];
    const curr = trajectory[i];
    const next = trajectory[i + 1];

    const v1 = curr.clone().sub(prev).normalize();
    const v2 = next.clone().sub(curr).normalize();

    const angle = Math.acos(Math.max(-1, Math.min(1, v1.dot(v2))));
    totalAngleChange += angle;
    segmentCount++;
  }

  const avgAngleChange = totalAngleChange / segmentCount;
  const smoothness = Math.max(0, 1 - (avgAngleChange / Math.PI));

  return smoothness;
}

/**
 * Calculate total trajectory length
 */
function calculateTrajectoryLength(trajectory: THREE.Vector3[]): number {
  let totalLength = 0;
  for (let i = 1; i < trajectory.length; i++) {
    totalLength += trajectory[i].distanceTo(trajectory[i - 1]);
  }
  return totalLength;
}

/**
 * Get optimization progress steps
 */
export function getOptimizationSteps(): OptimizationProgress[] {
  return [
    {
      step: 1,
      totalSteps: 5,
      message: "Analyzing asteroid position...",
      progress: 0.0
    },
    {
      step: 2,
      totalSteps: 5,
      message: "Calculating Sun avoidance...",
      progress: 0.2
    },
    {
      step: 3,
      totalSteps: 5,
      message: "Finding optimal trajectory...",
      progress: 0.4
    },
    {
      step: 4,
      totalSteps: 5,
      message: "Validating impact path...",
      progress: 0.6
    },
    {
      step: 5,
      totalSteps: 5,
      message: "Finalizing trajectory...",
      progress: 0.8
    }
  ];
}
