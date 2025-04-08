import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFetchMaterialsByMine } from "../../hooks/useMaterial";

const ViewMaterialScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mineId = route.params?.mineId;
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: materials,
    isLoading,
    error,
    refetch,
  } = useFetchMaterialsByMine(mineId);

  const hasMaterials = materials?.length > 0;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor={"#f3f4f6"} />
      <View className="flex-row items-center justify-center p-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-0 p-4"
        >
          <Text className="text-5xl font-bold">&#8592;</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold">Materials</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("CreateMaterials", { mineId })}
          className="absolute right-0 p-4 px-6 bg-gray-100 rounded-full"
        >
          <Text className="text-3xl font-bold">+</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color="black" />
        </View>
      ) : error ? (
        <View className="items-center justify-center flex-1">
          <Image
            source={require("../../../assets/icons/error.png")}
            className="w-16 h-16 mb-4"
            resizeMode="contain"
          />
          <Text className="text-xl font-semibold text-center">
            Failed to load materials
          </Text>
          <Text className="mt-2 text-gray-500">Please try again later</Text>
        </View>
      ) : hasMaterials ? (
        <FlatList
          data={materials}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("MaterialDetails", { materialId: item._id })
              }
              activeOpacity={1}
              className="p-4 mb-8 bg-white rounded-lg shadow"
            >
              <View className="flex-row items-center">
                <Image
                  source={{ uri: item.photos?.[0]?.url }}
                  className="w-32 h-32 rounded-lg shadow-md"
                  resizeMode="cover"
                />

                <View className="flex-1 ml-4 border border-gray-300 rounded-lg">

                  <Text className="px-4 pt-4 text-xl font-bold text-black capitalize">
                    {item.name}
                  </Text>

                  <View className="h-[1px] bg-gray-300 mt-2" />

                  <View className="flex-row justify-between">
                    <View className="flex-1 border-r border-gray-300">
                      <Text className="px-4 py-1 text-lg font-semibold text-gray-500">
                        Stock
                      </Text>

                      <View className="h-[1px] bg-gray-300 " />

                      <Text className="px-4 py-1 text-lg font-semibold text-gray-500">
                        Status
                      </Text>
                    </View>

                    <View className="items-center flex-1">
                      <Text className="py-1 text-lg text-black">
                        {item.stock_quantity}
                      </Text>

                      <View className="h-[1px] bg-gray-300 w-full" />

                      <Text className="py-1 text-lg text-black capitalize">
                        {item.availability_status}{" "}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="mt-3 border border-gray-300 rounded-lg">
                {/* Table Header */}
                <View className="flex-row p-2 bg-gray-200 rounded-t-lg">
                  <Text className="w-20 pl-2 font-bold text-gray-700">
                    Unit
                  </Text>
                  <Text className="w-20 font-bold text-gray-700">Qty</Text>
                  <Text className="w-20 font-bold text-gray-700">Price</Text>
                  <Text className="flex-1 pl-4 font-bold text-gray-700">
                    Overall
                  </Text>
                </View>

                {item.prices.map((price, index) => (
                  <View
                    key={index}
                    className={`flex-row p-2 ${
                      index % 2 === 0 ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <Text className="w-20 pl-2 text-sm capitalize">
                      {price.unit}
                    </Text>
                    <Text className="w-20 text-sm ">{price.quantity}</Text>
                    <Text className="w-20 text-sm ">₹{price.price}</Text>
                    <Text className="flex-1 pl-4 text-sm">
                      ₹{(price.price / price.quantity).toFixed(2)} /{" "}
                      {price.unit}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          )}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <View className="items-center justify-center flex-1">
          <Image
            source={require("../../../assets/icons/info-black.png")}
            className="w-16 h-16 mb-4"
            resizeMode="contain"
          />
          <Text className="text-xl font-semibold text-center">
            You have not added your materials yet
          </Text>
          <Text className="mt-2 text-gray-500">
            Click on + icon to add your material
          </Text>
        </View>
      )}
    </View>
  );
};

export default ViewMaterialScreen;
