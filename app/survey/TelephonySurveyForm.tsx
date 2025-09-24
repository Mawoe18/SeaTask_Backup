import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { FormComponentProps, FormData } from './index';
import * as FileSystem from 'expo-file-system';
import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal } from 'react-native';
import { generateTelephonySurveyPDF } from '../../src/pdfTemplates/TelephonySurveyTemplate';
import { PDF_DIRECTORY, createPdfDirectory } from '../index';

const TelephonySurveyForm = ({ 
    formData, 
    onFieldChange, 
    toggleCheckbox,
    seatecSignature, 
    onShowSeatecSignatureModal, 
    onClearSeatecSignature 
}: FormComponentProps & { toggleCheckbox: (field: string, value: string) => void }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [pdfPath, setPdfPath] = useState<string | null>(null);

    const exportFormData = async () => {
        console.log('[TelephonySurveyForm] Export button clicked');
        setIsLoading(true);

        try {
            // Ensure PDF directory exists
            const dirCreated = await createPdfDirectory();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `Telephony_Survey_${formData.customerCompanyName || 'Customer'}_${timestamp}.pdf`;
            const filePath = dirCreated ? `${PDF_DIRECTORY}${fileName}` : `${FileSystem.documentDirectory}${fileName}`;

            console.log('[TelephonySurveyForm] Generating PDF at path:', filePath);

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('PDF generation timeout - process took too long')), 60000)
            );

            // Ensure seatecSignature is passed correctly
            const exportData = {
                ...formData,
                seatecSignature: seatecSignature || '',
                telephonySolutionType: Array.isArray(formData.telephonySolutionType) ? formData.telephonySolutionType : []
            };

            // Generate PDF with timeout
            await Promise.race([
                generateTelephonySurveyPDF(exportData, filePath),
                timeoutPromise
            ]);

            // Verify file was created
            const fileInfo = await FileSystem.getInfoAsync(filePath) as { exists: boolean; size?: number };
            if (!fileInfo.exists) {
                throw new Error('PDF file was not created');
            }

            console.log('[TelephonySurveyForm] PDF generated successfully, file size:', fileInfo.size, 'bytes');
            setPdfPath(filePath);
            setShowSuccessModal(true);

        } catch (error) {
            console.error('[TelephonySurveyForm] PDF Generation failed:', error);
            let errorMessage = 'Failed to generate the PDF. Please try again.';
            if ((error as Error).message.includes('timeout')) {
                errorMessage = 'PDF generation is taking too long. Please try again or contact support.';
            }
            Alert.alert('Error', errorMessage);
        } finally {
            console.log('[TelephonySurveyForm] Process completed');
            setIsLoading(false);
        }
    };

    const handlePreviewPdf = async () => {
        if (pdfPath) {
            try {
                await Sharing.shareAsync(pdfPath, {
                    mimeType: 'application/pdf',
                });
                console.log('[TelephonySurveyForm] PDF preview opened');
                setPdfPath(null);
                setShowSuccessModal(false);
            } catch (error) {
                console.error('[TelephonySurveyForm] Error previewing PDF:', error);
                Alert.alert('Error', 'Failed to preview PDF');
            }
        } else {
            Alert.alert('Error', 'No PDF available to preview');
        }
    };

    const handleEmailPdf = async () => {
        try {
            const isAvailable = await MailComposer.isAvailableAsync();
            if (!isAvailable) {
                Alert.alert('Error', 'No email client is available on this device');
                return;
            }

            await MailComposer.composeAsync({
                recipients: ['support@seatectelecom.com'],
                subject: `Telephony Survey Report - ${formData.customerCompanyName || 'Customer'}`,
                body: 'Please find the attached telephony survey report PDF.',
                attachments: pdfPath ? [pdfPath] : [],
            });
            console.log('[TelephonySurveyForm] Email client opened');
            setPdfPath(null);
            setShowSuccessModal(false);
        } catch (error) {
            console.error('[TelephonySurveyForm] Error opening email client:', error);
            Alert.alert('Error', 'Failed to open email client');
        }
    };

    const handleSavePdf = async () => {
        if (pdfPath) {
            try {
                await Sharing.shareAsync(pdfPath, {
                    dialogTitle: 'Save Telephony Survey PDF',
                    mimeType: 'application/pdf',
                });
                console.log('[TelephonySurveyForm] PDF save dialog shown');
                setPdfPath(null);
                setShowSuccessModal(false);
            } catch (error) {
                console.error('[TelephonySurveyForm] Error saving PDF:', error);
                Alert.alert('Error', 'Failed to save PDF');
            }
        } else {
            Alert.alert('Error', 'No PDF available to save');
        }
    };

    const telephonySolutionOptions = [
        'On-Premises IP PBX',
        'Hosted VoIP',
        'Hybrid'
    ];

    const additionalRequirementsOptions = [
        'Voicemail',
        'Auto Attendant (IVR)',
        'Call Forwarding',
        'Call Recording',
        'Paging/Intercom',
        'Integration with Security/CRM/Helpdesk Systems'
    ];

    return (
        <ScrollView className="bg-white rounded-lg p-4 shadow-sm" contentContainerStyle={{ paddingBottom: 180 }}>
            {/* General Information */}
            <Text className="text-lg font-bold mb-2">GENERAL INFORMATION</Text>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Name of Seatec Representative:</Text>
                <TextInput
                    value={typeof formData.seatecRepName === 'string' ? formData.seatecRepName : ''}
                    onChangeText={(text) => onFieldChange('seatecRepName', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter representative name"
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Position:</Text>
                <TextInput
                    value={typeof formData.position === 'string' ? formData.position : ''}
                    onChangeText={(text) => onFieldChange('position', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter position"
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Name of Customer's Company:</Text>
                <TextInput
                    value={typeof formData.customerCompanyName === 'string' ? formData.customerCompanyName : ''}
                    onChangeText={(text) => onFieldChange('customerCompanyName', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter company name"
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Customer Address:</Text>
                <TextInput
                    value={typeof formData.customerAddress === 'string' ? formData.customerAddress : ''}
                    onChangeText={(text) => onFieldChange('customerAddress', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Enter address"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Nature of Business:</Text>
                <TextInput
                    value={typeof formData.natureOfBusiness === 'string' ? formData.natureOfBusiness : ''}
                    onChangeText={(text) => onFieldChange('natureOfBusiness', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter nature of business"
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Representative Name:</Text>
                <TextInput
                    value={typeof formData.representativeName === 'string' ? formData.representativeName : ''}
                    onChangeText={(text) => onFieldChange('representativeName', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter representative name"
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Phone No.:</Text>
                <TextInput
                    value={typeof formData.phoneNo === 'string' ? formData.phoneNo : ''}
                    onChangeText={(text) => onFieldChange('phoneNo', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Date of Survey:</Text>
                <TextInput
                    value={typeof formData.dateOfSurvey === 'string' ? formData.dateOfSurvey : ''}
                    onChangeText={(text) => onFieldChange('dateOfSurvey', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter date (YYYY-MM-DD)"
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Purpose of Survey:</Text>
                <TextInput
                    value={typeof formData.purposeOfSurvey === 'string' ? formData.purposeOfSurvey : ''}
                    onChangeText={(text) => onFieldChange('purposeOfSurvey', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe purpose of survey"
                    multiline
                />
            </View>

            {/* 1. Network Infrastructure Assessment */}
            <Text className="text-lg font-bold mt-4 mb-2">1. NETWORK INFRASTRUCTURE ASSESSMENT</Text>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Overview of Existing Network Architecture (LAN/WAN Topology):</Text>
                <TextInput
                    value={typeof formData.networkArchitectureOverview === 'string' ? formData.networkArchitectureOverview : ''}
                    onChangeText={(text) => onFieldChange('networkArchitectureOverview', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe network architecture"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Assessment of PoE Availability:</Text>
                <TextInput
                    value={typeof formData.poeAvailabilityAssessment === 'string' ? formData.poeAvailabilityAssessment : ''}
                    onChangeText={(text) => onFieldChange('poeAvailabilityAssessment', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe PoE availability"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">VLAN Configuration for Voice and Data Separation:</Text>
                <TextInput
                    value={typeof formData.vlanConfiguration === 'string' ? formData.vlanConfiguration : ''}
                    onChangeText={(text) => onFieldChange('vlanConfiguration', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe VLAN configuration"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Cabling Infrastructure Type (Cat5e, Cat6, BA, Fiber):</Text>
                <TextInput
                    value={typeof formData.cablingInfrastructureType === 'string' ? formData.cablingInfrastructureType : ''}
                    onChangeText={(text) => onFieldChange('cablingInfrastructureType', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter cabling type"
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">IP Addressing Scheme:</Text>
                <TextInput
                    value={typeof formData.ipAddressingScheme === 'string' ? formData.ipAddressingScheme : ''}
                    onChangeText={(text) => onFieldChange('ipAddressingScheme', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe IP addressing scheme"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Internet Connectivity - Bandwidth, Uptime, SP Detail:</Text>
                <TextInput
                    value={typeof formData.internetConnectivity === 'string' ? formData.internetConnectivity : ''}
                    onChangeText={(text) => onFieldChange('internetConnectivity', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe internet connectivity"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Firewall Capabilities (SIP ALG Handling, NAT Traversal):</Text>
                <TextInput
                    value={typeof formData.firewallCapabilities === 'string' ? formData.firewallCapabilities : ''}
                    onChangeText={(text) => onFieldChange('firewallCapabilities', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe firewall capabilities"
                    multiline
                />
            </View>

            {/* 2. Telephony System Requirements */}
            <Text className="text-lg font-bold mt-4 mb-2">2. TELEPHONY SYSTEM REQUIREMENTS</Text>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Required Type of Telephony Solution:</Text>
                <View>
                    {telephonySolutionOptions.map((option) => (
                        <View key={option} className="flex-row items-center mb-2">
                            <TouchableOpacity
                                className={`w-6 h-6 border rounded mr-2 ${(Array.isArray(formData.telephonySolutionType) ? formData.telephonySolutionType : []).includes(option) ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
                                onPress={() => toggleCheckbox('telephonySolutionType', option)}
                            >
                                {(Array.isArray(formData.telephonySolutionType) ? formData.telephonySolutionType : []).includes(option) && <MaterialIcons name="check" size={18} color="white" />}
                            </TouchableOpacity>
                            <Text>{option}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Total Number of Users/Extensions:</Text>
                <TextInput
                    value={typeof formData.totalUsersExtensions === 'string' ? formData.totalUsersExtensions : ''}
                    onChangeText={(text) => onFieldChange('totalUsersExtensions', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter number of users/extensions"
                    keyboardType="numeric"
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">User Roles (Reception, Management, Call Center, Remote Workers, etc.):</Text>
                <TextInput
                    value={typeof formData.userRoles === 'string' ? formData.userRoles : ''}
                    onChangeText={(text) => onFieldChange('userRoles', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe user roles"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Assessment of Existing Telephony System (if applicable):</Text>
                <TextInput
                    value={typeof formData.existingTelephonyAssessment === 'string' ? formData.existingTelephonyAssessment : ''}
                    onChangeText={(text) => onFieldChange('existingTelephonyAssessment', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe existing telephony system"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Preferred Existing Phone Types (Desk Phones (Wired/Wireless), DECT, Softphones):</Text>
                <TextInput
                    value={typeof formData.preferredPhoneTypes === 'string' ? formData.preferredPhoneTypes : ''}
                    onChangeText={(text) => onFieldChange('preferredPhoneTypes', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter preferred phone types"
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Additional Requirements:</Text>
                <View>
                    {additionalRequirementsOptions.map((req) => (
                        <View key={req} className="flex-row items-center mb-2">
                            <TouchableOpacity
                                className={`w-6 h-6 border rounded mr-2 ${formData[`addReq_${req.replace(/\s/g, '')}`] ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
                                onPress={() => onFieldChange(`addReq_${req.replace(/\s/g, '')}`, !formData[`addReq_${req.replace(/\s/g, '')}`])}
                            >
                                {formData[`addReq_${req.replace(/\s/g, '')}`] && <MaterialIcons name="check" size={18} color="white" />}
                            </TouchableOpacity>
                            <Text>{req}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">External Line/Trunk Requirements (SIP Trunks, ISDN, E1/T1, FXO/FXS):</Text>
                <TextInput
                    value={typeof formData.externalTrunkRequirements === 'string' ? formData.externalTrunkRequirements : ''}
                    onChangeText={(text) => onFieldChange('externalTrunkRequirements', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe external trunk requirements"
                    multiline
                />
            </View>

            {/* 3. Power & Environmental Considerations */}
            <Text className="text-lg font-bold mt-4 mb-2">3. POWER & ENVIRONMENTAL CONSIDERATIONS</Text>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Availability of Electrical Sockets at Phone Installation Points:</Text>
                <TextInput
                    value={typeof formData.electricalSocketsAvailability === 'string' ? formData.electricalSocketsAvailability : ''}
                    onChangeText={(text) => onFieldChange('electricalSocketsAvailability', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe socket availability"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Power Backup/UPS for Network and Telephony Equipment:</Text>
                <TextInput
                    value={typeof formData.powerBackup === 'string' ? formData.powerBackup : ''}
                    onChangeText={(text) => onFieldChange('powerBackup', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe power backup"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Cooling and Ventilation for Network/Server Rooms:</Text>
                <TextInput
                    value={typeof formData.coolingVentilation === 'string' ? formData.coolingVentilation : ''}
                    onChangeText={(text) => onFieldChange('coolingVentilation', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe cooling and ventilation"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Availability of Rack Cabinets for PBX, Gateways, and Switches:</Text>
                <TextInput
                    value={typeof formData.rackCabinetsAvailability === 'string' ? formData.rackCabinetsAvailability : ''}
                    onChangeText={(text) => onFieldChange('rackCabinetsAvailability', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe rack cabinet availability"
                    multiline
                />
            </View>

            {/* 4. Physical Infrastructure Assessment */}
            <Text className="text-lg font-bold mt-4 mb-2">4. PHYSICAL INFRASTRUCTURE ASSESSMENT</Text>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Mapping of Proposed Phone Locations by Department/Area:</Text>
                <TextInput
                    value={typeof formData.phoneLocationsMapping === 'string' ? formData.phoneLocationsMapping : ''}
                    onChangeText={(text) => onFieldChange('phoneLocationsMapping', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe phone locations"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Condition and Availability of Structured Cabling Outlets:</Text>
                <TextInput
                    value={typeof formData.cablingOutletsCondition === 'string' ? formData.cablingOutletsCondition : ''}
                    onChangeText={(text) => onFieldChange('cablingOutletsCondition', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe cabling outlets condition"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Wi-Fi Coverage Assessment (for Wireless Phones or Softphones if Applicable):</Text>
                <TextInput
                    value={typeof formData.wifiCoverageAssessment === 'string' ? formData.wifiCoverageAssessment : ''}
                    onChangeText={(text) => onFieldChange('wifiCoverageAssessment', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe Wi-Fi coverage"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Cable Pathways and Trunking Infrastructure:</Text>
                <TextInput
                    value={typeof formData.cablePathways === 'string' ? formData.cablePathways : ''}
                    onChangeText={(text) => onFieldChange('cablePathways', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe cable pathways"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Distance Between Endpoints and Switches (Cable Run Feasibility):</Text>
                <TextInput
                    value={typeof formData.distanceEndpointsSwitches === 'string' ? formData.distanceEndpointsSwitches : ''}
                    onChangeText={(text) => onFieldChange('distanceEndpointsSwitches', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe cable run feasibility"
                    multiline
                />
            </View>

            {/* 5. Network and Voice Quality Testing */}
            <Text className="text-lg font-bold mt-4 mb-2">5. NETWORK AND VOICE QUALITY TESTING</Text>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Ping, Latency, Jitter, and Packet Loss Testing:</Text>
                <TextInput
                    value={typeof formData.pingLatencyTesting === 'string' ? formData.pingLatencyTesting : ''}
                    onChangeText={(text) => onFieldChange('pingLatencyTesting', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe testing results"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Registration of Test IP Phones and SIP Parameters, etc.:</Text>
                <TextInput
                    value={typeof formData.testIpPhonesRegistration === 'string' ? formData.testIpPhonesRegistration : ''}
                    onChangeText={(text) => onFieldChange('testIpPhonesRegistration', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe IP phone registration"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Internal Call Testing (Extension to Extension):</Text>
                <TextInput
                    value={typeof formData.internalCallTesting === 'string' ? formData.internalCallTesting : ''}
                    onChangeText={(text) => onFieldChange('internalCallTesting', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe internal call testing"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">External Call Testing (SIP/FXO Trunks):</Text>
                <TextInput
                    value={typeof formData.externalCallTesting === 'string' ? formData.externalCallTesting : ''}
                    onChangeText={(text) => onFieldChange('externalCallTesting', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe external call testing"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Estimation of Mean Opinion Score (MOS) or Voice Quality Assessment:</Text>
                <TextInput
                    value={typeof formData.mosEstimation === 'string' ? formData.mosEstimation : ''}
                    onChangeText={(text) => onFieldChange('mosEstimation', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe MOS or voice quality"
                    multiline
                />
            </View>

            {/* 6. Documentation and Records */}
            <Text className="text-lg font-bold mt-4 mb-2">6. DOCUMENTATION AND RECORDS</Text>
            <View>
                {[
                    'Photographic Evidence of Network Cabinets, Patch Panels, and Equipment',
                    'Floor Plan Annotations Indicating Rack and Phone Locations',
                    'Inventory of Existing IP Phones or Analog Devices',
                    'Notes on Existing System Challenges, User Feedback, or Known Issues',
                    'Licensing Requirements (SIP Trunks, PBX Subscriptions, Feature Licenses)'
                ].map((doc) => (
                    <View key={doc} className="flex-row items-center mb-2">
                        <TouchableOpacity
                            className={`w-6 h-6 border rounded mr-2 ${formData[`doc_${doc.replace(/\s/g, '')}`] ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
                            onPress={() => onFieldChange(`doc_${doc.replace(/\s/g, '')}`, !formData[`doc_${doc.replace(/\s/g, '')}`])}
                        >
                            {formData[`doc_${doc.replace(/\s/g, '')}`] && <MaterialIcons name="check" size={18} color="white" />}
                        </TouchableOpacity>
                        <Text>{doc}</Text>
                    </View>
                ))}
            </View>

            {/* 7. Recommendations and Next Steps */}
            <Text className="text-lg font-bold mt-4 mb-2">7. RECOMMENDATIONS AND NEXT STEPS</Text>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Proposed PBX Model and Deployment Architecture:</Text>
                <TextInput
                    value={typeof formData.proposedPbxModel === 'string' ? formData.proposedPbxModel : ''}
                    onChangeText={(text) => onFieldChange('proposedPbxModel', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe proposed PBX model"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Suggested Number and Type of IP Phones:</Text>
                <TextInput
                    value={typeof formData.suggestedIpPhones === 'string' ? formData.suggestedIpPhones : ''}
                    onChangeText={(text) => onFieldChange('suggestedIpPhones', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe suggested IP phones"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Network Equipment Requirements (PoE Switches, Routers, SFPs, Media Converters):</Text>
                <TextInput
                    value={typeof formData.networkEquipmentRequirements === 'string' ? formData.networkEquipmentRequirements : ''}
                    onChangeText={(text) => onFieldChange('networkEquipmentRequirements', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe network equipment requirements"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Structured Cabling Adjustments (Where required):</Text>
                <TextInput
                    value={typeof formData.structuredCablingAdjustments === 'string' ? formData.structuredCablingAdjustments : ''}
                    onChangeText={(text) => onFieldChange('structuredCablingAdjustments', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe cabling adjustments"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">VLAN and QoS Configuration Enhancements:</Text>
                <TextInput
                    value={typeof formData.vlanQosEnhancements === 'string' ? formData.vlanQosEnhancements : ''}
                    onChangeText={(text) => onFieldChange('vlanQosEnhancements', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe VLAN and QoS enhancements"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Draft IP Addressing Scheme for VoIP Devices:</Text>
                <TextInput
                    value={typeof formData.draftIpAddressingScheme === 'string' ? formData.draftIpAddressingScheme : ''}
                    onChangeText={(text) => onFieldChange('draftIpAddressingScheme', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe IP addressing scheme"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">User Training, Documentation, and Ongoing Support Plans:</Text>
                <TextInput
                    value={typeof formData.userTrainingPlans === 'string' ? formData.userTrainingPlans : ''}
                    onChangeText={(text) => onFieldChange('userTrainingPlans', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Describe training and support plans"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Observations:</Text>
                <TextInput
                    value={typeof formData.observations === 'string' ? formData.observations : ''}
                    onChangeText={(text) => onFieldChange('observations', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Enter observations"
                    multiline
                />
            </View>
            <View className="mb-3">
                <Text className="mb-1 font-normal">Recommendations:</Text>
                <TextInput
                    value={typeof formData.recommendations === 'string' ? formData.recommendations : ''}
                    onChangeText={(text) => onFieldChange('recommendations', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Enter recommendations"
                    multiline
                />
            </View>

            {/* Signatures */}
            <View className="mt-6">
                <Text className="text-lg font-bold mb-2">SIGNATURES</Text>
                <View className="w-1/2 pl-2">
                    <Text className="mb-1 font-normal">SEATEC REPRESENTATIVE</Text>
                    <TextInput
                        value={typeof formData.seatecRepNameSig === 'string' ? formData.seatecRepNameSig : ''}
                        onChangeText={(text) => onFieldChange('seatecRepNameSig', text)}
                        className="border border-gray-300 p-2 rounded mb-2"
                        placeholder="Tech. Personnel"
                    />
                    <TouchableOpacity
                        className="h-32 border-2 border-dashed border-gray-400 rounded-lg justify-center items-center bg-gray-100"
                        onPress={onShowSeatecSignatureModal}
                    >
                        {seatecSignature ? (
                            <Image source={{ uri: seatecSignature }} className="w-full h-full rounded-lg" />
                        ) : (
                            <View className="items-center">
                                <MaterialIcons name="edit" size={24} color="#3b82f6" />
                                <Text className="text-blue-600 mt-2">Tap to sign</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {seatecSignature && (
                        <TouchableOpacity
                            className="bg-red-500 py-2 px-4 rounded mt-2 self-start"
                            onPress={onClearSeatecSignature}
                        >
                            <Text className="text-white">Clear Signature</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Export Button */}
            <TouchableOpacity
                onPress={exportFormData}
                className="bg-green-600 py-3 px-6 rounded-lg items-center mt-6"
            >
                <Text className="text-white text-lg font-bold">Export to PDF</Text>
            </TouchableOpacity>

            {/* Success Modal */}
            <Modal
                visible={showSuccessModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center">
                    <View className="bg-white p-6 rounded-2xl w-4/5 max-w-sm shadow-2xl">
                        <Text className="text-xl font-bold text-gray-800 text-center mb-4">Success</Text>
                        <Text className="text-gray-600 text-center mb-6">PDF generated successfully!</Text>
                        <View className="space-y-5">
                            <TouchableOpacity
                                className="bg-blue-600 py-3 rounded-lg"
                                onPress={handlePreviewPdf}
                            >
                                <Text className="text-white text-center font-semibold">Preview PDF</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-blue-600 py-3 rounded-lg"
                                onPress={handleEmailPdf}
                            >
                                <Text className="text-white text-center font-semibold">Email PDF</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-blue-600 py-3 rounded-lg"
                                onPress={handleSavePdf}
                            >
                                <Text className="text-white text-center font-semibold">Save As...</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-gray-500 py-3 rounded-lg"
                                onPress={() => setShowSuccessModal(false)}
                            >
                                <Text className="text-white text-center font-semibold">Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Full-screen Loading Overlay */}
            {isLoading && (
                <View className="absolute inset-0 bg-black/40 justify-center items-center">
                    <View className="bg-white p-8 rounded-2xl w-4/5 shadow-2xl">
                        <ActivityIndicator size="large" color="#2563eb" />
                        <Text className="mt-6 text-gray-800 text-center font-semibold text-lg">
                            Preparing your survey document...
                        </Text>
                    </View>
                </View>
            )}
        </ScrollView>
    );
};

export default TelephonySurveyForm;