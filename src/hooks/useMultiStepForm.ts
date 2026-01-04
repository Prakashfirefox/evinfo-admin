import { useState } from "react";

export function UseMultistepForm(steps : any) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  function next() {
    setCurrentStepIndex((i) => {
      if (i >= steps.length - 1) return i;
      return i + 1;
    });
  }
  function back() {
    setCurrentStepIndex((i) => {
      if (i <= 0) return i;
      return i - 1;
    });
  }
  function goTo(index :any) {
    setCurrentStepIndex(index);
  }

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  return {
    currentStepIndex,
    step: steps[currentStepIndex],
    steps,
    isFirstStep,
    isLastStep,
    next,
    back,
    goTo,
  };
}
