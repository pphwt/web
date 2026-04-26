import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Sidebar
    nav_patients: "Patient List",
    nav_monitoring: "Live Monitoring",
    nav_lab: "Neural Lab",
    nav_analysis: "3D Analysis",
    nav_archives: "Neural Archives",
    nav_reports: "Reports",
    nav_terminate: "Terminate Session",
    nav_light_mode: "Light Mode",
    nav_dark_mode: "Dark Mode",
    
    // Patient List
    dir_title: "Neural Directory",
    dir_subtitle: "Patient Identity Management v0.1.0",
    add_patient: "Add Patient",
    new_subject: "New Subject Enrollment",
    full_name: "Full Name",
    age: "Age",
    case_type: "Case Type",
    status_live: "Live Monitor",
    initialize: "Initialize",
    
    // TopBar
    search_placeholder: "Search neural link...",
    in_focus: "In Focus",
    quick_switch: "Quick Switch",
    recent_subjects: "Recent Subjects",
    
    // Analysis
    analysis_title: "Neural Analysis",
    analysis_subtitle: "AI-Powered Source Localization",
    active_patient: "Active Patient",
    system_resonance: "System Resonance",
    capture_snapshot: "Capture Snapshot",
    capture_success: "Diagnostic Snapshot captured successfully",
    capture_error: "Failed to capture snapshot",
    localization_log: "Localization Log",
    slice: "Slice",
    grid: "Grid",
    "3d": "3D",
    
    // Lab & Sandbox
    lab_title: "Neural Lab",
    lab_subtitle: "Clinical Physics Simulation Environment",
    sandbox_title: "Neural Sandbox",
    sandbox_subtitle: "Batch Model Validation & Dataset Testing",
    select_dataset: "Select Dataset",
    run_test: "Run Test",
    test_results: "Test Results",
    mse_error: "MSE Error",
    latency: "Latency",
    
    // AI Diagnostics
    ai_diag_title: "AI Diagnostics Hub",
    ai_diag_subtitle: "Deep Model Performance & Physics Validation",
    physics_residual: "Physics Residual (PDE Loss)",
    reconstruction_accuracy: "Reconstruction Accuracy",
    prediction_vs_ground: "Prediction vs Ground Truth",
    model_integrity: "Model Integrity",
    
    // Common
    loading: "Loading...",
    success: "Success",
    error: "Error",
    save: "Save",
    cancel: "Cancel"
  },
  th: {
    // Sidebar
    nav_patients: "รายชื่อคนไข้",
    nav_monitoring: "มอนิเตอร์สด",
    nav_lab: "แล็บประสาทวิทยา",
    nav_analysis: "วิเคราะห์ 3 มิติ",
    nav_archives: "คลังข้อมูลประสาท",
    nav_reports: "รายงาน",
    nav_terminate: "จบเซสชัน",
    nav_light_mode: "โหมดสว่าง",
    nav_dark_mode: "โหมดมืด",

    // Patient List
    dir_title: "คลังรายชื่อคนไข้",
    dir_subtitle: "ระบบจัดการข้อมูลตัวตนคนไข้ v0.1.0",
    add_patient: "เพิ่มคนไข้",
    new_subject: "ลงทะเบียนคนไข้ใหม่",
    full_name: "ชื่อ-นามสกุล",
    age: "อายุ",
    case_type: "ประเภทเคส",
    status_live: "กำลังติดตาม",
    initialize: "เริ่มระบบ",
    
    // TopBar
    search_placeholder: "ค้นหาโครงข่ายประสาท...",
    in_focus: "กำลังติดตาม",
    quick_switch: "สลับคนไข้ด่วน",
    recent_subjects: "รายชื่อล่าสุด",
    
    // Analysis
    analysis_title: "วิเคราะห์โครงข่ายประสาท",
    analysis_subtitle: "ระบบระบุตำแหน่งแหล่งกำเนิดด้วย AI",
    active_patient: "คนไข้ที่เลือก",
    system_resonance: "ความถี่ระบบ",
    capture_snapshot: "บันทึกข้อมูล",
    capture_success: "บันทึกข้อมูลการวินิจฉัยสำเร็จ",
    capture_error: "บันทึกข้อมูลไม่สำเร็จ",
    localization_log: "บันทึกการระบุตำแหน่ง",
    slice: "ตัดขวาง",
    grid: "ตาราง",
    "3d": "3 มิติ",
    
    // Lab & Sandbox
    lab_title: "Neural Lab",
    lab_subtitle: "Clinical Physics Simulation Environment",
    sandbox_title: "Neural Sandbox",
    sandbox_subtitle: "Batch Model Validation & Dataset Testing",
    select_dataset: "Select Dataset",
    run_test: "Run Test",
    test_results: "Test Results",
    mse_error: "MSE Error",
    latency: "Latency",
    
    // AI Diagnostics
    ai_diag_title: "ศูนย์วินิจฉัยโมเดล AI",
    ai_diag_subtitle: "ตรวจสอบประสิทธิภาพเชิงลึกและความถูกต้องทางฟิสิกส์",
    physics_residual: "ความคลาดเคลื่อนทางฟิสิกส์ (PDE Loss)",
    reconstruction_accuracy: "ความแม่นยำในการสร้างสัญญาณ",
    prediction_vs_ground: "ผลการทำนายเทียบกับค่าจริง",
    model_integrity: "ความสมบูรณ์ของโมเดล",

    // Common
    loading: "กำลังโหลด...",
    success: "สำเร็จ",
    error: "ข้อผิดพลาด",
    save: "บันทึก",
    cancel: "ยกเลิก"
  }
}

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('bio_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('bio_lang', lang);
  }, [lang]);

  const t = (key) => {
    return translations[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
