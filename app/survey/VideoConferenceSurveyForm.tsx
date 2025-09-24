import { Image, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { FormComponentProps, PDF_DIRECTORY, createPdfDirectory } from '../index';
import { generateConferenceSurveyPDF } from '../../src/pdfTemplates/ConferenceSurveyTemplate';

// Define the custom form data interface
interface VideoConferenceSurveyFormData {
    seatecRepName?: string;
    position?: string;
    customerName?: string;
    contactPerson?: string;
    physicalLocation?: string;
    surveyDate?: string;
    expectedCompletionDate?: string;
    phoneNo?: string;
    roomSize?: string;
    ceilingType?: string;
    floorType?: string;
    lighting?: string;
    wallType?: string;
    soundAcoustics?: string;
    powerSourcesInPlace?: boolean;
    powerSourcesRequired?: boolean;
    cablingDetails?: string;
    networkPointsYes?: boolean;
    networkPointsNo?: boolean;
    networkPointsDescription?: string;
    powerBackup?: string;
    noOfPeople?: string;
    conferencingPlatform?: string;
    internetSourceCapacity?: string;
    screenTypeSize?: string;
    amplifiersNeeded?: string;
    clickShareDevice?: string;
    roomControlPanel?: string;
    interactiveScreen?: string;
    projector?: string;
    speakers?: string;
    microphone?: string;
    tabletsPC?: string;
    conferencePhone?: string;
    comments?: string;
    attachmentsPictures?: boolean;
    attachmentsDrawings?: boolean;
    attachmentsOthers?: boolean;
    date?: string;
    timeTaken?: string;
}

// Update the FormComponentProps to use the correct type
interface VideoConferenceFormComponentProps extends Omit<FormComponentProps, 'formData'> {
    formData: VideoConferenceSurveyFormData;
    toggleCheckbox: (field: string, value: boolean) => void;
}

const VideoConferenceSurveyForm = ({ 
    formData, 
    onFieldChange, 
    toggleCheckbox,
    seatecSignature, 
    onShowSeatecSignatureModal,
    onClearSeatecSignature 
}: VideoConferenceFormComponentProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [pdfPath, setPdfPath] = useState<string | null>(null);

    const exportToPDF = async () => {
        console.log('[VideoConferenceSurveyForm] Export button clicked');
        setIsLoading(true);

        try {
            // Ensure PDF directory exists
            const dirCreated = await createPdfDirectory();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `Video_Conference_Survey_${formData.customerName ? formData.customerName.replace(/\s/g, '_') : 'Customer'}_${timestamp}.pdf`;
            const filePath = dirCreated ? `${PDF_DIRECTORY}${fileName}` : `${FileSystem.documentDirectory}${fileName}`;

            console.log('[VideoConferenceSurveyForm] Generating PDF at path:', filePath);

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('PDF generation timeout - process took too long')), 60000)
            );

            // Prepare export data
            const exportData = {
                seatecRepName: formData.seatecRepName || '',
                position: formData.position || '',
                customerName: formData.customerName || '',
                contactPerson: formData.contactPerson || '',
                physicalLocation: formData.physicalLocation || '',
                surveyDate: formData.surveyDate || '',
                expectedCompletionDate: formData.expectedCompletionDate || '',
                phoneNo: formData.phoneNo || '',
                roomSize: formData.roomSize || '',
                ceilingType: formData.ceilingType || '',
                floorType: formData.floorType || '',
                lighting: formData.lighting || '',
                wallType: formData.wallType || '',
                soundAcoustics: formData.soundAcoustics || '',
                powerSourcesInPlace: formData.powerSourcesInPlace || false,
                powerSourcesRequired: formData.powerSourcesRequired || false,
                cablingDetails: formData.cablingDetails || '',
                networkPointsYes: formData.networkPointsYes || false,
                networkPointsNo: formData.networkPointsNo || false,
                networkPointsDescription: formData.networkPointsDescription || '',
                powerBackup: formData.powerBackup || '',
                noOfPeople: formData.noOfPeople || '',
                conferencingPlatform: formData.conferencingPlatform || '',
                internetSourceCapacity: formData.internetSourceCapacity || '',
                screenTypeSize: formData.screenTypeSize || '',
                amplifiersNeeded: formData.amplifiersNeeded || '',
                clickShareDevice: formData.clickShareDevice || '',
                roomControlPanel: formData.roomControlPanel || '',
                interactiveScreen: formData.interactiveScreen || '',
                projector: formData.projector || '',
                speakers: formData.speakers || '',
                microphone: formData.microphone || '',
                tabletsPC: formData.tabletsPC || '',
                conferencePhone: formData.conferencePhone || '',
                comments: formData.comments || '',
                signed: formData.signed || '',
                attachmentsPictures: formData.attachmentsPictures || false,
                attachmentsDrawings: formData.attachmentsDrawings || false,
                attachmentsOthers: formData.attachmentsOthers || false,
                date: formData.date || '',
                timeTaken: formData.timeTaken || '',
                seatecSignature: seatecSignature || '',
            };

            // Generate PDF with timeout
            await Promise.race([
                generateConferenceSurveyPDF(exportData, filePath),
                timeoutPromise
            ]);

            // Verify file was created
            const fileInfo = await FileSystem.getInfoAsync(filePath) as { exists: boolean; size?: number };
            if (!fileInfo.exists) {
                throw new Error('PDF file was not created');
            }

            console.log('[VideoConferenceSurveyForm] PDF generated successfully, file size:', fileInfo.size, 'bytes');
            setPdfPath(filePath);
            setShowSuccessModal(true);
        } catch (error) {
            console.error('[VideoConferenceSurveyForm] PDF Generation failed:', error);
            let errorMessage = 'Failed to generate the PDF. Please try again.';
            if ((error as Error).message.includes('timeout')) {
                errorMessage = 'PDF generation is taking too long. Please try again or contact support.';
            }
            Alert.alert('Error', errorMessage);
        } finally {
            console.log('[VideoConferenceSurveyForm] Process completed');
            setIsLoading(false);
        }
    };

    const handlePreviewPdf = async () => {
        if (pdfPath) {
            try {
                await Sharing.shareAsync(pdfPath, {
                    mimeType: 'application/pdf',
                });
                console.log('[VideoConferenceSurveyForm] PDF preview opened');
                setPdfPath(null);
                setShowSuccessModal(false);
            } catch (error) {
                console.error('[VideoConferenceSurveyForm] Error previewing PDF:', error);
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
                subject: `Video Conference Survey Report - ${formData.customerName || 'Customer'}`,
                body: 'Please find the attached video conference survey report PDF.',
                attachments: pdfPath ? [pdfPath] : [],
            });
            console.log('[VideoConferenceSurveyForm] Email client opened');
            setPdfPath(null);
            setShowSuccessModal(false);
        } catch (error) {
            console.error('[VideoConferenceSurveyForm] Error opening email client:', error);
            Alert.alert('Error', 'Failed to open email client');
        }
    };

    const handleSavePdf = async () => {
        if (pdfPath) {
            try {
                await Sharing.shareAsync(pdfPath, {
                    dialogTitle: 'Save Video Conference Survey PDF',
                    mimeType: 'application/pdf',
                });
                console.log('[VideoConferenceSurveyForm] PDF save dialog shown');
                setPdfPath(null);
                setShowSuccessModal(false);
            } catch (error) {
                console.error('[VideoConferenceSurveyForm] Error saving PDF:', error);
                Alert.alert('Error', 'Failed to save PDF');
            }
        } else {
            Alert.alert('Error', 'No PDF available to save');
        }
    };

    return (
        <ScrollView className="bg-white rounded-lg p-4 shadow-sm" contentContainerStyle={{ paddingBottom: 180 }}>
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

            {/* General Information */}
            <Text className="text-lg font-bold mb-2">GENERAL INFORMATION</Text>
            <View className="mb-4">
                <Text className="mb-1">Name of Seatec Representative:</Text>
                <TextInput
                    value={formData.seatecRepName || ''}
                    onChangeText={(text) => onFieldChange('seatecRepName', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter Seatec representative name"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Position:</Text>
                <TextInput
                    value={formData.position || ''}
                    onChangeText={(text) => onFieldChange('position', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter position"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Customer Name:</Text>
                <TextInput
                    value={formData.customerName || ''}
                    onChangeText={(text) => onFieldChange('customerName', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter customer name"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Contact Person:</Text>
                <TextInput
                    value={formData.contactPerson || ''}
                    onChangeText={(text) => onFieldChange('contactPerson', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter contact person"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Physical Location/Address:</Text>
                <TextInput
                    value={formData.physicalLocation || ''}
                    onChangeText={(text) => onFieldChange('physicalLocation', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter physical location/address"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Date of Survey:</Text>
                <TextInput
                    value={formData.surveyDate || ''}
                    onChangeText={(text) => onFieldChange('surveyDate', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter date (DD/MM/YYYY)"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Expected Completion Date:</Text>
                <TextInput
                    value={formData.expectedCompletionDate || ''}
                    onChangeText={(text) => onFieldChange('expectedCompletionDate', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter expected completion date (DD/MM/YYYY)"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Phone No.:</Text>
                <TextInput
                    value={formData.phoneNo || ''}
                    onChangeText={(text) => onFieldChange('phoneNo', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                />
            </View>

            {/* Room */}
            <Text className="text-lg font-bold mt-4 mb-2">ROOM</Text>
            <View className="mb-4">
                <Text className="mb-1">Size (Dimensions):</Text>
                <TextInput
                    value={formData.roomSize || ''}
                    onChangeText={(text) => onFieldChange('roomSize', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter dimensions (L x W x H)"
                />
            </View>

            {/* Physical Characteristics */}
            <Text className="text-lg font-bold mt-4 mb-2">PHYSICAL CHARACTERISTICS</Text>
            <View className="mb-4">
                <Text className="mb-1">Ceiling Type:</Text>
                <TextInput
                    value={formData.ceilingType || ''}
                    onChangeText={(text) => onFieldChange('ceilingType', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter ceiling type"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Floor Type:</Text>
                <TextInput
                    value={formData.floorType || ''}
                    onChangeText={(text) => onFieldChange('floorType', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter floor type"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Lighting (Natural/Electrical):</Text>
                <TextInput
                    value={formData.lighting || ''}
                    onChangeText={(text) => onFieldChange('lighting', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter lighting details"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Wall Type:</Text>
                <TextInput
                    value={formData.wallType || ''}
                    onChangeText={(text) => onFieldChange('wallType', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter wall type"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Sound/Acoustics:</Text>
                <TextInput
                    value={formData.soundAcoustics || ''}
                    onChangeText={(text) => onFieldChange('soundAcoustics', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter sound/acoustics details"
                />
            </View>

            {/* Power Sources */}
            <Text className="text-lg font-bold mt-4 mb-2">POWER SOURCES</Text>
            <View className="mb-4">
                <Text className="mb-1">In Place:</Text>
                <TouchableOpacity
                    className={`w-6 h-6 border rounded mr-2 ${formData.powerSourcesInPlace ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
                    onPress={() => toggleCheckbox('powerSourcesInPlace', !formData.powerSourcesInPlace)}
                >
                    {formData.powerSourcesInPlace && <MaterialIcons name="check" size={18} color="white" />}
                </TouchableOpacity>
            </View>
            <View className="mb-4">
                <Text className="mb-1">Required:</Text>
                <TouchableOpacity
                    className={`w-6 h-6 border rounded mr-2 ${formData.powerSourcesRequired ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
                    onPress={() => toggleCheckbox('powerSourcesRequired', !formData.powerSourcesRequired)}
                >
                    {formData.powerSourcesRequired && <MaterialIcons name="check" size={18} color="white" />}
                </TouchableOpacity>
            </View>

            {/* Cabling/Trunking/Drilling */}
            <Text className="text-lg font-bold mt-4 mb-2">CABLING/TRUNKING/DRILLING</Text>
            <View className="mb-4">
                <Text className="mb-1">Please provide details:</Text>
                <TextInput
                    value={formData.cablingDetails || ''}
                    onChangeText={(text) => onFieldChange('cablingDetails', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Enter cabling details"
                    multiline
                />
            </View>

            {/* Network Points (PoE/Non-PoE) */}
            <Text className="text-lg font-bold mt-4 mb-2">NETWORK POINTS (POE/NON-POE)</Text>
            <View className="mb-4">
                <Text className="mb-1">Yes:</Text>
                <TouchableOpacity
                    className={`w-6 h-6 border rounded mr-2 ${formData.networkPointsYes ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
                    onPress={() => toggleCheckbox('networkPointsYes', !formData.networkPointsYes)}
                >
                    {formData.networkPointsYes && <MaterialIcons name="check" size={18} color="white" />}
                </TouchableOpacity>
            </View>
            <View className="mb-4">
                <Text className="mb-1">No:</Text>
                <TouchableOpacity
                    className={`w-6 h-6 border rounded mr-2 ${formData.networkPointsNo ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
                    onPress={() => toggleCheckbox('networkPointsNo', !formData.networkPointsNo)}
                >
                    {formData.networkPointsNo && <MaterialIcons name="check" size={18} color="white" />}
                </TouchableOpacity>
            </View>
            <View className="mb-4">
                <Text className="mb-1">Description:</Text>
                <TextInput
                    value={formData.networkPointsDescription || ''}
                    onChangeText={(text) => onFieldChange('networkPointsDescription', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Enter description"
                    multiline
                />
            </View>

            {/* Power Backup */}
            <Text className="text-lg font-bold mt-4 mb-2">POWER BACKUP</Text>
            <View className="mb-4">
                <Text className="mb-1">Power Backup:</Text>
                <TextInput
                    value={formData.powerBackup || ''}
                    onChangeText={(text) => onFieldChange('powerBackup', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter power backup details"
                />
            </View>

            {/* Proposed Use */}
            <Text className="text-lg font-bold mt-4 mb-2">PROPOSED USE</Text>
            <View className="mb-4">
                <Text className="mb-1">No. of People:</Text>
                <TextInput
                    value={formData.noOfPeople || ''}
                    onChangeText={(text) => onFieldChange('noOfPeople', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter number of people"
                    keyboardType="numeric"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Conferencing Platform to be Interfaced (Zoom, Teams, Google Meet):</Text>
                <TextInput
                    value={formData.conferencingPlatform || ''}
                    onChangeText={(text) => onFieldChange('conferencingPlatform', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter conferencing platform"
                />
            </View>

            {/* Internet Source & Capacity */}
            <Text className="text-lg font-bold mt-4 mb-2">INTERNET SOURCE & CAPACITY</Text>
            <View className="mb-4">
                <Text className="mb-1">Internet Source & Capacity:</Text>
                <TextInput
                    value={formData.internetSourceCapacity || ''}
                    onChangeText={(text) => onFieldChange('internetSourceCapacity', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter internet source & capacity"
                />
            </View>

            {/* Devices to be Integrated */}
            <Text className="text-lg font-bold mt-4 mb-2">DEVICES TO BE INTEGRATED</Text>
            <View className="mb-4">
                <Text className="mb-1">Screen Type/Size:</Text>
                <TextInput
                    value={formData.screenTypeSize || ''}
                    onChangeText={(text) => onFieldChange('screenTypeSize', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter screen type/size"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Amplifiers If Needed:</Text>
                <TextInput
                    value={formData.amplifiersNeeded || ''}
                    onChangeText={(text) => onFieldChange('amplifiersNeeded', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter amplifiers if needed"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">ClickShare/Similar Device:</Text>
                <TextInput
                    value={formData.clickShareDevice || ''}
                    onChangeText={(text) => onFieldChange('clickShareDevice', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter ClickShare/similar device"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Room Control Panel:</Text>
                <TextInput
                    value={formData.roomControlPanel || ''}
                    onChangeText={(text) => onFieldChange('roomControlPanel', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter room control panel details"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Interactive Screen:</Text>
                <TextInput
                    value={formData.interactiveScreen || ''}
                    onChangeText={(text) => onFieldChange('interactiveScreen', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter interactive screen details"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Projector:</Text>
                <TextInput
                    value={formData.projector || ''}
                    onChangeText={(text) => onFieldChange('projector', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter projector details"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Speakers:</Text>
                <TextInput
                    value={formData.speakers || ''}
                    onChangeText={(text) => onFieldChange('speakers', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter speakers details"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Microphone:</Text>
                <TextInput
                    value={formData.microphone || ''}
                    onChangeText={(text) => onFieldChange('microphone', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter microphone details"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Tablets/PC:</Text>
                <TextInput
                    value={formData.tabletsPC || ''}
                    onChangeText={(text) => onFieldChange('tabletsPC', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter tablets/PC details"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Conference Phone:</Text>
                <TextInput
                    value={formData.conferencePhone || ''}
                    onChangeText={(text) => onFieldChange('conferencePhone', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter conference phone details"
                />
            </View>

            {/* Comments */}
            <Text className="text-lg font-bold mt-4 mb-2">COMMENTS</Text>
            <View className="mb-4">
                <Text className="mb-1">Comments:</Text>
                <TextInput
                    value={formData.comments || ''}
                    onChangeText={(text) => onFieldChange('comments', text)}
                    className="border border-gray-300 p-2 rounded h-20"
                    placeholder="Enter comments"
                    multiline
                />
            </View>

            <View className="mb-4">
                <Text className="mb-1">Attachments (Please Tick):</Text>
                <View className="flex-row items-center mb-2">
                    <TouchableOpacity
                        className={`w-6 h-6 border rounded mr-2 ${formData.attachmentsPictures ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
                        onPress={() => toggleCheckbox('attachmentsPictures', !formData.attachmentsPictures)}
                    >
                        {formData.attachmentsPictures && <MaterialIcons name="check" size={18} color="white" />}
                    </TouchableOpacity>
                    <Text>Pictures</Text>
                </View>
                <View className="flex-row items-center mb-2">
                    <TouchableOpacity
                        className={`w-6 h-6 border rounded mr-2 ${formData.attachmentsDrawings ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
                        onPress={() => toggleCheckbox('attachmentsDrawings', !formData.attachmentsDrawings)}
                    >
                        {formData.attachmentsDrawings && <MaterialIcons name="check" size={18} color="white" />}
                    </TouchableOpacity>
                    <Text>Drawings</Text>
                </View>
                <View className="flex-row items-center mb-2">
                    <TouchableOpacity
                        className={`w-6 h-6 border rounded mr-2 ${formData.attachmentsOthers ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
                        onPress={() => toggleCheckbox('attachmentsOthers', !formData.attachmentsOthers)}
                    >
                        {formData.attachmentsOthers && <MaterialIcons name="check" size={18} color="white" />}
                    </TouchableOpacity>
                    <Text>Others</Text>
                </View>
            </View>

            {/* Date, Time Taken */}
            <Text className="text-lg font-bold mt-4 mb-2">DATE, TIME TAKEN</Text>
            <View className="mb-4">
                <Text className="mb-1">Date:</Text>
                <TextInput
                    value={typeof formData.date === 'string' ? formData.date : ''}
                    onChangeText={(text) => onFieldChange('date', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter date (DD/MM/YYYY)"
                />
            </View>
            <View className="mb-4">
                <Text className="mb-1">Time Taken:</Text>
                <TextInput
                    value={typeof formData.timeTaken === 'string' ? formData.timeTaken : ''}
                    onChangeText={(text) => onFieldChange('timeTaken', text)}
                    className="border border-gray-300 p-2 rounded"
                    placeholder="Enter time taken"
                />
            </View>

            {/* Signatures */}
            <View className="mt-6">
                <Text className="text-lg font-bold mb-2">SIGNATURES</Text>
                <View className="w-1/2 pl-2">
                    <Text className="mb-1">SEATEC REPRESENTATIVE</Text>
                    <TextInput
                        value={typeof formData.seatecRepName === 'string' ? formData.seatecRepName : ''}
                        onChangeText={(text) => onFieldChange('seatecRepName', text)}
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
                onPress={exportToPDF}
                className="bg-green-600 py-3 px-6 rounded-lg items-center mt-6"
            >
                <Text className="text-white text-lg font-bold">Export to PDF</Text>
            </TouchableOpacity>

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

export default VideoConferenceSurveyForm;