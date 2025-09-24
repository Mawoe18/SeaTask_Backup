import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import fontkit from '@pdf-lib/fontkit';

export async function generateTelephonySurveyPDF(
  formData: any,
  savePath: string
): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  let page = pdfDoc.addPage([595, 842]); // A4 size
  let currentPageNumber = 1;
  const { width, height } = page.getSize();
  
  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Load custom font for logo if available
  let logoFont = helveticaBold; // Fallback
  try {
    const fontAsset = Asset.fromModule(require('../../assets/fonts/gill-sans-nova-heavy.ttf'));
    await fontAsset.downloadAsync();
    const fontUri = fontAsset.localUri;
    if (fontUri) {
      const fontBytes = await FileSystem.readAsStringAsync(fontUri, { encoding: FileSystem.EncodingType.Base64 });
      const fontUint8Array = Uint8Array.from(atob(fontBytes), c => c.charCodeAt(0));
      logoFont = await pdfDoc.embedFont(fontUint8Array);
    }
  } catch (error) {
    console.log('Custom font not loaded, using fallback:', error);
  }

  // Colors
  const blackColor = rgb(0, 0, 0);
  const primaryBlue = rgb(36 / 255, 131 / 255, 197 / 255);
  const borderColor = rgb(0.75, 0.75, 0.75);

  // Helper function for dotted lines
  const drawDottedLine = (page: any, startX: number, endX: number, yPos: number, color = blackColor) => {
    const dotSpacing = 3;
    for (let x = startX; x < endX; x += dotSpacing * 2) {
      page.drawCircle({
        x: Math.min(x, endX - 1),
        y: yPos - 5,
        size: 0.5,
        color,
      });
    }
  };

  // Helper for wrapping text with consistent width for all lines
  const wrapTextToFitLine = (text: string, font: any, fontSize: number, maxWidth: number): { lines: string[], count: number } => {
    const lines: string[] = [];
    const words = text.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Handle very long words
          let tempWord = word;
          while (tempWord.length > 0) {
            let i = tempWord.length;
            while (i > 0 && font.widthOfTextAtSize(tempWord.substring(0, i), fontSize) > maxWidth) {
              i--;
            }
            lines.push(tempWord.substring(0, i));
            tempWord = tempWord.substring(i);
          }
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return { lines, count: lines.length };
  };

  // Helper to add new page if needed and draw header/footer
  const addNewPageIfNeeded = (requiredHeight: number, margin = 80) => {
    if (y - requiredHeight < margin) {
      drawFooter(page, height);
      page = pdfDoc.addPage([595, 842]);
      currentPageNumber++;
      y = height - 60; // Only logo, no title on subsequent pages
      drawSubsequentPageLogo(page, width, height);
    }
  };

  // Draw header with logo and title (first page only)
  const drawHeader = (page: any, width: number, height: number) => {
    // Logo positioned higher up
    const logoText = "seatec";
    const logoSize = 36;
    const logoWidth = logoFont.widthOfTextAtSize(logoText, logoSize);
    const logoX = width - logoWidth - 50;
    page.drawText(logoText, { x: logoX, y: height - 45, size: logoSize, font: logoFont, color: primaryBlue });

    // Title - only on first page
    let titleY = height - 70;
    const titleLines = [
      'TELEPHONY SURVEY FORM',
    ];
    titleLines.forEach((line, index) => {
      const size = index === 0 ? 14 : 12;
      const fontToUse = index === 0 ? helveticaBold : helvetica;
      const textWidth = fontToUse.widthOfTextAtSize(line, size);
      page.drawText(line, { x: (width - textWidth) / 2, y: titleY, size, font: fontToUse, color: blackColor });
      titleY -= size + 5;
    });
  };

  // Draw only logo on subsequent pages
  const drawSubsequentPageLogo = (page: any, width: number, height: number) => {
    const logoText = "seatec";
    const logoSize = 36;
    const logoWidth = logoFont.widthOfTextAtSize(logoText, logoSize);
    const logoX = width - logoWidth - 50;
    page.drawText(logoText, { x: logoX, y: height - 45, size: logoSize, font: logoFont, color: primaryBlue });
  };

  // Draw footer
  const drawFooter = (page: any, height: number) => {
    const footerY = 30;
    const footerText1 = "Empowering You to Win with IT";
    const footerWidth1 = helveticaBold.widthOfTextAtSize(footerText1, 10);
    page.drawText(footerText1, {
      x: (width - footerWidth1) / 2,
      y: footerY + 15,
      size: 10,
      font: helveticaBold,
      color: primaryBlue,
    });

    const footerText2 = "IT Infrastructure Services | Business Software | Connectivity";
    const footerWidth2 = helveticaBold.widthOfTextAtSize(footerText2, 10);
    page.drawText(footerText2, {
      x: (width - footerWidth2) / 2,
      y: footerY,
      size: 10,
      font: helveticaBold,
      color: primaryBlue,
    });

    const footerText3 = "info@seatectelecom.com; 0271441810; www.seatectelecom.com";
    const footerWidth3 = helvetica.widthOfTextAtSize(footerText3, 9);
    page.drawText(footerText3, {
      x: (width - footerWidth3) / 2,
      y: footerY - 12,
      size: 9,
      font: helvetica,
      color: primaryBlue,
    });

    const address = "Location: Plot No. A603, Heavy Industrial Area, Accra Road, Tema, Ghana";
    const addressWidth = helvetica.widthOfTextAtSize(address, 8);
    page.drawText(address, {
      x: (width - addressWidth) / 2,
      y: footerY - 22,
      size: 8,
      font: helvetica,
      color: primaryBlue,
    });
  };

  // Helper function to draw signature
  const drawSignatureInContainer = async (
    pdfDoc: PDFDocument,
    page: any,
    signatureData: string,
    containerX: number,
    containerY: number,
    containerWidth: number,
    containerHeight: number
  ) => {
    try {
      const base64Data = signatureData.replace(/^data:image\/[^;]+;base64,/, '');
      const signatureBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

      let signatureImage;
      try {
        signatureImage = await pdfDoc.embedPng(signatureBytes);
      } catch (pngError) {
        try {
          signatureImage = await pdfDoc.embedJpg(signatureBytes);
        } catch (jpgError) {
          console.error('Could not embed signature as PNG or JPG:', jpgError);
          return;
        }
      }

      const availableWidth = containerWidth - 2;
      const availableHeight = containerHeight - 6;
      const aspectRatio = signatureImage.width / signatureImage.height;

      let sigWidth = availableWidth * 0.95; // Retained for prominence
      let sigHeight = sigWidth / aspectRatio;

      if (sigHeight > availableHeight) {
        sigHeight = availableHeight;
        sigWidth = sigHeight * aspectRatio;
        if (sigWidth < availableWidth * 0.8) {
          sigWidth = availableWidth * 0.9;
        }
      }

      const signatureCenterX = containerX + (containerWidth / 2);
      const signatureX = signatureCenterX - (sigWidth / 2);
      const signatureYPos = containerY + (availableHeight / 2) + (sigHeight / 2) - 5;

      page.drawImage(signatureImage, {
        x: signatureX,
        y: signatureYPos - sigHeight,
        width: sigWidth,
        height: sigHeight,
        opacity: 1.0,
      });
    } catch (error) {
      console.error('Error embedding signature:', error);
    }
  };

  // Initial header on first page
  drawHeader(page, width, height);
  let y = height - 100; // Reduced spacing from 140 to 100

  // General Information
  addNewPageIfNeeded(26); // Adjusted to match fixed spacing
  page.drawText('GENERAL INFORMATION', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const generalFields = [
    { label: 'Name of Seatec Representative:', value: formData.seatecRepName || '' },
    { label: 'Position:', value: formData.position || '' },
    { label: "Name of Customer's Company:", value: formData.customerCompanyName || '' },
    { label: 'Customer Address:', value: formData.customerAddress || '' },
    { label: 'Nature of Business:', value: formData.natureOfBusiness || '' },
    { label: 'Representative Name:', value: formData.representativeName || '' },
    { label: 'Phone No.:', value: formData.phoneNo || '' },
    { label: 'Date of Survey:', value: formData.dateOfSurvey || '' },
    { label: 'Purpose of Survey:', value: formData.purposeOfSurvey || '' },
  ];

  generalFields.forEach((field) => {
    addNewPageIfNeeded(26); // Adjusted to match fixed spacing
    page.drawText(field.label, { x: 50, y, size: 10, font: helvetica, color: blackColor });
    const valueX = 50 + helvetica.widthOfTextAtSize(field.label, 10) + 10;
    drawDottedLine(page, valueX, width - 50, y);
    const valueLines = wrapTextToFitLine(field.value, helvetica, 10, width - valueX - 50);
    let currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: valueX, y: currentY, size: 10, font: helvetica, color: primaryBlue });
      currentY -= 16;
    });
    y -= 26; // Fixed spacing (16 for text height + 10 for gap)
  });

  y -= 10;

  // 1. Network Infrastructure Assessment
  addNewPageIfNeeded(20);
  page.drawText('1. NETWORK INFRASTRUCTURE ASSESSMENT', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const networkFields = [
    { label: 'Overview of Existing Network Architecture (LAN/WAN Topology):', value: formData.networkArchitectureOverview || '' },
    { label: 'Assessment of PoE Availability:', value: formData.poeAvailabilityAssessment || '' },
    { label: 'VLAN Configuration for Voice and Data Separation:', value: formData.vlanConfiguration || '' },
    { label: 'Cabling Infrastructure Type (Cat5e, Cat6, BA, Fiber):', value: formData.cablingInfrastructureType || '' },
    { label: 'IP Addressing Scheme:', value: formData.ipAddressingScheme || '' },
    { label: 'Internet Connectivity - Bandwidth, Uptime, SP Detail:', value: formData.internetConnectivity || '' },
    { label: 'Firewall Capabilities (SIP ALG Handling, NAT Traversal):', value: formData.firewallCapabilities || '' },
  ];

  networkFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 10, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: blackColor });
      currentY -= 14;
    });
    y -= labelLines.count * 14;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 10, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: primaryBlue });
      currentY -= 14;
    });
    y -= valueLines.count * 14 + 8;
  });

  // 2. Telephony System Requirements
  addNewPageIfNeeded(20);
  page.drawText('2. TELEPHONY SYSTEM REQUIREMENTS', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const telephonyFields = [
    { label: 'Required Type of Telephony Solution (On-Premises IP PBX/Hosted VoIP/Hybrid):', value: formData.telephonySolutionType?.join(', ') || '' },
    { label: 'Total Number of Users/Extensions:', value: formData.totalUsersExtensions || '' },
    { label: 'User Roles (Reception, Management, Call Center, Remote Workers, etc.):', value: formData.userRoles || '' },
    { label: 'Assessment of Existing Telephony System (if applicable):', value: formData.existingTelephonyAssessment || '' },
    { label: 'Preferred Existing Phone Types (Desk Phones (Wired/Wireless), DECT, Softphones):', value: formData.preferredPhoneTypes || '' },
    { label: 'Additional Requirements:', value: formData.additionalRequirements || '' },
    { label: 'External Line/Trunk Requirements (SIP Trunks, ISDN, E1/T1, FXO/FXS):', value: formData.externalTrunkRequirements || '' },
  ];

  telephonyFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 10, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: blackColor });
      currentY -= 14;
    });
    y -= labelLines.count * 14;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 10, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: primaryBlue });
      currentY -= 14;
    });
    y -= valueLines.count * 14 + 8;
  });

  // 3. Power & Environmental Considerations
  addNewPageIfNeeded(20);
  page.drawText('3. POWER & ENVIRONMENTAL CONSIDERATIONS', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const powerFields = [
    { label: 'Availability of Electrical Sockets at Phone Installation Points:', value: formData.electricalSocketsAvailability || '' },
    { label: 'Power Backup/UPS for Network and Telephony Equipment:', value: formData.powerBackup || '' },
    { label: 'Cooling and Ventilation for Network/Server Rooms:', value: formData.coolingVentilation || '' },
    { label: 'Availability of Rack Cabinets for PBX, Gateways, and Switches:', value: formData.rackCabinetsAvailability || '' },
  ];

  powerFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 10, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: blackColor });
      currentY -= 14;
    });
    y -= labelLines.count * 14;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 10, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: primaryBlue });
      currentY -= 14;
    });
    y -= valueLines.count * 14 + 8;
  });

  // 4. Physical Infrastructure Assessment
  addNewPageIfNeeded(20);
  page.drawText('4. PHYSICAL INFRASTRUCTURE ASSESSMENT', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const physicalFields = [
    { label: 'Mapping of Proposed Phone Locations by Department/Area:', value: formData.phoneLocationsMapping || '' },
    { label: 'Condition and Availability of Structured Cabling Outlets:', value: formData.cablingOutletsCondition || '' },
    { label: 'Wi-Fi Coverage Assessment (for Wireless Phones or Softphones if Applicable):', value: formData.wifiCoverageAssessment || '' },
    { label: 'Cable Pathways and Trunking Infrastructure:', value: formData.cablePathways || '' },
    { label: 'Distance Between Endpoints and Switches (Cable Run Feasibility):', value: formData.distanceEndpointsSwitches || '' },
  ];

  physicalFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 10, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: blackColor });
      currentY -= 14;
    });
    y -= labelLines.count * 14;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 10, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: primaryBlue });
      currentY -= 14;
    });
    y -= valueLines.count * 14 + 8;
  });

  // 5. Network and Voice Quality Testing
  addNewPageIfNeeded(20);
  page.drawText('5. NETWORK AND VOICE QUALITY TESTING', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const testingFields = [
    { label: 'Ping, Latency, Jitter, and Packet Loss Testing:', value: formData.pingLatencyTesting || '' },
    { label: 'Registration of Test IP Phones and SIP Parameters, etc.:', value: formData.testIpPhonesRegistration || '' },
    { label: 'Internal Call Testing (Extension to Extension):', value: formData.internalCallTesting || '' },
    { label: 'External Call Testing (SIP/FXO Trunks):', value: formData.externalCallTesting || '' },
    { label: 'Estimation of Mean Opinion Score (MOS) or Voice Quality Assessment:', value: formData.mosEstimation || '' },
  ];

  testingFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 10, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: blackColor });
      currentY -= 14;
    });
    y -= labelLines.count * 14;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 10, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: primaryBlue });
      currentY -= 14;
    });
    y -= valueLines.count * 14 + 8;
  });

  // 6. Documentation and Records
  addNewPageIfNeeded(20);
  page.drawText('6. DOCUMENTATION AND RECORDS', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const docFields = [
    { label: 'Photographic Evidence of Network Cabinets, Patch Panels, and Equipment:', value: formData.doc_PhotographicEvidenceofNetworkCabinetsPatchPanelsandEquipment ? 'Yes' : 'No' },
    { label: 'Floor Plan Annotations Indicating Rack and Phone Locations:', value: formData.doc_FloorPlanAnnotationsIndicatingRackandPhoneLocations ? 'Yes' : 'No' },
    { label: 'Inventory of Existing IP Phones or Analog Devices:', value: formData.doc_InventoryofExistingIPPhonesorAnalogDevices ? 'Yes' : 'No' },
    { label: 'Notes on Existing System Challenges, User Feedback, or Known Issues:', value: formData.doc_NotesonExistingSystemChallengesUserFeedbackorKnownIssues ? 'Yes' : 'No' },
    { label: 'Licensing Requirements (SIP Trunks, PBX Subscriptions, Feature Licenses):', value: formData.doc_LicensingRequirementsSIPTrunksPBXSubscriptionsFeatureLicenses ? 'Yes' : 'No' },
  ];

  docFields.forEach((field) => {
    addNewPageIfNeeded(25);
    page.drawText(field.label, { x: 50, y, size: 10, font: helvetica, color: blackColor });
    const valueX = 50 + helvetica.widthOfTextAtSize(field.label, 10) + 10;
    page.drawText(field.value, { x: valueX, y, size: 10, font: helvetica, color: primaryBlue });
    y -= 14 + 8;
  });

  // 7. Recommendations and Next Steps
  addNewPageIfNeeded(20);
  page.drawText('7. RECOMMENDATIONS AND NEXT STEPS', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 10;

  const recFields = [
    { label: 'Proposed PBX Model and Deployment Architecture:', value: formData.proposedPbxModel || '' },
    { label: 'Suggested Number and Type of IP Phones:', value: formData.suggestedIpPhones || '' },
    { label: 'Network Equipment Requirements (PoE Switches, Routers, SFPs, Media Converters):', value: formData.networkEquipmentRequirements || '' },
    { label: 'Structured Cabling Adjustments (Where required):', value: formData.structuredCablingAdjustments || '' },
    { label: 'VLAN and QoS Configuration Enhancements:', value: formData.vlanQosEnhancements || '' },
    { label: 'Draft IP Addressing Scheme for VoIP Devices:', value: formData.draftIpAddressingScheme || '' },
    { label: 'User Training, Documentation, and Ongoing Support Plans:', value: formData.userTrainingPlans || '' },
    { label: 'Observations:', value: formData.observations || '' },
    { label: 'Recommendations:', value: formData.recommendations || '' },
  ];

  recFields.forEach((field) => {
    addNewPageIfNeeded(35);
    const labelLines = wrapTextToFitLine(field.label, helvetica, 10, width - 100);
    let currentY = y;
    labelLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: blackColor });
      currentY -= 14;
    });
    y -= labelLines.count * 14;

    const valueLines = wrapTextToFitLine(field.value, helvetica, 10, width - 100);
    currentY = y;
    valueLines.lines.forEach((line) => {
      page.drawText(line, { x: 50, y: currentY, size: 10, font: helvetica, color: primaryBlue });
      currentY -= 14;
    });
    y -= valueLines.count * 14 + 8;
  });

  // Signatures Section
  addNewPageIfNeeded(150);
  page.drawText('SIGNATURES', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;

  page.drawText('SEATEC REPRESENTATIVE', { x: 50, y, size: 12, font: helveticaBold, color: blackColor });
  y -= 20;

  page.drawText('Signature:', { x: 50, y, size: 10, font: helvetica, color: blackColor });
  y -= 10;

  // Signature container
  const containerWidth = 200;
  const containerHeight = 50;
  const seatecContainerX = 100; // Shifted right from 50 to 100
  const seatecContainerY = y - containerHeight;

  if (formData.seatecSignature) {
    await drawSignatureInContainer(
      pdfDoc,
      page,
      formData.seatecSignature,
      seatecContainerX,
      seatecContainerY,
      containerWidth,
      containerHeight
    );
  }

  y -= containerHeight + 10;

  // Draw footer on the last page
  drawFooter(page, height);

  // Save the PDF
  const base64 = await pdfDoc.saveAsBase64();
  await FileSystem.writeAsStringAsync(savePath, base64, { encoding: FileSystem.EncodingType.Base64 });
  return savePath;
}