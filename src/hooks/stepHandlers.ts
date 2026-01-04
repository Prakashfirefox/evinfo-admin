export const handleNext = (next :any, isLastStep:any) => {
  if (!isLastStep) {
    return next();
  }
};

export const handleBack = (back:any, isFirstStep:any) => {
  if (!isFirstStep) {
    return back();
  }
};

export const goToInputOtp = (currentStepIndex :any, goTo:any) => {
  if (currentStepIndex === 0) {
    return goTo(1);
  }
};

export const goToGreeting = (currentStepIndex:any, goTo:any) => {
  if (currentStepIndex === 1) {
    return goTo(2);
  }
};
