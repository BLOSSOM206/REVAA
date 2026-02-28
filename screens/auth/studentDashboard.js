import { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../services/firebaseConfig";
import DashBoardCard from "../components/DashBoardCards";
import { useAccessibility } from "../../context/AccessibilityContext";
import AppText from "../components/AppText";

export default function StudentDashboard({ route, navigation }) {
  const { userId } = route.params;
  const { setAccessibilityType, setUserName, setUserId } = useAccessibility();
  const [userData, setUserData] = useState(null);

  const dashboardItems = [
    { title: "+ My Courses", screen: "MyCourse", color: "#3F62E8" },
    { title: "+ Professors", screen: "ProfessorsList", color: "#26B857" },
    { title: "+ Content", screen: "ContentScreen", color: "#FF9800" },
    { title: "+ Emergency Alerts", screen: "EmergencyAlerts", color: "#FF5C5C" },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return;

      const data = docSnap.data();
      setUserData(data);
      setAccessibilityType(data.accessibilityType);
      setUserName(data.name);
      setUserId(userId);
    };

    fetchUser();
  }, [setAccessibilityType, setUserId, setUserName, userId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerBlock}>
        <AppText style={styles.header}>Student Dashboard</AppText>
        <AppText style={styles.subHeader}>{userData?.name || "Student"}</AppText>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <AppText style={styles.statLabel}>Quick Links</AppText>
          <AppText style={styles.statValue}>{dashboardItems.length}</AppText>
        </View>
        <View style={styles.statCard}>
          <AppText style={styles.statLabel}>Access Mode</AppText>
          <AppText style={styles.statValue}>{userData?.accessibilityType ? 1 : 0}</AppText>
        </View>
      </View>

      <View style={styles.actionGroup}>
        {dashboardItems.map((item) => (
          <DashBoardCard
            key={item.title}
            title={item.title}
            backgroundColor={item.color}
            onPress={() => navigation.navigate(item.screen)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F3F4F6",
    flexGrow: 1,
    paddingBottom: 28,
  },
  headerBlock: {
    backgroundColor: "#3F62E8",
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 22,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  header: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subHeader: {
    color: "#DDE5FF",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ECECEC",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "700",
  },
  actionGroup: {
    paddingHorizontal: 14,
    marginTop: 14,
  },
});
