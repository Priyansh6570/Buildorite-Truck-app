import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useFetchGlobalMineAndMaterialCount } from "../../hooks/useMine";
import { useFetchRequestCount } from "../../hooks/useRequest";
import { useNavigation } from "@react-navigation/native";

const statsData = [
  { id: 1, color: "#2563EB", bgColor: "#eff6ff", percentage: "+5.2%", title: "Total Mines", icon: "mountain", type: "mine" },
  { id: 2, color: "#9333EA", bgColor: "#9333EA10", percentage: "+3.8%", title: "Materials", icon: "cubes", type: "material" },
  { id: 3, color: "#33AF61", bgColor: "#f0fdf4", title: "Orders", icon: "chart-line", value: 25, trend: "+7.1%" },
  { id: 4, color: "#ffffff", bgColor: "#9471F1", title: "Reports", icon: "info", isLink: true },
];

const StatCard = ({ title, value, trend, icon, isLink, percentage, bgColor, color }) => {
  const cardBg = isLink ? "#664de3" : "#ffffff";
  const textColor = isLink ? "#ffffff" : "#000000";
  const subTextColor = isLink ? "#ffffff99" : "#6B7280";
  const navigation = useNavigation();

  return (
    <View className="p-4 mx-2 my-2 border border-slate-100 shadow-sm rounded-xl w-[45%] h-[120px]" style={{ backgroundColor: cardBg }}>
      <View className="flex-row items-start justify-between">
        <View>
          <Text style={{ fontSize: 16, color: subTextColor, fontWeight: 600 }}>{title}</Text>

          {isLink ? (
            <>
              <TouchableOpacity onPress={() => navigation.navigate("Analytics")} activeOpacity={0.8}>
                <Text style={{ marginTop: 8, fontSize: 24, fontWeight: "bold", color: textColor }}>View</Text>
                <Text style={{ marginTop: 4, fontSize: 14, fontWeight: "500", color: textColor }}>View Report →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="my-2 text-3xl font-bold text-gray-900">{value}</Text>
              {trend && <Text className="mt-2 text-green-500 text-md">{trend}</Text>}
              {percentage && <Text className="mt-2 text-green-500 text-md">{percentage}</Text>}
            </>
          )}
        </View>

        {isLink ? (
          <View
            style={{
              backgroundColor: "#ffffff50",
              padding: 10,
              borderRadius: 12,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                padding: 4,
                paddingHorizontal: 8,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: "#ffffff",
                borderStyle: "dashed",
              }}
            >
              <FontAwesome6 name={icon} size={10} color={color} />
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: bgColor, padding: 12, borderRadius: 8 }}>
            <FontAwesome6 name={icon} size={18} color={color} />
          </View>
        )}
      </View>
    </View>
  );
};

const StatsSection = () => {
  const { data: globalMineAndMaterialCount } = useFetchGlobalMineAndMaterialCount();

  const mineCount = globalMineAndMaterialCount?.mineCount || 0;
  const materialCount = globalMineAndMaterialCount?.materialCount || 0;

  return (
    <View className="w-full px-2 mt-6">
      <View className="flex-row flex-wrap justify-center">
        {statsData.map((stat) => (
          <StatCard key={stat.id} title={stat.title} percentage={stat.percentage} value={stat.type === "mine" ? mineCount : stat.type === "material" ? materialCount : stat.value} trend={stat.trend} icon={stat.icon} isLink={stat.isLink} bgColor={stat.bgColor} color={stat.color} />
        ))}
      </View>
    </View>
  );
};

export default StatsSection;
