export const getTheme = (mode) => {
  if (mode === "dyslexic") {
    return {
      fontFamily: "Lexend-Regular",
      fontSize: 20,
      lineHeight: 32,
      letterSpacing: 0.8,
    };
  }

  return {
    fontFamily: "System",
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  };
};