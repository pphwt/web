import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Nav
    nav_monitoring: 'Live ECG Triage',
    nav_diagnostics: 'AI Decision Support',
    nav_archives: 'ECG Archives',
    nav_patients: 'Triage Patient Registry',
    nav_lab: 'Cardiac Physics Lab',
    nav_reports: 'Referral Reports',
    nav_help: 'Primary Care Manual',
    nav_terminate: 'End Session',
    nav_light_mode: 'Light',
    nav_dark_mode: 'Dark',
    sandbox_title: 'PINN Triage Sandbox',
    ai_diag_title: 'AI Decision Support View',
    nav_analysis: '3D Referral Triage',
    in_focus: 'Current Patient',
    search_placeholder: 'Search by name or ID...',

    // Quick Actions
    action_live: 'Live ECG Triage',
    action_analysis: '3D ECG Triage',
    action_report: 'Referral Report',

    // Sustainable Innovation
    sust_title: 'Primary Care Screening Impact',
    sust_desc: 'Decision-support triage helps primary-care units identify cases that may need referral before symptoms worsen. Any reduction in unnecessary travel or invasive procedures is a future impact, not the system claim.',
    catheters_saved: 'Potential Procedures Avoided',
    waste_saved: 'Clinical Waste Reduced',
    cost_saved: 'Patient Cost Reduced',
    rural_referrals: 'Primary-Care Scans Processed',

    // Help Center / Manual
    manual_title: 'Primary Care Triage Workflow',
    manual_subtitle: 'Guidelines for screening, risk review, 3D explanation, and referral support',
    man_mod1_title: 'ECG Capture & Intake',
    man_mod1_desc: 'For health officers, nurses, and general physicians in primary-care units.',
    man_instr1_title: 'Electrode Placement',
    man_instr1_body: 'Ensure leads V1-V6 are positioned according to standard precordial placement before using the result as referral-support information.',
    man_instr1_list: '• V1-V2: 4th intercostal space • V4-V6: 5th intercostal space',
    man_instr2_title: 'Primary-Care Use',
    man_instr2_body: 'Capture or import ECG, review AI risk and 3D source localization, then use the information with clinical judgment to decide whether to refer.',
    man_instr2_standard: 'Role: screening and referral support, not final diagnosis',
    man_mod2_title: 'Screening Signal Review',
    man_mod2_desc: 'Reference ranges used to support preliminary ECG review.',
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
    man_sandbox_logic_title: 'Physics-Informed AI',
    man_sandbox_logic_body: 'Aliev-Panfilov constraints help explain why the model estimates a source location instead of only classifying a rhythm.',
    man_sandbox_map_title: '3D Source Localization',
    man_sandbox_map_body: 'Real-time visual explanation shows where an abnormal electrical source may be located for clinician review.',
    man_mod3_title: 'Referral Support Output',
    man_mod3_desc: 'The system summarizes risk, confidence, ECG waveform, and 3D location for a referral report.',
    man_param_a_title: 'Excitation (a)',
    man_param_a_desc: 'Threshold of cellular depolarization used in the biophysical model.',
    man_param_k_title: 'Scaling (k)',
    man_param_k_desc: 'Potential magnitude of the action wave.',
    man_param_d_title: 'Diffusion (D)',
    man_param_d_desc: 'Speed of signal propagation across nodes.',
    man_lab_tip: 'Clinical note: all outputs are prototype decision support and require clinician confirmation.',
    ref_title: 'Clinical References',
    ref_physionet: 'MIT-BIH Arrhythmia Standard',
    ref_pinn_paper: 'Aliev-Panfilov Model Core',
    ref_disclaimer: 'Disclaimer: This AI provides screening and referral-support information only. It does not make the final diagnosis or replace a physician.',

    // Patient List
    patient_db_title: 'Triage Patient Registry',
    patient_db_subtitle: 'Patient records for ECG screening, monitoring, and referral support',
    register_patient: 'Register New Patient',
    modal_title: 'Patient Registration',
    modal_subtitle: 'Record patient data for screening and referral-support workflow',
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
    sandbox_subtitle: 'Physics-informed ECG screening simulation',
    select_dataset: 'Select ECG Record',
    run_test: 'Run Triage Analysis',

    // AI Diagnostics
    ai_diag_subtitle: 'Model limits and decision-support evidence for referral screening',
    dataset_ref: 'Dataset Reference',
    dataset_mit: 'MIT-BIH Arrhythmia Database',
    model_ref: 'Model Reference',
    model_ap: 'Aliev-Panfilov PINN Core',

    // Analysis
    analysis_title: '3D Referral Triage Center',
    analysis_subtitle: 'Preliminary ECG screening with physics-informed 3D explanation',
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
    nav_monitoring: 'คัดกรอง ECG แบบสด',
    nav_diagnostics: 'ศูนย์ช่วยตัดสินใจ AI',
    nav_archives: 'คลัง ECG',
    nav_patients: 'ทะเบียนผู้ป่วยคัดกรอง',
    nav_lab: 'ห้องแล็บฟิสิกส์หัวใจ',
    nav_reports: 'รายงานประกอบการส่งต่อ',
    nav_help: 'คู่มือหน่วยบริการปฐมภูมิ',
    nav_terminate: 'ออกจากระบบ',
    nav_light_mode: 'โหมดสว่าง',
    nav_dark_mode: 'โหมดมืด',
    sandbox_title: 'PINN Sandbox เพื่อคัดกรอง',
    ai_diag_title: 'มุมมองช่วยตัดสินใจด้วย AI',
    nav_analysis: 'คัดกรองและส่งต่อ 3D',
    in_focus: 'ผู้ป่วยปัจจุบัน',
    search_placeholder: 'ค้นหาด้วยชื่อหรือเลขบัตร...',

    // Quick Actions
    action_live: 'คัดกรอง ECG สด',
    action_analysis: 'คัดกรอง ECG 3D',
    action_report: 'รายงานส่งต่อ',

    // Sustainable Innovation
    sust_title: 'ผลลัพธ์ต่อการคัดกรองในหน่วยปฐมภูมิ',
    sust_desc: 'ระบบช่วยคัดกรองเบื้องต้นให้ รพ.สต. คลินิก และพื้นที่ขาดแคลนเครื่องมือหัวใจเห็นเคสที่ควรส่งต่อเร็วขึ้น ส่วนการลดการเดินทางหรือหัตถการที่ไม่จำเป็นเป็นผลกระทบในอนาคต ไม่ใช่ข้ออ้างหลักของระบบ',
    catheters_saved: 'หัตถการที่อาจลดได้',
    waste_saved: 'ขยะทางการแพทย์ที่อาจลดลง',
    cost_saved: 'ค่าใช้จ่ายผู้ป่วยที่อาจลดลง',
    rural_referrals: 'เคสปฐมภูมิที่ประมวลผล',

    // Help Center / Manual
    manual_title: 'ขั้นตอนคัดกรองในหน่วยบริการปฐมภูมิ',
    manual_subtitle: 'แนวทางวัด/นำเข้า ECG ประเมินความเสี่ยง ดูตำแหน่ง 3D และใช้ประกอบการส่งต่อ',
    man_mod1_title: 'การรับข้อมูล ECG',
    man_mod1_desc: 'สำหรับเจ้าหน้าที่ พยาบาล และแพทย์ทั่วไปใน รพ.สต. คลินิก และโรงพยาบาลที่ขาดแคลนเครื่องมือหัวใจ',
    man_instr1_title: 'การวางตำแหน่งขั้วไฟฟ้า',
    man_instr1_body: 'ตรวจสอบการวาง Lead V1-V6 ให้ตรงตามมาตรฐานก่อนใช้ผลเป็นข้อมูลประกอบการคัดกรองและส่งต่อ',
    man_instr1_list: '• V1-V2: ช่องซี่โครงที่ 4 • V4-V6: ช่องซี่โครงที่ 5',
    man_instr2_title: 'การใช้งานเพื่อส่งต่อ',
    man_instr2_body: 'วัดหรือนำเข้า ECG จากนั้นดูระดับความเสี่ยง ตำแหน่ง 3D และข้อมูลประกอบอื่น ๆ เพื่อให้บุคลากรทางการแพทย์ตัดสินใจส่งต่อได้เร็วขึ้น',
    man_instr2_standard: 'บทบาทของระบบ: คัดกรองและสนับสนุนการส่งต่อ ไม่ใช่คำวินิจฉัยสุดท้าย',
    man_mod2_title: 'การอ่านสัญญาณเพื่อคัดกรอง',
    man_mod2_desc: 'ช่วงอ้างอิงที่ใช้ช่วยประเมินแนวโน้มเบื้องต้นของคลื่นไฟฟ้าหัวใจ',
    man_vital_title: 'ช่วงอ้างอิงทางคลินิก',
    man_vital_pr: 'ช่วง PR',
    man_vital_pr_desc: 'เวลาการนำไฟฟ้าจากห้องบนสู่ห้องล่าง',
    man_vital_qrs: 'ช่วง QRS',
    man_vital_qrs_desc: 'เวลาที่หัวใจห้องล่างบีบตัว',
    man_vital_qtc: 'ช่วง QTc',
    man_vital_qtc_desc: 'เวลาการฟื้นตัวของหัวใจห้องล่างที่ปรับตาม HR',
    man_vital_hr: 'อัตราการเต้นหัวใจ',
    man_vital_hr_desc: 'จำนวนครั้งต่อนาที',
    man_vital_axis: 'แกนไฟฟ้าหัวใจ',
    man_vital_axis_desc: 'ทิศทางหลักของการนำไฟฟ้าในหัวใจ',
    man_sandbox_logic_title: 'AI ที่อิงหลักฟิสิกส์',
    man_sandbox_logic_body: 'ใช้ข้อจำกัดจากโมเดล Aliev-Panfilov เพื่อช่วยอธิบายว่าทำไมระบบจึงประเมินตำแหน่งแหล่งกำเนิดสัญญาณ ไม่ใช่แค่แจ้ง rhythm หรือ alert',
    man_sandbox_map_title: 'การระบุตำแหน่ง 3D',
    man_sandbox_map_body: 'แสดงตำแหน่งที่อาจผิดปกติของหัวใจแบบสามมิติเพื่อให้แพทย์หรือบุคลากรใช้ประกอบการทบทวนเคส',
    man_mod3_title: 'ผลลัพธ์เพื่อประกอบการส่งต่อ',
    man_mod3_desc: 'ระบบสรุประดับความเสี่ยง ความมั่นใจ คลื่น ECG และตำแหน่ง 3D เพื่อจัดทำรายงานส่งต่อ',
    man_param_a_title: 'การกระตุ้น (Excitation - a)',
    man_param_a_desc: 'ระดับแรงดันเริ่มต้นในการเปลี่ยนประจุเซลล์',
    man_param_k_title: 'การขยายสัญญาณ (Scaling - k)',
    man_param_k_desc: 'ขนาดความแรงของคลื่นไฟฟ้าหัวใจ',
    man_param_d_title: 'การแพร่กระจาย (Diffusion - D)',
    man_param_d_desc: 'ความเร็วในการส่งสัญญาณข้ามโหนดต่าง ๆ',
    man_lab_tip: 'หมายเหตุทางคลินิก: ผลลัพธ์ทั้งหมดเป็น prototype decision support และต้องยืนยันโดยแพทย์',
    ref_title: 'แหล่งอ้างอิงทางคลินิก',
    ref_physionet: 'มาตรฐานฐานข้อมูล MIT-BIH Arrhythmia',
    ref_pinn_paper: 'แกนโมเดล Aliev-Panfilov',
    ref_disclaimer: 'คำเตือน: ระบบ AI นี้ใช้เพื่อช่วยคัดกรองและสนับสนุนการส่งต่อเท่านั้น ไม่ใช่คำวินิจฉัยสุดท้ายและไม่ใช้แทนแพทย์',

    // Patient List
    patient_db_title: 'ทะเบียนผู้ป่วยคัดกรอง',
    patient_db_subtitle: 'จัดการข้อมูลผู้ป่วยสำหรับการคัดกรอง ECG ติดตามสัญญาณ และส่งต่อ',
    register_patient: 'ลงทะเบียนผู้ป่วยใหม่',
    modal_title: 'ลงทะเบียนผู้ป่วย',
    modal_subtitle: 'บันทึกข้อมูลสำหรับ workflow คัดกรองและส่งต่อ',
    tab_demographics: 'ข้อมูลทั่วไป',
    tab_clinical: 'ข้อมูลทางคลินิก',
    label_fullname: 'ชื่อ-นามสกุล',
    label_idcard: 'เลขบัตรประชาชน / Passport',
    label_dob: 'วันเกิด',
    label_gender: 'เพศ',
    label_blood: 'หมู่เลือด',
    label_priority: 'ระดับความสำคัญ',
    label_allergies: 'ประวัติแพ้ยาและข้อควรระวัง',
    label_emergency: 'ผู้ติดต่อฉุกเฉิน (ชื่อ/เบอร์โทร)',
    btn_cancel: 'ยกเลิก',
    btn_next: 'ขั้นตอนถัดไป',
    btn_complete: 'ลงทะเบียนสำเร็จ',
    status_active: 'กำลังติดตาม',
    patient_count: 'ราย',
    patient_count_filtered: 'กรองจาก',
    no_patient_found: 'ไม่พบผู้ป่วยที่ตรงกัน',
    no_patient_data: 'ยังไม่มีข้อมูลผู้ป่วย',

    // Live Monitoring
    start_capture: 'บันทึก',

    // Layout
    language: 'ภาษา',
    quick_switch: 'สลับผู้ป่วย',
    recent_subjects: 'รายการล่าสุด',

    // Neural Sandbox
    sandbox_subtitle: 'จำลองการคัดกรอง ECG ด้วย AI ที่อิงหลักฟิสิกส์',
    select_dataset: 'เลือกข้อมูล ECG',
    run_test: 'ประเมินเพื่อคัดกรอง',

    // AI Diagnostics
    ai_diag_subtitle: 'หลักฐานและข้อจำกัดของโมเดลสำหรับช่วยคัดกรองและส่งต่อ',
    dataset_ref: 'แหล่งข้อมูลอ้างอิง',
    dataset_mit: 'ฐานข้อมูล MIT-BIH Arrhythmia',
    model_ref: 'อ้างอิงโมเดล',
    model_ap: 'แกน PINN Aliev-Panfilov',

    // Analysis
    analysis_title: 'ศูนย์คัดกรองและส่งต่อ 3D',
    analysis_subtitle: 'ประเมิน ECG เบื้องต้นพร้อมคำอธิบายตำแหน่ง 3D ที่อิงหลักฟิสิกส์',
    active_patient: 'ผู้ป่วยที่เลือก',
    slice: 'ตัดภาพ',
    grid: 'กริด',
    '3d': '3D',
    system_resonance: 'ความสอดคล้องของระบบ',
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

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || translations.en[key] || key;
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
