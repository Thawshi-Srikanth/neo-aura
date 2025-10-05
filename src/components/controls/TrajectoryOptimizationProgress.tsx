import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle, AlertCircle, Target } from 'lucide-react';

interface TrajectoryOptimizationProgressProps {
  isVisible: boolean;
  onComplete: (result: unknown) => void;
  onCancel: () => void;
}

const TrajectoryOptimizationProgress: React.FC<TrajectoryOptimizationProgressProps> = ({
  isVisible,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<any>(null);

  const steps = [
    {
      step: 1,
      message: "Analyzing asteroid position...",
      icon: <Target className="w-4 h-4" />,
      duration: 800
    },
    {
      step: 2,
      message: "Calculating Sun avoidance...",
      icon: <AlertCircle className="w-4 h-4" />,
      duration: 1000
    },
    {
      step: 3,
      message: "Finding optimal trajectory...",
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      duration: 1200
    },
    {
      step: 4,
      message: "Validating impact path...",
      icon: <CheckCircle className="w-4 h-4" />,
      duration: 800
    },
    {
      step: 5,
      message: "Finalizing trajectory...",
      icon: <CheckCircle className="w-4 h-4" />,
      duration: 600
    }
  ];

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setIsComplete(false);
      setResult(null);
      return;
    }

    let stepIndex = 0;
    const timeouts: number[] = [];

    const runStep = () => {
      if (stepIndex < steps.length) {
        setCurrentStep(stepIndex);
        
        const timeout = setTimeout(() => {
          stepIndex++;
          if (stepIndex < steps.length) {
            runStep();
          } else {
            // Complete
            const finalResult = {
              success: true,
              confidence: 0.95,
              impactTime: 12.5,
              sunAvoidance: true
            };
            
            setIsComplete(true);
            setResult(finalResult);
            
            // Auto-complete after showing success
            setTimeout(() => {
              onComplete(finalResult);
            }, 1500);
          }
        }, steps[stepIndex].duration);
        
        timeouts.push(timeout);
      }
    };

    runStep();

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-2xl min-w-[400px]">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-slate-100 mb-2">
            Trajectory Optimization
          </h3>
          <p className="text-slate-300 text-sm">
            Finding the safest impact path...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            {isComplete ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              currentStepData.icon
            )}
          </div>
          <div className="flex-1">
            <p className="text-slate-200 font-medium">
              {isComplete ? "Trajectory optimized successfully!" : currentStepData.message}
            </p>
            {isComplete && result && (
              <div className="text-xs text-slate-400 mt-1">
                Confidence: {Math.round((result as any).confidence * 100)}% • 
                Impact Time: {(result as any).impactTime}s • 
                Sun Safe: {(result as any).sunAvoidance ? "Yes" : "No"}
              </div>
            )}
          </div>
        </div>

        {/* Cancel Button */}
        {!isComplete && (
          <div className="flex justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrajectoryOptimizationProgress;
