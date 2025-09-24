import { Image, ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MailComposer from 'expo-mail-composer';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { FormComponentProps, PDF_DIRECTORY, createPdfDirectory } from '../index';
import { generateCybersecuritySurveyPDF } from '../../src/pdfTemplates/CybersecuritySurveyTemplate';

const CybersecuritySurveyForm = ({
  formData,
  onFieldChange,
  toggleCheckbox,
  seatecSignature,
  onShowSeatecSignatureModal,
  onClearSeatecSignature,
}: FormComponentProps & { toggleCheckbox: (field: string, value: string) => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);

  const securityQuestions = [
    'Is your network protected by a firewall?',
    'Are network devices secured with encryption and strong passwords?',
    'Do you use segmentation to separate sensitive traffic?',
    'Is your wireless network secured with WPA3 or WPA2 encryption?',
    'Do you have antivirus and endpoint protection on all devices?',
    'Are all software and systems regularly updated with security patches?',
    'Are you using multi-factor authentication (MFA) for sensitive systems?',
    'Do you have a system to monitor your network for unusual activity?',
    'How quickly can you detect and respond to security incidents?',
    'Would you benefit from 24/7 network and endpoint monitoring?',
    'Do you have an incident response plan in place?',
    'Are employees trained on cybersecurity incident response?',
    'Have you conducted a recent vulnerability assessment?',
    'Are you using a Security Information and Event Management (SIEM) tool?',
    'Do you need help meeting compliance requirements?',
    'Would you be interested in FortiSIEM as a service?',
    'Do you have a data backup and disaster recovery plan?',
    'Is your sensitive data encrypted (both in transit and at rest)?',
    'Do you require help in securing your remote workforce (VPN, Endpoint Security)?',
  ];

  const exportSeatecSignature = async () => {
    console.log('[CybersecuritySurveyForm] Export button clicked');
    setIsLoading(true);

    try {
      // Ensure PDF directory exists
      const dirCreated = await createPdfDirectory();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `Cybersecurity_Survey_${formData.organizationName ? formData.organizationName.replace(/\s/g, '_') : 'Organization'}_${timestamp}.pdf`;
      const filePath = dirCreated ? `${PDF_DIRECTORY}${fileName}` : `${FileSystem.documentDirectory}${fileName}`;

      console.log('[CybersecuritySurveyForm] Generating PDF at path:', filePath);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF generation timeout - process took too long')), 60000)
      );

      // Ensure seatecSignature is passed correctly
      const exportData = {
        organizationName: formData.organizationName || '',
        contactPerson: formData.contactPerson || '',
        industry: formData.industry || '',
        seatecRepName: formData.seatecRepName || '',
        seatecSignature: seatecSignature || '',
        q0: formData.q0 || '',
        q1: formData.q1 || '',
        q2: formData.q2 || '',
        q3: formData.q3 || '',
        q4: formData.q4 || '',
        q5: formData.q5 || '',
        q6: formData.q6 || '',
        q7: formData.q7 || '',
        q8: formData.q8 || '',
        q9: formData.q9 || '',
        q10: formData.q10 || '',
        q11: formData.q11 || '',
        q12: formData.q12 || '',
        q13: formData.q13 || '',
        q14: formData.q14 || '',
        q15: formData.q15 || '',
        q16: formData.q16 || '',
        q17: formData.q17 || '',
        q18: formData.q18 || '',
      };

      // Generate PDF with timeout
      await Promise.race([
        generateCybersecuritySurveyPDF(exportData, filePath),
        timeoutPromise
      ]);

      // Verify file was created
      const fileInfo = await FileSystem.getInfoAsync(filePath) as { exists: boolean; size?: number };
      if (!fileInfo.exists) {
        throw new Error('PDF file was not created');
      }

      console.log('[CybersecuritySurveyForm] PDF generated successfully, file size:', fileInfo.size, 'bytes');
      setPdfPath(filePath);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('[CybersecuritySurveyForm] PDF Generation failed:', error);
      let errorMessage = 'Failed to generate the PDF. Please try again.';
      if ((error as Error).message.includes('timeout')) {
        errorMessage = 'PDF generation is taking too long. Please try again or contact support.';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      console.log('[CybersecuritySurveyForm] Process completed');
      setIsLoading(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (pdfPath) {
      try {
        await Sharing.shareAsync(pdfPath, {
          mimeType: 'application/pdf',
        });
        console.log('[CybersecuritySurveyForm] PDF preview opened');
        setPdfPath(null);
        setShowSuccessModal(false);
      } catch (error) {
        console.error('[CybersecuritySurveyForm] Error previewing PDF:', error);
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
        subject: `Cybersecurity Survey Report - ${formData.organizationName || 'Organization'}`,
        body: 'Please find the attached cybersecurity survey report PDF.',
        attachments: pdfPath ? [pdfPath] : [],
      });
      console.log('[CybersecuritySurveyForm] Email client opened');
      setPdfPath(null);
      setShowSuccessModal(false);
    } catch (error) {
      console.error('[CybersecuritySurveyForm] Error opening email client:', error);
      Alert.alert('Error', 'Failed to open email client');
    }
  };

  const handleSavePdf = async () => {
    if (pdfPath) {
      try {
        await Sharing.shareAsync(pdfPath, {
          dialogTitle: 'Save Cybersecurity Survey PDF',
          mimeType: 'application/pdf',
        });
        console.log('[CybersecuritySurveyForm] PDF save dialog shown');
        setPdfPath(null);
        setShowSuccessModal(false);
      } catch (error) {
        console.error('[CybersecuritySurveyForm] Error saving PDF:', error);
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
        <Text className="mb-1">Organization Name:</Text>
        <TextInput
          value={typeof formData.organizationName === 'string' ? formData.organizationName : ''}
          onChangeText={(text) => onFieldChange('organizationName', text)}
          className="border border-gray-300 p-2 rounded"
          placeholder="Enter organization name"
        />
      </View>

      <View className="mb-4">
        <Text className="mb-1">Contact Person:</Text>
        <TextInput
          value={typeof formData.contactPerson === 'string' ? formData.contactPerson : ''}
          onChangeText={(text) => onFieldChange('contactPerson', text)}
          className="border border-gray-300 p-2 rounded"
          placeholder="Enter contact person"
        />
      </View>

      <View className="mb-4">
        <Text className="mb-1">Industry/Sector:</Text>
        <TextInput
          value={typeof formData.industry === 'string' ? formData.industry : ''}
          onChangeText={(text) => onFieldChange('industry', text)}
          className="border border-gray-300 p-2 rounded"
          placeholder="Enter industry/sector"
        />
      </View>

      {/* Cybersecurity Assessment */}
      <Text className="text-lg font-bold mt-4 mb-2">CYBERSECURITY ASSESSMENT</Text>
      {securityQuestions.map((question, index) => (
        <View key={index} className="mb-4">
          <Text className="mb-2">{index + 1}. {question}</Text>
          <View className="flex-row justify-around">
            {['Yes', 'No', 'Partial', 'Need Help'].map((option) => (
              <TouchableOpacity
                key={option}
                className={`p-2 border rounded-lg ${
                  formData[`q${index}`] === option.toLowerCase() ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                }`}
                onPress={() => onFieldChange(`q${index}`, option.toLowerCase())}
              >
                <Text>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

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
        onPress={exportSeatecSignature}
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

export default CybersecuritySurveyForm;