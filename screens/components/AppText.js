import React from "react";
import { Text } from "react-native";
import { useAccessibility } from "../../context/AccessibilityContext";
import { getTheme } from "../../theme/theme";

const AppText = ({ children, style }) => {
  const { mode } = useAccessibility()
  const theme = getTheme(mode);

  return (
    <Text style={[theme, style]}>
      {children}
    </Text>
  );
};

export default AppText;