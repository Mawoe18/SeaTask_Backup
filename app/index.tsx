import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import * as FileSystem from 'expo-file-system';
import { useEffect } from 'react';

// Define PDF directory constant
export const PDF_DIRECTORY = `${FileSystem.documentDirectory}SeaTasksPDFs/`;

// Function to create/check PDF directory
export const createPdfDirectory = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(PDF_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(PDF_DIRECTORY, { intermediates: true });
      console.log('[App] Created PDF directory:', PDF_DIRECTORY);
    } else {
      console.log('[App] PDF directory already exists:', PDF_DIRECTORY);
    }
    return true;
  } catch (error) {
    console.error('[App] Error creating PDF directory:', error);
    return false;
  }
};

// Define FormData interface as a union type for both forms
export type FormData = {
  // CybersecuritySurveyForm fields
  organizationName?: string;
  contactPerson?: string;
  industry?: string;
  seatecRepName?: string;
  q0?: string;
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
  q5?: string;
  q6?: string;
  q7?: string;
  q8?: string;
  q9?: string;
  q10?: string;
  q11?: string;
  q12?: string;
  q13?: string;
  q14?: string;
  q15?: string;
  q16?: string;
  q17?: string;
  q18?: string;
  // TelephonySurveyForm fields
  customerCompanyName?: string;
  position?: string;
  customerAddress?: string;
  natureOfBusiness?: string;
  representativeName?: string;
  phoneNo?: string;
  dateOfSurvey?: string;
  purposeOfSurvey?: string;
  networkArchitectureOverview?: string;
  poeAvailabilityAssessment?: string;
  vlanConfiguration?: string;
  cablingInfrastructureType?: string;
  ipAddressingScheme?: string;
  internetConnectivity?: string;
  firewallCapabilities?: string;
  telephonySolutionType?: string[];
  totalUsersExtensions?: string;
  userRoles?: string;
  existingTelephonyAssessment?: string;
  preferredPhoneTypes?: string;
  externalTrunkRequirements?: string;
  electricalSocketsAvailability?: string;
  powerBackup?: string;
  coolingVentilation?: string;
  rackCabinetsAvailability?: string;
  phoneLocationsMapping?: string;
  cablingOutletsCondition?: string;
  wifiCoverageAssessment?: string;
  cablePathways?: string;
  distanceEndpointsSwitches?: string;
  pingLatencyTesting?: string;
  testIpPhonesRegistration?: string;
  internalCallTesting?: string;
  externalCallTesting?: string;
  mosEstimation?: string;
  proposedPbxModel?: string;
  suggestedIpPhones?: string;
  networkEquipmentRequirements?: string;
  structuredCablingAdjustments?: string;
  vlanQosEnhancements?: string;
  draftIpAddressingScheme?: string;
  userTrainingPlans?: string;
  observations?: string;
  recommendations?: string;
  seatecRepNameSig?: string;
  [key: `addReq_${string}`]: boolean;
  [key: `doc_${string}`]: boolean;
};

export interface FormComponentProps {
  formData: FormData;
  onFieldChange: (field: string, value: string | boolean) => void;
  toggleCheckbox: (field: string, value: string) => void;
  seatecSignature: string;
  onShowSeatecSignatureModal: () => void;
  onClearSeatecSignature: () => void;
}

export default function HomeScreen() {
  const router = useRouter();

  // Create/check PDF directory on first load
  useEffect(() => {
    createPdfDirectory();
  }, []);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-blue-600 py-10 px-4 rounded-b-3xl shadow-sm">
        <Text className="text-white text-2xl font-bold text-center font-sans">Seatec</Text>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-6 pt-8">
        {/* Work Order */}
        <TouchableOpacity
          className="bg-white rounded-xl shadow-sm p-4 flex-row items-center mb-4 border border-gray-100 active:bg-gray-50"
          onPress={() => router.push("/work-order")}
          activeOpacity={0.8}
        >
          <View className="bg-blue-100 p-3 rounded-lg mr-4">
            <MaterialIcons name="assignment" size={24} color="#1E40AF" />
          </View>
          <Text className="text-lg font-medium text-gray-800 flex-1 font-sans">Support Works Order</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Maintenance */}
        <TouchableOpacity
          className="bg-white rounded-xl shadow-sm p-4 flex-row items-center mb-4 border border-gray-100 active:bg-gray-50"
          onPress={() => router.push("/maintenance")}
          activeOpacity={0.8}
        >
          <View className="bg-blue-100 p-3 rounded-lg mr-4">
            <FontAwesome5 name="tools" size={22} color="#1E40AF" />
          </View>
          <Text className="text-lg font-medium text-gray-800 flex-1 font-sans">Routine Maintenance</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Survey */}
        <TouchableOpacity
          className="bg-white rounded-xl shadow-sm p-4 flex-row items-center mb-4 border border-gray-100 active:bg-gray-50"
          onPress={() => router.push("/survey")}
          activeOpacity={0.8}
        >
          <View className="bg-blue-100 p-3 rounded-lg mr-4">
            <MaterialIcons name="assessment" size={24} color="#1E40AF" />
          </View>
          <Text className="text-lg font-medium text-gray-800 flex-1 font-sans">Survey Checklist</Text>
          <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Footer - Reduced spacing with justify-around and px-8 */}
      <View className="flex-row justify-around bg-blue-600 px-8 py-4 rounded-t-3xl shadow-sm">
        <TouchableOpacity 
          className="items-center active:opacity-70" 
          onPress={() => router.push("./")}
          activeOpacity={0.8}
        >
          <MaterialIcons name="home" size={26} color="white" />
          <Text className="text-white text-xs mt-1 font-sans">Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="items-center active:opacity-70" 
          onPress={() => router.push("/calendar")}
          activeOpacity={0.8}
        >
          <MaterialIcons name="calendar-today" size={26} color="white" />
          <Text className="text-white text-xs mt-1 font-sans">Calendar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}