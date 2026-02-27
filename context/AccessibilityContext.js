import React, { createContext, useContext, useState } from "react";

const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
  const [accessibilityType, setAccessibilityType] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userId, setUserId] = useState(null);
  const [mode, setMode] = useState("normal"); 

  return (
    <AccessibilityContext.Provider
      value={{
        accessibilityType,
        setAccessibilityType,
        userName,
        setUserName,
        userId,
        setUserId,
        mode,setMode
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  return useContext(AccessibilityContext);
};