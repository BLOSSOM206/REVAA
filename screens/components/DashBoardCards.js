import { Text,View,TouchableOpacity,StyleSheet } from "react-native";


export default function DashBoardCard({title,onPress})
{
    return (
        <TouchableOpacity
        onPress={onPress}
        style={styles.title}>
            <Text>{title}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
  card: {
    width: "47%",
    height: 120,
    marginBottom: 15,
    borderRadius: 18,
    backgroundColor: "#1E293B", // deep slate
    justifyContent: "center",
    alignItems: "center",

    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,

    // Elevation for Android
    elevation: 6,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});