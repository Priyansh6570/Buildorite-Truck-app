import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Feather, FontAwesome, FontAwesome5, MaterialIcons } from "@expo/vector-icons";

const DocumentUploader = ({ onUpload }) => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileSizeError, setFileSizeError] = useState("");

  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const pickDocuments = async () => {
    setUploadSuccess(false);
    setFileSizeError("");

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const MAX_FILE_SIZE = 8 * 1024 * 1024;
        const validFiles = [];
        const oversizedFiles = [];

        result.assets.forEach((asset) => {
          console.log("Selected file:", asset.size);
          if (asset.size > MAX_FILE_SIZE) {
            oversizedFiles.push(asset.name);
            console.warn(`File ${asset.name} exceeds the 8MB limit and will not be uploaded.`);
          } else {
            validFiles.push(asset);
          }
        });

        if (oversizedFiles.length > 0) {
          setFileSizeError(`The following files exceed the 8MB limit and were not selected: ${oversizedFiles.join(", ")}`);
        }

        if (validFiles.length > 0) {
          setDocuments(validFiles);
          uploadDocuments(validFiles);
        }
      }
    } catch (error) {
      console.warn("Document picking was cancelled or failed:", error);
    }
  };

  const uploadDocuments = async (docsToUpload) => {
    if (!docsToUpload || docsToUpload.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = docsToUpload.map(async (doc) => {
        const formData = new FormData();
        formData.append("file", {
          uri: doc.uri,
          name: doc.name,
          type: doc.mimeType,
        });
        formData.append("upload_preset", uploadPreset);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: "POST",
          body: formData,
          headers: { "Content-Type": "multipart/form-data" },
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return { url: data.secure_url, caption: doc.name, public_id: data.public_id };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      onUpload(uploadedFiles);
      setDocuments([]);
      setUploadSuccess(true);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes("pdf")) {
      return <FontAwesome5 name="file-pdf" size={24} color="#D32F2F" />;
    }
    if (mimeType?.includes("image")) {
      return <FontAwesome5 name="file-image" size={24} color="#388E3C" />;
    }
    if (mimeType?.includes("doc") || mimeType?.includes("word")) {
      return <FontAwesome5 name="file-word" size={24} color="#1976D2" />;
    }
    return <FontAwesome5 name="file-alt" size={24} color="#757575" />;
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const removeDocument = (index) => {
    const newDocs = [...documents];
    newDocs.splice(index, 1);
    setDocuments(newDocs);
  };

  return (
    <View className="mt-1">
      <View className="p-8 py-10 border-2 border-gray-300 border-dashed rounded-2xl">
        <View className="items-center flex-1">
          <View className="p-6 mb-4 bg-gray-100 rounded-2xl">
            <FontAwesome name="cloud-upload" size={30} color="#9ca3af" />
          </View>

          <Text className="mb-2 text-xl font-bold text-gray-800">Upload Attachments</Text>
          <Text className="mb-4 text-base text-center text-gray-500">PDF, Documents, or Images (Max 8MB)</Text>

          <TouchableOpacity className="px-8 py-4 bg-gray-800 rounded-xl min-w-40" activeOpacity={0.9} onPress={pickDocuments} disabled={uploading}>
            {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-lg font-bold text-white">{uploadSuccess ? "Change Files" : "Choose Files"}</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {fileSizeError ? (
        <View className="flex-row items-center p-4 mt-4 border border-yellow-300 bg-yellow-50 rounded-2xl">
          <MaterialIcons name="warning-amber" size={24} color="#f59e0b" />
          <Text className="flex-1 ml-4 text-sm font-semibold text-yellow-800">{fileSizeError}</Text>
        </View>
      ) : null}

      {uploadSuccess && (
        <View className="flex-row items-center p-4 mt-4 border border-green-300 bg-green-50 rounded-2xl">
          <Feather name="check-circle" size={24} color="#16a34a" />
          <Text className="flex-1 ml-3 text-base font-semibold text-green-800">Files uploaded successfully!</Text>
        </View>
      )}

      {documents.length > 0 && !uploadSuccess && (
        <View className="mt-4 space-y-3">
          <Text className="mb-1 text-base font-semibold text-gray-700">Selected Files ({documents.length})</Text>
          {documents.map((doc, index) => {
            const iconComponent = getFileIcon(doc.mimeType);
            return (
              <View key={index} className="flex-row items-center p-3 mt-3 bg-gray-100 border border-gray-200 rounded-2xl">
                <View className="p-3 bg-white rounded-xl">{iconComponent}</View>
                <View className="flex-1 mx-4">
                  <Text className="text-base font-bold text-gray-800" numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text className="text-sm text-gray-500">{formatBytes(doc.size)}</Text>
                </View>
                <TouchableOpacity onPress={() => removeDocument(index)} className="p-2">
                  <MaterialIcons name="close" size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default DocumentUploader;
