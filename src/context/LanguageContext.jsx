import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Nav
    nav_monitoring: 'Live Monitoring',
    nav_diagnostics: 'Diagnostic Hub',
    nav_archives: 'Neural Archives',
    nav_patients: 'Patient Database',
    nav_lab: 'Neural Lab',
    nav_reports: 'Clinical Reports',
    nav_help: 'Help Center',
    nav_terminate: 'End Session',
    nav_light_mode: 'Light',
    nav_dark_mode: 'Dark',
    sandbox_title: 'Neural Sandbox',
    ai_diag_title: 'AI Diagnostic View',
    in_focus: 'Current Patient',
    search_placeholder: 'Search by name or ID...',
    
    // Help Center / Manual
    manual_title: 'Clinical Operations Manual',
    manual_subtitle: 'System guidelines and neural interpretation standards',
    man_mod1_title: 'Live Telemetry & Capture',
    man_mod1_desc: 'Managing real-time bio-signal streams and hardware bridging.',
    man_instr1_title: 'Electrode Placement',
    man_instr1_body: 'Ensure leads V1-V6 are positioned according to standard precordial placement for optimal PINN solving.',
    man_instr1_list: '• V1-V2: 4th intercostal space • V4-V6: 5th intercostal space',
    man_instr2_title: 'Bridge Linking',
    man_instr2_body: 'Enter the Device ID in the sidebar to link physical hardware to the neural cloud.',
    man_instr2_standard: 'Standard: NeuralBridge Protocol v2.1',
    man_mod2_title: 'Vital Interpretation',
    man_mod2_desc: 'Standard clinical thresholds used by the Bioelectric AI.',
    man_vital_title: 'Clinical Reference Ranges',
    man_vital_pr: 'PR Interval',
    man_vital_pr_desc: 'Atrioventricular conduction time.',
    man_vital_qrs: 'QRS Duration',
    man_vital_qrs_desc: 'Ventricular depolarization time.',
    man_vital_qtc: 'QTc Interval',
    man_vital_qtc_desc: 'Normalized ventricular recovery.',
    man_vital_hr: 'Heart Rate',
    man_vital_hr_desc: 'Cardiac frequency.',
    man_vital_axis: 'Cardiac Axis',
    man_vital_axis_desc: 'Dominant vector of activation.',
    man_sandbox_logic_title: 'Physics Sandbox',
    man_sandbox_logic_body: 'Adjust Aliev-Panfilov parameters to simulate myocardial propagation delays.',
    man_sandbox_map_title: 'Neural Mapping',
    man_sandbox_map_body: 'Real-time source localization using the PINN inverse solver.',
    man_mod3_title: 'Neural Lab Operations',
    man_mod3_desc: 'Simulating complex pathologies using biophysical constants.',
    man_param_a_title: 'Excitation (a)',
    man_param_a_desc: 'Threshold of cellular depolarization.',
    man_param_k_title: 'Scaling (k)',
    man_param_k_desc: 'Potential magnitude of the action wave.',
    man_param_d_title: 'Diffusion (D)',
    man_param_d_desc: 'Speed of signal propagation across nodes.',
    man_lab_tip: 'Note: Excessive diffusion (D > 0.005) may lead to numerical instability.',
    ref_title: 'Clinical References',
    ref_physionet: 'MIT-BIH Arrhythmia Standard',
    ref_pinn_paper: 'Aliev-Panfilov Model Core',
    ref_disclaimer: 'Disclaimer: This AI system is a diagnostic aid and should not replace clinical judgment.',

    // Patient List
    patient_db_title: 'Patient Database',
    patient_db_subtitle: 'Electronic medical records management system',
    register_patient: 'Register New Patient',
    modal_title: 'Patient Registration (Clinical Registration)',
    modal_subtitle: 'Recording data according to HL7 FHIR standards',
    tab_demographics: 'Demographics',
    tab_clinical: 'Clinical Information',
    label_fullname: 'Full Name',
    label_idcard: 'ID Card / Passport Number',
    label_dob: 'Date of Birth',
    label_gender: 'Gender',
    label_blood: 'Blood Type',
    label_priority: 'Priority Level',
    label_allergies: 'Drug Allergies & Precautions',
    label_emergency: 'Emergency Contact (Name/Phone)',
    btn_cancel: 'Cancel',
    btn_next: 'Next Step',
    btn_complete: 'Complete Registration',
    status_active: 'Active',
    patient_count: 'patient',
    patient_count_filtered: 'filtered from',
    no_patient_found: 'No matching patients found',
    no_patient_data: 'No patient data yet',

    // Live Monitoring
    start_capture: 'Record',

    // Layout
    language: 'Language',
    quick_switch: 'Quick Switch',
    recent_subjects: 'Recent Subjects',

    // Neural Sandbox
    sandbox_subtitle: 'Physics-Informed Neural Simulation',
    select_dataset: 'Select Dataset',
    run_test: 'Run Neural Analysis',

    // AI Diagnostics
    ai_diag_subtitle: 'Deep Signal Classification Engine',
    dataset_ref: 'Dataset Reference',
    dataset_mit: 'MIT-BIH Arrhythmia Database',
    model_ref: 'Model Reference',
    model_ap: 'Aliev-Panfilov PINN Core',

    // Analysis
    analysis_title: '3D Analysis Center',
    analysis_subtitle: 'Real-time source localization and neural mapping',
    active_patient: 'Active Patient',
    slice: 'Slice',
    grid: 'Grid',
    '3d': '3D',
    system_resonance: 'System Resonance',
    success: 'Online',
    loading: 'Processing...',
    capture_snapshot: 'Capture Snapshot',
    localization_log: 'Localization Log',
    capture_success: 'Snapshot saved successfully',
    capture_error: 'Failed to save snapshot',
  },
  th: {
    // Nav
    nav_monitoring: 'ระบบติดตามสด',
    nav_diagnostics: 'ศูนย์วินิจฉัย AI',
    nav_archives: 'คลังประวัติประสาท',
    nav_patients: 'ฐานข้อมูลคนไข้',
    nav_lab: 'ห้องแล็บจำลอง',
    nav_reports: 'รายงานผลตรวจ',
    nav_help: 'ศูนย์ช่วยเหลือ',
    nav_terminate: 'ออกจากระบบ',
    nav_light_mode: 'โหมดสว่าง',
    nav_dark_mode: 'โหมดมืด',
    sandbox_title: 'แซนด์บ็อกซ์จำลอง',
    ai_diag_title: 'มุมมองวินิจฉัย AI',
    in_focus: 'คนไข้ปัจจุบัน',
    search_placeholder: 'ค้นหาด้วยชื่อ หรือ เลขบัตรประชาชน...',

    // Help Center / Manual
    manual_title: 'คู่มือการปฏิบัติงานทางคลินิก',
    manual_subtitle: 'แนวทางปฏิบัติและการแปลผลสัญญาณประสาทไฟฟ้า',
    man_mod1_title: 'ระบบติดตามและรับข้อมูล',
    man_mod1_desc: 'การจัดการสัญญาณชีวภาพแบบเรียลไทม์และการเชื่อมต่อฮาร์ดแวร์',
    man_instr1_title: 'การวางตำแหน่งขั้วไฟฟ้า',
    man_instr1_body: 'ตรวจสอบการวาง Lead V1-V6 ให้ตรงตามมาตรฐาน Precordial เพื่อการประมวลผล PINN ที่แม่นยำที่สุด',
    man_instr1_list: '• V1-V2: ช่องซี่โครงที่ 4 • V4-V6: ช่องซี่โครงที่ 5',
    man_instr2_title: 'การเชื่อมต่ออุปกรณ์',
    man_instr2_body: 'กรอกรหัส Device ID ในแถบด้านข้างเพื่อเชื่อมต่อฮาร์ดแวร์จริงเข้าสู่ Neural Cloud',
    man_instr2_standard: 'มาตรฐาน: โปรโตคอล NeuralBridge v2.1',
    man_mod2_title: 'เกณฑ์การแปลผลสัญญาณชีพ',
    man_mod2_desc: 'เกณฑ์มาตรฐานทางคลินิกที่ใช้ในระบบ Bioelectric AI',
    man_vital_title: 'ช่วงอ้างอิงทางคลินิก (Reference Ranges)',
    man_vital_pr: 'ช่วง PR (PR Interval)',
    man_vital_pr_desc: 'เวลาที่กระแสไฟฟ้าเดินทางจากห้องบนสู่ห้องล่าง',
    man_vital_qrs: 'ช่วง QRS (QRS Duration)',
    man_vital_qrs_desc: 'เวลาที่หัวใจห้องล่างบีบตัว (Depolarization)',
    man_vital_qtc: 'ช่วง QTc (QTc Interval)',
    man_vital_qtc_desc: 'เวลาในการฟื้นตัวของหัวใจห้องล่างที่ปรับตาม HR',
    man_vital_hr: 'อัตราการเต้นของหัวใจ',
    man_vital_hr_desc: 'ความถี่การเต้นของหัวใจต่อนาที',
    man_vital_axis: 'แกนไฟฟ้าหัวใจ (Axis)',
    man_vital_axis_desc: 'ทิศทางหลักของการนำไฟฟ้าในหัวใจ',
    man_sandbox_logic_title: 'ระบบแซนด์บ็อกซ์ฟิสิกส์',
    man_sandbox_logic_body: 'ปรับพารามิเตอร์ Aliev-Panfilov เพื่อจำลองความหน่วงของการแพร่กระจายกระแสไฟฟ้า',
    man_sandbox_map_title: 'แผนที่ประสาทไฟฟ้า',
    man_sandbox_map_body: 'การระบุตำแหน่งต้นกำเนิดสัญญาณแบบเรียลไทม์ด้วย PINN Inverse Solver',
    man_mod3_title: 'การใช้งานห้องแล็บจำลอง',
    man_mod3_desc: 'จำลองพยาธิสภาพที่ซับซ้อนโดยใช้ค่าคงที่ทางฟิสิกส์ชีวภาพ',
    man_param_a_title: 'การกระตุ้น (Excitation - a)',
    man_param_a_desc: 'ระดับแรงดันเริ่มต้นในการเปลี่ยนประจุเซลล์',
    man_param_k_title: 'การขยายสัญญาณ (Scaling - k)',
    man_param_k_desc: 'ขนาดความแรงของคลื่นไฟฟ้าหัวใจ',
    man_param_d_title: 'การแพร่กระจาย (Diffusion - D)',
    man_param_d_desc: 'ความเร็วในการส่งสัญญาณข้ามโหนดต่างๆ',
    man_lab_tip: 'หมายเหตุ: การแพร่กระจายที่สูงเกินไป (D > 0.005) อาจทำให้ผลคำนวณไม่เสถียร',
    ref_title: 'แหล่งอ้างอิงทางคลินิก',
    ref_physionet: 'มาตรฐานภาวะหัวใจเต้นผิดจังหวะ MIT-BIH',
    ref_pinn_paper: 'โครงสร้างแบบจำลอง Aliev-Panfilov',
    ref_disclaimer: 'คำเตือน: ระบบ AI นี้เป็นเครื่องมือช่วยวินิจฉัยเท่านั้น ไม่ควรใช้แทนดุลยพินิจของแพทย์',

    // Patient List
    patient_db_title: 'ฐานข้อมูลทะเบียนคนไข้',
    patient_db_subtitle: 'ระบบจัดการเวชระเบียนอิเล็กทรอนิกส์มาตรฐานดิจิทัล',
    register_patient: 'ลงทะเบียนคนไข้ใหม่',
    modal_title: 'ลงทะเบียนคนไข้ (Clinical Registration)',
    modal_subtitle: 'บันทึกข้อมูลตามมาตรฐาน HL7 FHIR',
    tab_demographics: 'ข้อมูลทั่วไป',
    tab_clinical: 'ข้อมูลการแพทย์',
    label_fullname: 'ชื่อ-นามสกุล',
    label_idcard: 'เลขบัตรประชาชน / Passport',
    label_dob: 'วันเกิด (พ.ศ.)',
    label_gender: 'เพศ',
    label_blood: 'หมู่เลือด',
    label_priority: 'ระดับความสำคัญ',
    label_allergies: 'ประวัติการแพ้ยาและข้อควรระวัง',
    label_emergency: 'ผู้ติดต่อฉุกเฉิน (ชื่อ/เบอร์โทร)',
    btn_cancel: 'ยกเลิก',
    btn_next: 'ขั้นตอนถัดไป',
    btn_complete: 'ลงทะเบียนสำเร็จ',
    status_active: 'กำลังรับการรักษา',
    patient_count: 'ราย',
    patient_count_filtered: 'กรองจาก',
    no_patient_found: 'ไม่พบผู้ป่วยที่ตรงกัน',
    no_patient_data: 'ยังไม่มีข้อมูลผู้ป่วย',

    // Live Monitoring
    start_capture: 'บันทึก',

    // Layout
    language: 'ภาษา',
    quick_switch: 'สลับคนไข้',
    recent_subjects: 'รายการล่าสุด',

    // Neural Sandbox
    sandbox_subtitle: 'การจำลองประสาทด้วยฟิสิกส์',
    select_dataset: 'เลือกชุดข้อมูล',
    run_test: 'รันการวิเคราะห์',

    // AI Diagnostics
    ai_diag_subtitle: 'ระบบจำแนกสัญญาณเชิงลึก',
    dataset_ref: 'แหล่งข้อมูลอ้างอิง',
    dataset_mit: 'ฐานข้อมูล MIT-BIH Arrhythmia',
    model_ref: 'อ้างอิงโมเดล',
    model_ap: 'แกน PINN Aliev-Panfilov',

    // Analysis
    analysis_title: 'ศูนย์วิเคราะห์ 3 มิติ',
    analysis_subtitle: 'ระบุตำแหน่งต้นกำเนิดสัญญาณแบบเรียลไทม์',
    active_patient: 'คนไข้ที่เลือก',
    slice: 'ตัดภาพ',
    grid: 'กริด',
    '3d': '3D',
    system_resonance: 'ความสอดคล้องระบบ',
    success: 'ออนไลน์',
    loading: 'กำลังประมวลผล...',
    capture_snapshot: 'บันทึก Snapshot',
    localization_log: 'บันทึกตำแหน่ง',
    capture_success: 'บันทึก Snapshot สำเร็จ',
    capture_error: 'บันทึก Snapshot ล้มเหลว',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('th');

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'th' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
