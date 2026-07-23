// Educational anatomy catalog for the two local heart assets. Coordinates are
// normalized to each asset's fitted bounding box and must be reviewed against
// the rendered model before clinical or teaching publication.

const external = [
  {
    id: 'aorta', number: 1, nameEn: 'Ascending Aorta & Aortic Arch', nameTh: 'เอออร์ตาส่วนขึ้นและส่วนโค้ง', category: 'หลอดเลือดใหญ่',
    location: 'หลอดเลือดแดงใหญ่สีแดงด้านบนของหัวใจ บริเวณทางออกจากห้องล่างซ้าย',
    function: 'รับเลือดจาก left ventricle ผ่าน aortic valve แล้วส่งไปเลี้ยงทั่วร่างกาย',
    flow: 'LV → aortic valve → aorta → systemic circulation',
    anchor: [0.62, 0.90, 0.72], labelOffset: [-0.24, 0.16, 0], cameraDirection: [0.35, 0.18, 1],
  },
  {
    id: 'pulmonary-trunk', number: 2, nameEn: 'Pulmonary Trunk', nameTh: 'ลำต้นหลอดเลือดแดงปอด', category: 'หลอดเลือดใหญ่',
    location: 'หลอดเลือดสีเทา-น้ำเงินที่ออกจาก right ventricle และอยู่ด้านหน้าบริเวณโคน aorta',
    function: 'นำเลือดที่มีออกซิเจนต่ำออกจากหัวใจไปยัง pulmonary arteries และปอด',
    flow: 'RV → pulmonary valve → pulmonary trunk → lungs',
    anchor: [0.45, 0.82, 0.68], labelOffset: [-0.28, 0.08, 0], cameraDirection: [0.38, 0.24, 1],
  },
  {
    id: 'superior-vena-cava', number: 3, nameEn: 'Superior Vena Cava', nameTh: 'หลอดเลือดดำใหญ่ส่วนบน', category: 'หลอดเลือดดำ',
    location: 'หลอดเลือดแนวตั้งเหนือ right atrium ทางด้านบนของหัวใจ',
    function: 'รับเลือดที่มีออกซิเจนต่ำจากศีรษะ คอ แขน และทรวงอกกลับเข้าสู่หัวใจ',
    flow: 'upper body → SVC → right atrium',
    anchor: [0.28, 0.84, 0.74], labelOffset: [-0.32, 0.18, 0], cameraDirection: [0.55, 0.24, 1],
  },
  {
    id: 'right-atrium-external', number: 4, nameEn: 'Right Atrium & Right Auricle', nameTh: 'หัวใจห้องบนขวาและหูหัวใจขวา', category: 'ห้องหัวใจด้านนอก',
    location: 'ขอบด้านขวากายวิภาคของฐานหัวใจ; ถ้า asset แสดงเฉพาะติ่ง ให้เรียก Right Auricle',
    function: 'รับเลือดจาก SVC, IVC และ coronary sinus ก่อนส่งผ่าน tricuspid valve',
    flow: 'SVC/IVC/coronary sinus → right atrium → tricuspid valve',
    anchor: [0.29, 0.61, 0.56], labelOffset: [-0.34, 0.04, 0], cameraDirection: [0.60, 0.05, 1],
  },
  {
    id: 'right-ventricle-external', number: 5, nameEn: 'Right Ventricle', nameTh: 'หัวใจห้องล่างขวา', category: 'ห้องหัวใจด้านนอก',
    location: 'พื้นผิวด้านหน้าส่วนใหญ่ของหัวใจ ใต้ pulmonary trunk',
    function: 'สูบเลือดที่มีออกซิเจนต่ำไปยังปอด',
    flow: 'right atrium → tricuspid valve → RV → pulmonary valve',
    anchor: [0.37, 0.41, 0.37], labelOffset: [-0.36, -0.02, 0], cameraDirection: [0.68, 0.02, 1],
  },
  {
    id: 'left-ventricle-external', number: 6, nameEn: 'Left Ventricle', nameTh: 'หัวใจห้องล่างซ้าย', category: 'ห้องหัวใจด้านนอก',
    location: 'ด้านหลังและด้านซ้ายกายวิภาคของ right ventricle ต่อเนื่องไปยัง apex',
    function: 'สร้างแรงดันหลักเพื่อสูบเลือดที่มีออกซิเจนสูงไปทั่วร่างกาย',
    flow: 'left atrium → mitral valve → LV → aortic valve',
    anchor: [0.63, 0.34, 0.35], labelOffset: [0.30, -0.02, 0], cameraDirection: [-0.62, 0.04, 1],
  },
  {
    id: 'lad', number: 7, nameEn: 'Left Anterior Descending (LAD)', nameTh: 'หลอดเลือดแดงอินเตอร์เวนทริคิวลาร์ด้านหน้า', category: 'หลอดเลือดโคโรนารี',
    location: 'ร่องด้านหน้าระหว่าง right ventricle และ left ventricle วิ่งลงหา apex',
    function: 'นำเลือดไปเลี้ยงผนังด้านหน้าของ left ventricle และส่วนของ septum',
    flow: 'left coronary artery → LAD → myocardium',
    anchor: [0.52, 0.39, 0.27], labelOffset: [0.34, 0.20, 0], cameraDirection: [0.42, 0.18, 1],
  },
  {
    id: 'right-coronary-artery', number: 8, nameEn: 'Right Coronary Artery', nameTh: 'หลอดเลือดแดงโคโรนารีขวา', category: 'หลอดเลือดโคโรนารี',
    location: 'ร่องระหว่าง right atrium และ right ventricle ทางด้านขวากายวิภาค',
    function: 'นำเลือดไปเลี้ยง right heart และบางส่วนของผนังด้านล่าง',
    flow: 'aortic root → RCA → right-heart myocardium',
    anchor: [0.31, 0.48, 0.28], labelOffset: [-0.34, 0.24, 0], cameraDirection: [0.70, 0.10, 1],
  },
  {
    id: 'apex', number: 9, nameEn: 'Cardiac Apex', nameTh: 'ปลายหัวใจ', category: 'จุดอ้างอิงกายวิภาค',
    location: 'ปลายล่างค่อนไปทางซ้ายกายวิภาค สร้างโดย left ventricle เป็นหลัก',
    function: 'เป็น landmark สำคัญของแนวแกนหัวใจ ไม่ใช่ทางผ่านเลือด',
    flow: 'ส่วนปลายของ LV และแนวแกนหัวใจ',
    anchor: [0.62, 0.16, 0.23], labelOffset: [0.30, -0.14, 0], cameraDirection: [-0.58, -0.12, 1],
  },
  {
    id: 'inferior-vena-cava', number: 10, nameEn: 'Inferior Vena Cava', nameTh: 'หลอดเลือดดำใหญ่ส่วนล่าง', category: 'หลอดเลือดดำ',
    location: 'เข้าสู่ right atrium จากด้านล่างและด้านหลังของหัวใจ',
    function: 'รับเลือดที่มีออกซิเจนต่ำจากลำตัวและขากลับเข้าสู่หัวใจ',
    flow: 'lower body → IVC → right atrium',
    anchor: [0.29, 0.25, 0.54], labelOffset: [-0.36, -0.18, 0], cameraDirection: [0.58, -0.30, 1],
  },
  {
    id: 'pulmonary-veins', number: 11, nameEn: 'Pulmonary Veins', nameTh: 'หลอดเลือดดำปอด', category: 'หลอดเลือดดำ',
    location: 'หลอดเลือดหลายเส้นที่เข้าสู่ด้านหลังของ left atrium จากปอด',
    function: 'นำเลือดที่มีออกซิเจนสูงจากปอดกลับเข้าสู่หัวใจ',
    flow: 'lungs → pulmonary veins → left atrium',
    anchor: [0.74, 0.58, 0.66], labelOffset: [0.34, 0.18, 0], cameraDirection: [-0.58, 0.22, -1],
  },
  {
    id: 'left-atrium-external', number: 12, nameEn: 'Left Atrium & Left Auricle', nameTh: 'หัวใจห้องบนซ้ายและหูหัวใจซ้าย', category: 'ห้องหัวใจด้านนอก',
    location: 'left atrium อยู่ด้านหลัง; จากด้านหน้าอาจเห็นเพียง left auricle ใกล้ pulmonary trunk',
    function: 'รับเลือดจาก pulmonary veins แล้วส่งต่อไปยัง left ventricle ผ่าน mitral valve',
    flow: 'pulmonary veins → left atrium → mitral valve',
    anchor: [0.72, 0.66, 0.61], labelOffset: [0.34, 0.04, 0], cameraDirection: [-0.62, 0.12, -1],
  },
];

const internal = [
  {
    id: 'right-atrium', number: 1, nameEn: 'Right Atrium', nameTh: 'หัวใจห้องบนขวา', category: 'ห้องหัวใจ',
    location: 'ช่องบนขวากายวิภาค ใกล้ทางเข้า SVC และ IVC',
    function: 'รับเลือดจากร่างกายและส่งผ่าน tricuspid valve ลงสู่ right ventricle',
    flow: 'SVC/IVC/coronary sinus → right atrium → tricuspid valve',
    anchor: [0.31, 0.65, 0.60], labelOffset: [-0.34, 0.18, 0], cameraDirection: [0.65, 0.20, 1],
  },
  {
    id: 'tricuspid-valve', number: 2, nameEn: 'Tricuspid Valve', nameTh: 'ลิ้นไตรคัสปิด', category: 'ลิ้นหัวใจ AV',
    location: 'ช่องต่อระหว่าง right atrium และ right ventricle',
    function: 'เปิดให้เลือดไหลลง RV และป้องกันเลือดไหลย้อนกลับเข้า RA',
    flow: 'right atrium → tricuspid valve → right ventricle',
    anchor: [0.39, 0.53, 0.50], labelOffset: [-0.36, 0.04, 0], cameraDirection: [0.70, 0.04, 1],
  },
  {
    id: 'right-ventricle', number: 3, nameEn: 'Right Ventricle', nameTh: 'หัวใจห้องล่างขวา', category: 'ห้องหัวใจ',
    location: 'ช่องล่างด้านหน้า ผนังบางกว่า left ventricle',
    function: 'สูบเลือดที่มีออกซิเจนต่ำไปยัง pulmonary trunk และปอด',
    flow: 'tricuspid valve → RV → pulmonary valve',
    anchor: [0.36, 0.38, 0.40], labelOffset: [-0.36, -0.04, 0], cameraDirection: [0.72, 0.02, 1],
  },
  {
    id: 'pulmonary-valve', number: 4, nameEn: 'Pulmonary Valve', nameTh: 'ลิ้นพัลโมนารี', category: 'ลิ้นหัวใจ semilunar',
    location: 'ปลายทางออกของ RV ก่อนเข้าสู่ pulmonary trunk',
    function: 'เปิดให้เลือดออกจาก RV และป้องกันเลือดจาก pulmonary trunk ไหลย้อนกลับ',
    flow: 'RV → pulmonary valve → pulmonary trunk',
    anchor: [0.45, 0.68, 0.62], labelOffset: [-0.34, 0.18, 0], cameraDirection: [0.68, 0.25, 1],
  },
  {
    id: 'left-atrium', number: 5, nameEn: 'Left Atrium', nameTh: 'หัวใจห้องบนซ้าย', category: 'ห้องหัวใจ',
    location: 'ช่องบนด้านหลัง เหนือ mitral valve',
    function: 'รับเลือดที่มีออกซิเจนสูงจาก pulmonary veins แล้วส่งต่อไป LV',
    flow: 'pulmonary veins → left atrium → mitral valve',
    anchor: [0.67, 0.66, 0.66], labelOffset: [0.34, 0.18, 0], cameraDirection: [-0.62, 0.22, -1],
  },
  {
    id: 'mitral-valve', number: 6, nameEn: 'Mitral Valve', nameTh: 'ลิ้นไมตรัล', category: 'ลิ้นหัวใจ AV',
    location: 'ช่องต่อระหว่าง left atrium และ left ventricle; มีสอง leaflets',
    function: 'เปิดให้เลือดลง LV และป้องกันเลือดไหลย้อนกลับเข้า LA',
    flow: 'left atrium → mitral valve → left ventricle',
    anchor: [0.61, 0.52, 0.49], labelOffset: [0.34, 0.04, 0], cameraDirection: [-0.68, 0.02, 1],
  },
  {
    id: 'left-ventricle', number: 7, nameEn: 'Left Ventricle', nameTh: 'หัวใจห้องล่างซ้าย', category: 'ห้องหัวใจ',
    location: 'ช่องล่างผนังหนา อยู่ด้านหลังและค่อนไปทางซ้ายของ RV',
    function: 'สร้างแรงดันสูงเพื่อสูบเลือดที่มีออกซิเจนสูงเข้าสู่ aorta',
    flow: 'mitral valve → LV → aortic valve',
    anchor: [0.64, 0.37, 0.36], labelOffset: [0.36, -0.04, 0], cameraDirection: [-0.68, -0.02, 1],
  },
  {
    id: 'aortic-valve', number: 8, nameEn: 'Aortic Valve', nameTh: 'ลิ้นเอออร์ตา', category: 'ลิ้นหัวใจ semilunar',
    location: 'ทางออกของ LV ที่โคน aorta อยู่ค่อนไปกลางและหลัง pulmonary valve',
    function: 'เปิดให้เลือดออกสู่ aorta และป้องกันเลือดจาก aorta ไหลย้อนกลับเข้า LV',
    flow: 'LV → aortic valve → aorta',
    anchor: [0.57, 0.69, 0.66], labelOffset: [0.34, 0.18, 0], cameraDirection: [-0.54, 0.28, 1],
  },
  {
    id: 'interventricular-septum', number: 9, nameEn: 'Interventricular Septum', nameTh: 'ผนังกั้นหัวใจห้องล่าง', category: 'ผนังกั้นหัวใจ',
    location: 'ผนังกล้ามเนื้อตรงกลางระหว่าง RV และ LV',
    function: 'แยกเลือดสองฝั่งและเป็นส่วนหนึ่งของแนวระบบนำไฟฟ้าหัวใจ',
    flow: 'ไม่ใช่ทางผ่านเลือด; เป็นผนังแบ่ง RV และ LV',
    anchor: [0.50, 0.43, 0.44], labelOffset: [0.30, 0.28, 0], cameraDirection: [0.20, 0.25, 1],
  },
  {
    id: 'chordae-tendineae', number: 10, nameEn: 'Chordae Tendineae', nameTh: 'เอ็นยึดลิ้นหัวใจ', category: 'โครงสร้างพยุงลิ้นหัวใจ',
    location: 'เส้นเอ็นจาก tricuspid/mitral leaflets ไปยัง papillary muscles',
    function: 'ช่วยป้องกัน AV valve พลิกย้อนขณะ ventricle บีบตัว',
    flow: 'ไม่มีทางผ่านเลือดโดยตรง; ควบคุมการปิดของ AV valves',
    anchor: [0.55, 0.44, 0.42], labelOffset: [0.34, 0.10, 0], cameraDirection: [0.32, 0.12, 1],
  },
  {
    id: 'papillary-muscles', number: 11, nameEn: 'Papillary Muscles', nameTh: 'กล้ามเนื้อแพพิลารี', category: 'กล้ามเนื้อพยุงลิ้นหัวใจ',
    location: 'ปุ่มกล้ามเนื้อที่ยื่นจากผนัง ventricles และต่อกับ chordae',
    function: 'ดึง chordae เพื่อช่วยคุมการปิดของ tricuspid และ mitral valves',
    flow: 'ไม่มีทางผ่านเลือดโดยตรง; ทำงานสัมพันธ์กับ ventricular systole',
    anchor: [0.60, 0.38, 0.35], labelOffset: [0.38, -0.18, 0], cameraDirection: [-0.18, -0.06, 1],
  },
  {
    id: 'trabeculae-carneae', number: 12, nameEn: 'Trabeculae Carneae', nameTh: 'สันกล้ามเนื้อในโพรงหัวใจ', category: 'กล้ามเนื้อหัวใจ',
    location: 'สันกล้ามเนื้อขรุขระบนผนังด้านในของ ventricles',
    function: 'เป็นส่วนของ ventricular myocardium ไม่ใช่ลิ้นหรือทางผ่านเลือด',
    flow: 'อยู่ภายในผนังโพรงหัวใจและช่วยการบีบตัวของ ventricle',
    anchor: [0.68, 0.29, 0.34], labelOffset: [0.36, -0.28, 0], cameraDirection: [-0.48, -0.18, 1],
  },
];

export const HEART_ANATOMY_CATALOG = { external, internal };

export function partsForVariant(variant) {
  return variant === 'open' ? internal : external;
}
