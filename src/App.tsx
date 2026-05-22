import React, { useState, useEffect } from "react";
import {
  Leaf,
  ShoppingBag,
  Utensils,
  Sparkles,
  RefreshCw,
  Trophy,
  Activity,
  CheckCircle2,
  Trash2,
  Plus,
  Compass,
  Zap,
  Coffee,
  Soup,
  PlusCircle,
  Clock,
  User,
  AlertCircle,
  Check,
  ShieldCheck,
  Smile,
  ChevronRight,
  Sparkle
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  thaiName: string;
  price: number;
  baseCarbon: number;
  category: "food" | "drink";
}

interface Shop {
  id: string;
  name: string;
  thaiName: string;
  description: string;
  isPartner: boolean;
  image: string;
  rating: number;
  category: string;
  menu: MenuItem[];
}

interface Order {
  id: string;
  studentId: string;
  studentName: string;
  shopId: string;
  shopName: string;
  menuId: string;
  menuName: string;
  thaiMenuName: string;
  price: number;
  ricePortion: "ข้าวน้อย" | "ปกติ" | "ข้าวมาก";
  noVeggies: boolean;
  noStraw: boolean;
  ownCup: boolean;
  noPlasticUtensil: boolean;
  ownContainer: boolean;
  carbonFootprint: number;
  timestamp: string;
  noodleType?: string;
  noodleSoup?: string;
  noodleDryOrSoup?: string;
}

interface SustainabilityStats {
  foodWasteSavedKg: number;
  savedCO2eKg: number;
  plasticsAvoidedCount: number;
  noStrawCount: number;
  ownCupCount: number;
  noCutleryCount: number;
  noVeggiesCount: number;
  ownContainerCount: number;
}

interface PortionStats {
  xs: number;
  normal: number;
  xl: number;
}

interface OrderSummaryResponse {
  success: boolean;
  totalCount: number;
  portions: PortionStats;
  sustainability: SustainabilityStats;
  orders: Order[];
}

interface StudentAIAward {
  badge: string;
  headline: string;
  insight: string;
  actionPlans: string[];
  fact: string;
}

interface CookAIAward {
  wasteAudit: string;
  ecoRecipeSuggestion: string;
  forecastPrediction: string;
  fact: string;
}

export default function App() {
  // Navigation & View roles
  const [activeRole, setActiveRole] = useState<"student" | "cook">("student");
  const [studentMobileMock, setStudentMobileMock] = useState<boolean>(false);
  
  // Data State
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<SustainabilityStats | null>(null);
  const [portions, setPortions] = useState<PortionStats | null>(null);
  const [totalOrders, setTotalOrders] = useState<number>(420);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Student Order Form State
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [customMenuName, setCustomMenuName] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  const [studentClass, setStudentClass] = useState<string>("");
  const [ricePortion, setRicePortion] = useState<"ข้าวน้อย" | "ปกติ" | "ข้าวมาก">("ปกติ");
  const [noVeggies, setNoVeggies] = useState<boolean>(false);
  const [noStraw, setNoStraw] = useState<boolean>(true);
  const [ownCup, setOwnCup] = useState<boolean>(false);
  const [noPlasticUtensil, setNoPlasticUtensil] = useState<boolean>(false);
  const [ownContainer, setOwnContainer] = useState<boolean>(false);
  const [noodleType, setNoodleType] = useState<string>("เส้นเล็ก");
  const [noodleSoup, setNoodleSoup] = useState<string>("น้ำใส");
  const [noodleDryOrSoup, setNoodleDryOrSoup] = useState<string>("น้ำ");

  // AI Advice States
  const [studentAITip, setStudentAITip] = useState<StudentAIAward | null>(null);
  const [cookAITip, setCookAITip] = useState<CookAIAward | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [customQuery, setCustomQuery] = useState<string>("");

  // Toast notifications state
  const [toastMessage, setToastMessage] = useState<{title: string, desc: string, type: "success" | "info" | "eco"} | null>(null);


  // Initial Data Load
  const fetchData = async () => {
    try {
      setLoading(true);
      const shopsRes = await fetch("/api/shops");
      const shopsData = await shopsRes.json();
      if (shopsData.success) {
        setShops(shopsData.data);
        if (shopsData.data.length > 0) {
          setSelectedShop(shopsData.data[0]);
          setSelectedItem(shopsData.data[0].menu[0]);
        }
      }

      const ordersRes = await fetch("/api/orders");
      const ordersData: OrderSummaryResponse = await ordersRes.json();
      if (ordersData.success) {
        setOrders(ordersData.orders);
        setStats(ordersData.sustainability);
        setPortions(ordersData.portions);
        setTotalOrders(ordersData.totalCount);
      }
    } catch (err) {
      console.error("Error fetching initial state data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Show customized toast
  const triggerToast = (title: string, desc: string, type: "success" | "info" | "eco" = "success") => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Select shop logic
  const handleShopSelect = (shop: Shop) => {
    setSelectedShop(shop);
    setSelectedItem(shop.menu[0] || null);
    // Reset defaults based on food vs drink
    if (shop.menu[0]?.category === "drink") {
      setRicePortion("ปกติ");
      setNoVeggies(false);
      setOwnCup(true);
    } else {
      setOwnCup(false);
    }
  };

  // Calculated Carbon Footprint preview for current student selection
  const getCurrentCarbonEstimate = () => {
    if (!selectedItem) return 0;
    let carbon = selectedItem.baseCarbon;
    if (ricePortion === "ข้าวน้อย") carbon *= 0.85;
    if (ricePortion === "ข้าวมาก") carbon *= 1.15;
    if (noStraw) carbon -= 0.02;
    if (ownCup) carbon -= 0.10;
    if (noPlasticUtensil) carbon -= 0.04;
    if (ownContainer) carbon -= 0.15;
    return Math.max(0.04, Math.round(carbon * 100) / 100);
  };

  // Carbon savings comparison
  const getCurrentSavingsEstimate = () => {
    if (!selectedItem) return 0;
    const base = selectedItem.baseCarbon;
    const est = getCurrentCarbonEstimate();
    return Math.max(0, Math.round((base - est) * 100) / 100);
  };

  // Place Pre-Order Handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop || !selectedItem) {
      triggerToast("เกิดข้อผิดพลาด", "กรุณาเลือกร้านอาหารและเมนูที่ถูกต้อง", "info");
      return;
    }

    try {
      const payload = {
        studentName: `${studentName || "นักเรียนกตัญญูสิ่งแวดล้อม"} (${studentClass})`,
        shopId: selectedShop.id,
        menuId: selectedItem.id,
        ricePortion,
        noVeggies,
        noStraw,
        ownCup,
        noPlasticUtensil,
        ownContainer,
        noodleType: selectedShop.id === "shop-2" ? noodleType : undefined,
        noodleSoup: selectedShop.id === "shop-2" ? noodleSoup : undefined,
        noodleDryOrSoup: selectedShop.id === "shop-2" ? noodleDryOrSoup : undefined,
        customMenuName: selectedItem.id.endsWith("-other") ? customMenuName : undefined
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        const orderCarbonSaved = getCurrentSavingsEstimate();
        const msg = ricePortion === "ข้าวน้อย" 
          ? `ลดขนาดข้าวสุก + ประหยัดคาร์บอนรวมกู้โลกได้เพิ่มเติม ${orderCarbonSaved} kg CO2e!` 
          : `เซฟโลกด้วยพลาสติกและบรรจุภัณฑ์ ลดคาร์บอนยั่งยืน ${orderCarbonSaved} kg CO2e`;
        
        triggerToast("สั่งอาหารสำเร็จ! 🎉", msg, "eco");
        
        // Refresh orders & statistics on canteen dashboard in real-time
        const ordersRes = await fetch("/api/orders");
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setOrders(ordersData.orders);
          setStats(ordersData.sustainability);
          setPortions(ordersData.portions);
          setTotalOrders(ordersData.totalCount);
        }
        
        // Clear personal name/ID options if placed
        setStudentName("");
        setStudentClass("");
        setCustomMenuName("");
      } else {
        triggerToast("เกิดข้อผิดพลาด", data.error || "ไม่สามารถส่งคำสั่งซื้อล่วงหน้าได้", "info");
      }
    } catch (err) {
      console.error("Error submitting order", err);
      triggerToast("เกิดข้อผิดพลาดในการเชื่อมต่อ", "กรุณาลองใหม่อีกครั้ง", "info");
    }
  };

  // Reset entire orders list to clean base
  const handleResetDatabase = async () => {
    if (!confirm("ต้องการรีเซ็ตสถิติและการสั่งซื้อย้อนหลังทั้งหมดสู่ค่าตั้งต้นจำลอง (420 ออเดอร์ของวันนี้) ใช่หรือไม่?")) return;
    try {
      setLoading(true);
      const res = await fetch("/api/orders/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        triggerToast("รีเซ็ตระบบเรียบร้อย", "ทำความสะอาดข้อมูลสั่งอาหารวันนี้กลับสู่ระบบ Seed เรียบร้อย", "info");
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Sustainable AI Tip from Gemini API
  const handleFetchAIEcoAdvice = async (roleType: "student" | "cook", presetMessage?: string) => {
    try {
      setAiLoading(true);
      const finalContext = presetMessage || customQuery || "";
      const res = await fetch("/api/gemini/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          view: roleType,
          extraContext: finalContext
        })
      });
      const data = await res.json();
      if (data.success) {
        if (roleType === "student") {
          setStudentAITip(data.data);
          triggerToast("วิเคราะห์สำเร็จ ✨", "AI Generative มั่นใจร่วมสร้างพฤติกรรม NetZero เดย์คอนเซปต์", "success");
        } else {
          setCookAITip(data.data);
          triggerToast("วิเคราะห์เมนูรักษ์โลกอัจฉริยะ ✨", "แม่ครัวพร้อมเสิร์ฟคาร์บอนต่ำ ปรับตารางหม้อแกงรอบวันพรุ่งนี้สำเร็จ", "success");
        }
        setCustomQuery("");
      } else {
        triggerToast("ไม่สามารถประมวลผล", "ระบบขัดข้องกรุณาลองใหม่อีกครั้ง", "info");
      }
    } catch (err) {
      console.error(err);
      triggerToast("เกิดข้อผิดพลาดภายนอก", "Gemini API จำลองตอบด้วยข้อเสนออัจฉริยะในท้องถิ่น", "info");
    } finally {
      setAiLoading(false);
    }
  };

  // Trigger default AI advice on load for student & cook once
  useEffect(() => {
    if (shops.length > 0) {
      handleFetchAIEcoAdvice("student", "ยินดีต้อนรับนักเรียนเริ่มต้นวันใหม่");
      handleFetchAIEcoAdvice("cook", "เริ่มโครงการประหยัดเศษอาหารระดับมัธยม");
    }
  }, [shops.length]);


  return (
    <div className="min-h-screen bg-emerald-50 text-slate-800 flex flex-col font-sans transition-colors duration-200">
      
      {/* Dynamic Floating Toast Notification */}
      {toastMessage && (
        <div id="status-toast" className="fixed top-6 right-6 z-50 animate-bounce cursor-pointer max-w-sm" onClick={() => setToastMessage(null)}>
          <div className={`p-4 rounded-2xl shadow-2xl flex items-start gap-3 border ${
            toastMessage.type === "eco" 
              ? "bg-emerald-900 border-emerald-400 text-white" 
              : toastMessage.type === "info"
              ? "bg-amber-500 border-amber-300 text-slate-950"
              : "bg-slate-900 border-slate-700 text-white"
          }`}>
            <div className="p-1.5 bg-current text-emerald-500 rounded-lg">
              <Leaf size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-black text-sm">{toastMessage.title}</h4>
              <p className="text-xs opacity-90 mt-0.5">{toastMessage.desc}</p>
              <span className="text-[10px] opacity-60 block mt-1">คลิกเพื่อปิดข้อความ</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Navigation bar (Vibrant Palette Theme Styling) */}
      <nav id="top-nav" className="min-h-20 bg-white border-b-4 border-emerald-500/20 px-4 md:px-8 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 shadow-sm sticky top-0 z-40 py-3 md:py-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">SchoolNetZero</span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 font-bold rounded-full">by PS Platform</span>
            </div>
            <p className="text-[10px] font-black tracking-widest text-emerald-600 uppercase hidden sm:block">
              Smart Pre-Order & Carbon Minimizer Canteen
            </p>
          </div>
        </div>

        {/* Global Statistics Highlights */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end border-r pr-4 border-slate-200">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              นักเรียนสั่งอาหารวันนี้
            </span>
            <span className="text-base font-black text-emerald-600">
              {totalOrders} / 3000 ออเดอร์ ({Math.round((totalOrders / 3000) * 100)}%)
            </span>
          </div>

          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              ประหยัดคาร์บอนสะสมวันนี้
            </span>
            <span className="text-base font-black text-sky-600">
              ⚡ {stats ? stats.savedCO2eKg.toFixed(1) : "12.5"} kg CO2e
            </span>
          </div>

          <div className="flex gap-2">
            <button
              id="role-switch-student"
              onClick={() => setActiveRole("student")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeRole === "student"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-100"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              <User size={13} /> นักเรียน
            </button>
            <button
              id="role-switch-cook"
              onClick={() => setActiveRole("cook")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeRole === "cook"
                  ? "bg-teal-700 text-white shadow-md"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              <Utensils size={13} /> ห้องครัว/แม่ครัว
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container Layout */}
      <main className="flex-1 p-3 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto grid grid-cols-12 gap-4 lg:gap-8">
        
        {/* Left Side: Student Pre-Order Perspective */}
        <section id="student-perspective" className={`col-span-12 ${activeRole === "student" ? "lg:col-span-5" : "hidden lg:flex lg:col-span-4 lg:opacity-75"} flex flex-col gap-4 md:gap-6`}>
          <div className="bg-white rounded-[32px] md:rounded-[40px] p-4 md:p-8 shadow-xl border-4 border-emerald-500/10 flex-1 relative flex flex-col">
            
            {/* Corner Interface badge */}
            <div className="absolute -top-3.5 left-6 md:left-8 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
              <ShoppingBag size={12} />
              <span>สั่งอาหารล่วงหน้ารักษ์โลก (Student Link)</span>
            </div>

            <div className="mb-5 mt-2 flex justify-between items-start">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">พรีออเดอร์มื้อกลางวัน</h2>
                <p className="text-slate-500 text-xs md:text-sm">คำนวณและลดมลพิษขยะเศษอาหารทันทีเมื่อออกแบบจานเอง</p>
              </div>
              <button 
                onClick={handleResetDatabase}
                title="ล้างและคืนค่าข้อมูลจำลอง"
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Shopping List/Shops selection */}
            <div className="mb-4">
              <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-wide">
                1. เลือกร้านค้าพันธมิตร NetZero
              </label>
              {/* Grid lists of Shops */}
              {loading ? (
                <div className="space-y-2 py-4">
                  <div className="h-14 bg-slate-100 rounded-2xl animate-pulse"></div>
                  <div className="h-14 bg-slate-100 rounded-2xl animate-pulse"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                  {shops.map((shop) => (
                    <div
                      key={shop.id}
                      onClick={() => handleShopSelect(shop)}
                      className={`cursor-pointer p-2 rounded-2xl border-2 transition-all flex items-center gap-2.5 ${
                        selectedShop?.id === shop.id
                          ? "bg-slate-900 border-slate-900 text-white shadow-md"
                          : "bg-slate-50 border-slate-100 hover:border-emerald-300 text-slate-700 hover:bg-white"
                      }`}
                    >
                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="w-10 h-10 rounded-xl object-cover"
                        onError={(e) => {
                          // Unsplash fallback
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h4 className="font-bold text-xs truncate">{shop.name}</h4>
                          {shop.isPartner && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title="NetZero Partner"></span>
                          )}
                        </div>
                        <p className="text-[9px] opacity-75 truncate">{shop.category}</p>
                      </div>
                    </div>
                  ))}
                  {shops.length === 0 && (
                    <p className="col-span-2 text-center py-4 text-xs text-slate-400">ยังไม่มีร้านค้าในขณะนี้</p>
                  )}
                </div>
              )}
            </div>

            {/* Menu Selection inside selected shop */}
            {selectedShop && (
              <div className="mb-4 bg-slate-50 p-3 rounded-2xl border-2 border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                    2. เลือกเมนูอาหาร &amp; เครื่องดื่ม ({selectedShop.name})
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    ★ {selectedShop.rating}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {selectedShop.menu.map((menuItem) => (
                    <div
                      key={menuItem.id}
                      onClick={() => setSelectedItem(menuItem)}
                      className={`cursor-pointer p-2.5 rounded-xl border transition-all flex justify-between items-center ${
                        selectedItem?.id === menuItem.id
                          ? "bg-emerald-600 border-emerald-500 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-emerald-50"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <h5 className="font-bold text-xs truncate">{menuItem.name}</h5>
                        <p className="text-[10px] opacity-85 truncate">{menuItem.thaiName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-xs block">{menuItem.price} ฿</span>
                        <span className="text-[9px] opacity-80 block font-mono">
                          🌱 {menuItem.baseCarbon} kg CO₂e
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Customizations Form */}
            <form onSubmit={handlePlaceOrder} className="space-y-4 flex-1 flex flex-col justify-between">
              
              <div className="space-y-3">
                {/* Custom Menu Specification Field (if "เมนูอื่น ๆ" is selected) */}
                {selectedItem?.id.endsWith("-other") && (
                  <div className="bg-amber-50/75 border-2 border-amber-200/60 rounded-2xl p-4.5 space-y-2 text-left animate-in fade-in duration-300">
                    <label className="block text-[11px] font-black text-amber-900 uppercase tracking-widest">
                      💡 ระบุชื่อเมนูอื่นที่คุณเล็งไว้ (Bespoke Menu Customization)
                    </label>
                    <p className="text-[10px] text-amber-700 font-bold leading-tight">
                      * คุณสามารถพิมพ์ชื่อเมนูสั่งทำพิเศษตามใจต้องการ แม่ครัวจะคัสตอมตระเตรียมให้โดยตรงเลย!
                    </p>
                    <input
                      type="text"
                      required
                      value={customMenuName}
                      onChange={(e) => setCustomMenuName(e.target.value)}
                      placeholder="ตัวอย่าง: ข้าวหมูกรอบคั่วพริกเกลือ ไข่ดาวไม่สุก / มัทฉะยูสุโซดาหวานน้อย"
                      className="w-full text-xs font-bold px-3 py-2.5 bg-white border border-amber-305 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-slate-800 placeholder-slate-400 shadow-inner"
                    />
                  </div>
                )}

                {/* 1. Rice portion size reduction */}
                {selectedItem?.category === "food" && selectedShop?.id !== "shop-2" && selectedShop?.id !== "shop-4" && (
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="font-black text-[11px] text-slate-900 uppercase tracking-wide">
                        3. ปริมาณข้าวสุก (กลยุทธ์ลด Food Waste!)
                      </p>
                      <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-full">
                        {ricePortion === "ข้าวน้อย" ? "ช่วยลดข้าวทิ้งขยะได้ก้อนใหญ่" : ricePortion === "ปกติ" ? "ปริมาณมาตรฐานอิ่มกำลังดี" : "ข้าวเม็ดพิเศษสำหรับคนหิวจัด"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRicePortion("ข้าวน้อย")}
                        className={`py-2 px-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                          ricePortion === "ข้าวน้อย"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-black shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                        }`}
                      >
                        <span className="block text-sm">🌾 น้อย</span>
                        <span className="text-[9px] opacity-85">-120 กรัม / -15% C0₂</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRicePortion("ปกติ")}
                        className={`py-2 px-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                          ricePortion === "ปกติ"
                            ? "border-emerald-500 bg-emerald-100 text-emerald-800 font-black"
                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                        }`}
                      >
                        <span className="block text-sm">⚖️ ปกติ</span>
                        <span className="text-[9px] opacity-85">สัดส่วนมาตรฐาน</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRicePortion("ข้าวมาก")}
                        className={`py-2 px-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                          ricePortion === "ข้าวมาก"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-black"
                            : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                        }`}
                      >
                        <span className="block text-sm">🏔️ มาก</span>
                        <span className="text-[9px] opacity-85">+15% คาร์บอนสะสม</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Noodle customization for Shop 2 (ร้านก๋วยเตี๋ยวโอชา นครปฐม) */}
                {selectedShop?.id === "shop-2" && (
                  <div className="bg-orange-50/80 border-2 border-orange-200/50 rounded-2xl p-4.5 space-y-3.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-black text-orange-950 uppercase tracking-wide flex items-center gap-1">
                        🍜 ตัวเลือกก๋วยเตี๋ยวพิเศษ (Ocha Noodle Option)
                      </span>
                      <span className="text-[10px] text-orange-700 bg-orange-100/70 font-bold px-2 py-0.5 rounded-full">
                        เลือกเส้นและรสชาติซุป
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* เส้น - Noodle Type */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.55">
                          1. เลือกชนิดเส้นก๋วยเตี๋ยว
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {["เส้นเล็ก", "เส้นใหญ่", "บะหมี่", "วุ้นเส้น", "บะหมี่หยก"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setNoodleType(t)}
                              className={`py-2 text-center text-[11px] font-black rounded-xl border transition-all ${
                                noodleType === t
                                  ? "bg-orange-600 border-orange-500 text-white shadow-sm"
                                  : "bg-white border-slate-200 text-slate-600 hover:border-orange-300"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* น้ำซุป - Soup Type */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">
                            2. เลือกรสชาติน้ำซุป
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {["น้ำใส", "ต้มยำ", "น้ำตก"].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setNoodleSoup(s)}
                                className={`py-1.5 text-center text-[11px] font-bold rounded-lg border transition-all ${
                                  noodleSoup === s
                                    ? "bg-orange-600 border-orange-500 text-white shadow-sm"
                                    : "bg-white border-slate-200 text-slate-600 hover:border-orange-300"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* เเ้ง หรือ น้ำ */}
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wide mb-1.5">
                            3. เลือกประเภทเสิร์ฟ
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {["น้ำ", "แห้ง"].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setNoodleDryOrSoup(d)}
                                className={`py-1.5 text-center text-[11px] font-bold rounded-lg border transition-all ${
                                  noodleDryOrSoup === d
                                    ? "bg-orange-600 border-orange-500 text-white shadow-sm"
                                    : "bg-white border-slate-700 text-slate-700 hover:border-orange-300"
                                }`}
                              >
                                {d === "น้ำ" ? "แบบน้ำ" : "แบบแห้ง"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Vegetable preference to avoid tray waste */}
                {selectedItem?.category === "food" && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                        🥦 ถ้ารู้ตัวว่าไม่กินผัก? (ติ๊กออกเพื่อลดเศษผักค้างจาน)
                      </label>
                      <p className="text-[10px] text-slate-400">แม่ครัวจะได้แยกหรือลดเพื่อไม่ให้ไปเป็นขยะเน่าเสีย</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={noVeggies}
                      onChange={(e) => setNoVeggies(e.target.checked)}
                      className="w-5 h-5 rounded-md accent-emerald-500 border-slate-300 cursor-pointer"
                    />
                  </div>
                )}

                {/* 3. Utilities & Plastics selection */}
                <div className="bg-blue-50 rounded-2xl border-2 border-blue-100/60 p-3.5 space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-black text-blue-900 uppercase tracking-wide">
                      ⚡ สิทธิพิเศษและตัวเลือกลดพลาสติก
                    </span>
                    <span className="text-[9px] text-sky-700 font-bold bg-sky-100 px-2 py-0.5 rounded-full">
                      Zero Waste Options
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Straw Option */}
                    <label className="flex items-center justify-between bg-white/75 hover:bg-white p-2.5 rounded-xl border border-blue-100 cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">🥤 ไม่เอาหลอด</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={noStraw}
                        onChange={(e) => setNoStraw(e.target.checked)}
                        className="w-4 h-4 accent-blue-600 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Bring your own cup - especially for drinks with 5 THB discount */}
                  <label className={`flex items-center justify-between p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                    ownCup 
                      ? "bg-sky-500 text-white border-transparent" 
                      : "bg-white text-slate-700 border-blue-200 hover:border-sky-400"
                  }`}>
                    <div>
                      <span className="text-xs font-black flex items-center gap-1.5">
                        🧴 นำกระบอกน้ำแก้วพกพามาเอง
                      </span>
                      <p className={`text-[9px] ${ownCup ? "text-sky-100" : "text-sky-600 font-semibold"}`}>
                        *รับส่วนลดทันที 5 บาท สำหรับประเภทร้านน้ำปั่นเครื่องดื่ม!
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={ownCup}
                      onChange={(e) => setOwnCup(e.target.checked)}
                      className="w-4 h-4 accent-white cursor-pointer"
                    />
                  </label>

                  {/* Bring your own food container - especially for foods */}
                  <label className={`flex items-center justify-between p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                    ownContainer 
                      ? "bg-emerald-600 text-white border-transparent" 
                      : "bg-white text-slate-700 border-blue-200 hover:border-emerald-500"
                  }`}>
                    <div>
                      <span className="text-xs font-black flex items-center gap-1.5">
                        🍱 นำกล่องข้าว/ปิ่นโตมาเอง
                      </span>
                      <p className={`text-[9px] ${ownContainer ? "text-emerald-100" : "text-emerald-600 font-semibold"}`}>
                        *ช่วยลดขยะกล่องใส่อาหารและลดคาร์บอนฟุตพริ้นท์ลงอีก 0.15 kg CO2e!
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={ownContainer}
                      onChange={(e) => setOwnContainer(e.target.checked)}
                      className="w-4 h-4 accent-white cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Dynamic Carbon Impact Dashboard Estimate & Input fields */}
              <div className="mt-4 pt-4 border-t-2 border-dashed border-slate-100 space-y-3.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase">ชื่อเล่นนักเรียน / หมายเลขโต๊ะ</label>
                    <input
                      required
                      type="text"
                      placeholder="เช่น ใบหม่อน ม.5/1 (เลขที่ 12)"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none"
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-[10px] font-black text-slate-400 uppercase">ระดับชั้น</label>
                    <input
                      required
                      type="text"
                      placeholder="เช่น ม.6/2"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Footprint Preview Card */}
                {selectedItem && (
                  <div className="p-3 bg-emerald-950 text-white rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] opacity-80 uppercase tracking-widest font-black">
                        ประมาณการคาร์บอนฟุตพริ้นท์ของคุณจานนี้
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-mono font-black text-emerald-300">
                          {getCurrentCarbonEstimate()}
                        </span>
                        <span className="text-xs opacity-75">kg CO₂e</span>
                      </div>
                    </div>

                    <div className="text-right border-l pl-3 border-emerald-850">
                      <p className="text-[9px] opacity-80 uppercase font-black text-orange-400">
                        ปริมาณที่ช่วยประหยัดได้สำเร็จ
                      </p>
                      <span className="text-base font-black font-mono text-orange-400">
                        🌱 -{getCurrentSavingsEstimate()} kg
                      </span>
                    </div>
                  </div>
                )}

                {/* Submitting Buttons */}
                <button
                  type="submit"
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-base shadow-lg shadow-orange-200 uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Confirm Pre-Order (ยืนยันสั่งอาหาร)
                </button>
              </div>

            </form>
          </div>

          {/* Student AI Inspiration Tip Widget */}
          {studentAITip && (
            <div className="bg-slate-900 text-white p-5 rounded-[30px] shadow-lg border border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 px-2.5 bg-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1">
                  <Sparkles size={11} className="inline" />
                  <span>Gemini นักแต่งนิเวศน์</span>
                </div>
                <span className="text-xs text-orange-400 font-bold bg-orange-400/10 px-2 py-0.5 rounded-full">
                  {studentAITip.badge}
                </span>
              </div>
              <h4 className="text-sm font-black text-slate-100 mb-1.5 leading-snug">
                &ldquo;{studentAITip.headline}&rdquo;
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                {studentAITip.insight}
              </p>

              {/* Action Bullets */}
              <div className="mt-3.5 space-y-1.5">
                {studentAITip.actionPlans?.slice(0, 3).map((plan, i) => (
                  <div key={i} className="flex gap-2 items-start text-[11px] text-slate-300">
                    <span className="p-0.5 bg-emerald-500 rounded-full text-white text-[9px] shrink-0 font-bold w-4 h-4 flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span>{plan}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-800 flex justify-between items-center text-[10.5px]">
                <span className="font-semibold text-slate-400">เกร็ดความรู้โลกร้อน:</span>
                <span className="text-emerald-400 text-right">{studentAITip.fact}</span>
              </div>
            </div>
          )}
        </section>

        {/* Right Side: Cook Dashboard / Sustainability Hub */}
        <section id="cook-perspective" className={`col-span-12 ${activeRole === "cook" ? "lg:col-span-7" : "hidden lg:flex lg:col-span-8"} flex flex-col gap-6`}>
          
          {/* Dashboard Summary Panels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* 1. Daily orders tracking */}
            <div className="bg-emerald-500 rounded-[28px] md:rounded-[32px] p-5 text-white shadow-xl shadow-emerald-200">
              <div className="flex justify-between items-start mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100">ความคืบหน้ารวม</p>
                <Activity size={16} className="text-white/60" />
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black font-mono">{totalOrders}</span>
                <span className="text-xs text-emerald-100 font-bold">/ 3000 นักเรียน</span>
              </div>
              
              <div className="w-full h-3 bg-emerald-700/30 rounded-full overflow-hidden mt-4 relative">
                <div className="h-full bg-white transition-all duration-500 rounded-full" style={{ width: `${Math.min(100, (totalOrders / 3000) * 100)}%` }}></div>
              </div>
              <p className="text-[10px] italic mt-2 text-emerald-100/95 font-light">
                *สถิติลดขยะอ้างอิงเป้าหมาย NetZero โรงเรียน
              </p>
            </div>

            {/* 2. Food waste saved metrics */}
            <div className="bg-orange-500 rounded-[28px] md:rounded-[32px] p-5 text-white shadow-xl shadow-orange-200">
              <div className="flex justify-between items-start mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-100">ขยะเศษอาหารประหยัดได้</p>
                <Zap size={16} className="text-white/60 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black font-mono">{stats ? stats.foodWasteSavedKg.toFixed(1) : "12.5"}</span>
                <span className="text-xs text-orange-100 font-bold">กิโลกรัม (kg)</span>
              </div>
              <p className="text-[10px] font-medium bg-orange-600/40 py-1 px-3 rounded-full inline-block mt-4">
                📉 ชิงขนาด &quot;ข้าวน้อย&quot; ลดข้าวทิ้งขยะ {portions ? portions.xs : "45"} จาน
              </p>
            </div>

            {/* 3. Ocean plastics saved metrics */}
            <div className="bg-blue-600 rounded-[28px] md:rounded-[32px] p-5 text-white shadow-xl shadow-blue-200">
              <div className="flex justify-between items-start mb-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-100">พลาสติกและแก้วงดใช้</p>
                <CheckCircle2 size={16} className="text-white/60" />
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-3xl font-black font-mono">{stats ? stats.plasticsAvoidedCount : "310"}</span>
                <span className="text-xs text-sky-100 font-bold">ชิ้นเดี่ยว</span>
              </div>
              <p className="text-[10px] font-semibold bg-blue-700/40 py-1 px-3 rounded-full inline-block mt-4">
                🥤 พกแก้ว {stats ? stats.ownCupCount : "210"} / หลอด {stats ? stats.noStrawCount : "120"} / 🍱 พกกล่อง {stats ? stats.ownContainerCount : "0"}
              </p>
            </div>

          </div>

          {/* Lower layout grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            
            {/* Kitchen Preparation Guide Panel */}
            <div className="bg-white rounded-[32px] md:rounded-[40px] p-5 md:p-8 shadow-xl border-4 border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">คู่มือเตรียมวัตถุดิบแม่ครัว</h3>
                    <p className="text-[11px] text-slate-400 uppercase font-black">Predicted Kitchen Prep Guide</p>
                  </div>
                  <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full border">
                    อัปเดตออเดอร์สด
                  </span>
                </div>

                {/* Simulated list of actions for cook */}
                <div className="space-y-3">
                  
                  {/* Small rice portion reduction indicator */}
                  <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border transition-all">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                      {portions ? portions.xs : "45"}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-slate-700 text-xs md:text-sm">ผู้สั่งขนาด &ldquo;ข้าวน้อย&rdquo;</h5>
                      <p className="text-[10.5px] text-slate-400">หุงข้าวน้อยลง {(portions ? portions.xs * 0.12 : 5.4).toFixed(1)} กิโลกรัม</p>
                    </div>
                    <div className="w-4 h-4 border-2 border-emerald-500 rounded-md flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>
                    </div>
                  </div>

                  {/* Standard portion count */}
                  <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border transition-all">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                      {portions ? portions.normal : "120"}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-slate-700 text-xs md:text-sm">ขนาดจาน &ldquo;ปกติ&rdquo;</h5>
                      <p className="text-[10.5px] text-slate-400 font-light">จัดตักขนาดมาตรฐานในศูนย์อาหาร</p>
                    </div>
                    <div className="w-4 h-4 border-2 border-emerald-500 rounded-md"></div>
                  </div>

                  {/* No vegetable requested indicator */}
                  <div className="flex items-center gap-3.5 p-3.5 bg-rose-50 rounded-2xl border border-rose-200 transition-all">
                    <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-black">
                      {stats ? stats.noVeggiesCount : "82"}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-black text-rose-700 text-xs md:text-sm">คนไม่รับผักสด (No Veggies)</h5>
                      <p className="text-[10.5px] text-rose-600 font-semibold font-mono">ประหยัดเศษผักเหลือจานลงได้เด็ดขาด!</p>
                    </div>
                    <div className="w-4 h-4 bg-rose-500 rounded-md flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  </div>

                  {/* Food container zero waste count */}
                  <div className="flex items-center gap-3.5 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 transition-all">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black">
                      {stats ? stats.ownContainerCount : "40"}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-black text-amber-900 text-xs md:text-sm">พกกล่องข้าว / ปิ่นโตมาเอง</h5>
                      <p className="text-[10.5px] text-amber-700 font-semibold font-mono">ลดการใช้ภาชนะใช้แล้วทิ้งของโรงเรียน!</p>
                    </div>
                    <div className="w-4 h-4 bg-amber-500 rounded-md flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  </div>

                  {/* Drink zero waste count */}
                  <div className="flex items-center gap-3.5 p-3.5 bg-blue-50/70 hover:bg-blue-50 rounded-2xl border border-blue-100/80 transition-all">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                      {stats ? stats.ownCupCount + stats.noStrawCount : "210"}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-bold text-slate-700 text-xs md:text-sm">พกแก้วมาเอง / ไม่เอาหลอด</h5>
                      <p className="text-[10.5px] text-blue-600 font-medium">ช่วยประหยัดหลอด / แก้วพลาสติกโรงเรียน</p>
                    </div>
                    <div className="w-4 h-4 border-2 border-blue-500 rounded-md"></div>
                  </div>

                </div>
              </div>

              {/* Reset to fresh and Quick statistics audit helper */}
              <div className="pt-4 border-t border-dashed border-slate-100 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={13} />
                  <span>สถิติคำนวณแบบ Real-time</span>
                </div>
                <button
                  type="button"
                  onClick={fetchData}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={11} /> รีเฟรชคู่มือเตรียมครัว
                </button>
              </div>

            </div>

            {/* Room Sustainability Leaderboard */}
            <div className="bg-white rounded-[32px] md:rounded-[40px] p-5 md:p-8 shadow-xl border-4 border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">ทำเนียบคาร์บอนต่ำสะสม</h3>
                    <p className="text-[11px] text-slate-400 uppercase font-black">Room Sustainability Leaderboard</p>
                  </div>
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-yellow-500 w-6">1</span>
                    <div className="flex-1 h-12 bg-slate-50 rounded-xl flex items-center px-4 justify-between border-l-4 border-yellow-500">
                      <span className="font-bold text-slate-700 text-xs">ชั้น มัธยมปีที่ 6/2</span>
                      <span className="text-emerald-600 font-black text-xs">98% ปฏิบัติตัวดีเยี่ยม</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-slate-400 w-6">2</span>
                    <div className="flex-1 h-12 bg-slate-50 rounded-xl flex items-center px-4 justify-between border-l-4 border-slate-300">
                      <span className="font-bold text-slate-700 text-xs">ชั้น มัธยมปีที่ 5/1</span>
                      <span className="text-emerald-700 font-black text-xs">92% พกกระบอกกระจุย</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-amber-700 w-6">3</span>
                    <div className="flex-1 h-12 bg-slate-50 rounded-xl flex items-center px-4 justify-between border-l-4 border-amber-600">
                      <span className="font-bold text-slate-700 text-xs">ชั้น มัธยมปีที่ 6/8</span>
                      <span className="text-emerald-600 font-bold text-xs">88% เคลียร์จานหมดเกลี้ยง</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bonus incentive marker */}
              <div className="mt-6 pt-4 border-t border-dashed border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500">เป้าหมายรางวัลสัปดาห์นี้:</span>
                  <span className="font-black text-emerald-500 underline flex items-center gap-1">
                    <Sparkle size={12} className="animate-spin text-orange-500" /> แจกไอศกรีมรักษ์โลกฟรีวันศุกร์!
                  </span>
                </div>
              </div>

            </div>

          </div>

          {/* Real-time Order Dispatch Feed Panel */}
          <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-xl border-4 border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">คิวบอร์ดพรีออเดอร์ของนักเรียนวันนี้</h3>
                  <p className="text-[11px] text-slate-400 uppercase font-black font-mono">Live Customization & Noodle Dispatch Feed</p>
                </div>
                <span className="animate-pulse flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> เชื่อมต่อแม่ครัวเรียบร้อย (Live)
                </span>
              </div>

              {loading ? (
                <div className="space-y-2 py-4">
                  <div className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
                  <div className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  ยังไม่มีการสั่งข้าว/ก๋วยเตี๋ยวในระบบช่วงนี้ สั่งจานแรกเลย!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {orders.map((or) => (
                    <div key={or.id} className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-2xl transition-all flex flex-col md:flex-row justify-between md:items-center gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-xs text-emerald-700 bg-emerald-50/80 px-2.5 py-0.5 rounded-full border border-emerald-100">{or.studentName}</span>
                          <span className="text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded font-mono">
                            {or.timestamp ? new Date(or.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : "--:--"} น.
                          </span>
                          <span className="text-[10px] font-black text-slate-600 bg-orange-100/70 border border-orange-200 text-orange-850 px-2 py-0.5 rounded-full">{or.shopName}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <h4 className="font-black text-xs text-slate-900">{or.menuName}</h4>
                          <span className="text-[10px] text-slate-450 font-normal">({or.thaiMenuName})</span>
                        </div>
                        
                        {/* Display choices / Customizations */}
                        <div className="mt-2 flex flex-wrap gap-1 md:gap-1.5 items-center">
                          {or.shopId === "shop-2" ? (
                            <>
                              <span className="text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-sans">🍜 ชนิดเส้น: {or.noodleType || "เส้นเล็ก"}</span>
                              <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded font-sans">🌶️ ซุป: {or.noodleSoup || "น้ำใส"} ({or.noodleDryOrSoup || "น้ำ"})</span>
                            </>
                          ) : or.shopId === "shop-4" ? null : (
                            <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold font-sans">🌾 ข้าวมื้อ: {or.ricePortion}</span>
                          )}
                          {or.noVeggies && <span className="text-[10px] bg-rose-100/80 text-rose-700 font-bold px-2 py-0.5 rounded border border-rose-200 font-sans">🥦 ไม่เอาผัก</span>}
                          {or.noStraw && <span className="text-[10px] bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded border border-blue-200 font-sans">🥤 งดหลอด</span>}
                          {or.ownCup && <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-200 font-sans">🧴 พกกระบอกน้ำแก้ว</span>}
                          {or.ownContainer && <span className="text-[10px] bg-emerald-150 text-emerald-900 font-black px-2 py-0.5 rounded border border-emerald-300 font-sans">🍱 พกกล่อง/ปิ่นโตเอง</span>}
                          {or.noPlasticUtensil && <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded border border-sky-200 font-sans">🍴 งดช้อนส้อมพลาสติก</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex md:flex-col items-center justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-1.5 md:pt-0 md:pl-4">
                        <span className="font-black text-sm text-slate-900 block">{or.price} ฿</span>
                        <span className="text-[10px] text-emerald-600 block font-mono">🌱 {or.carbonFootprint} kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Gemini AI Sustainability Canteen Consultant Panel */}
          <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-center"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 font-bold text-xs px-3.5 py-1 rounded-full border border-emerald-500/30 mb-2">
                    <Sparkles size={13} />
                    <span>Gemini-3-Flash AI Sustainable Dashboard</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
                    สมองกลวิเคราะห์และพยากรณ์ขยะอาหารโรงครัว
                  </h3>
                  <p className="text-xs text-emerald-200/80 font-light mt-0.5">
                    ประมวลผลข้อมูลการสั่งสะสมเพื่อเพิ่มประสิทธิภาพ และปรับวัตถุดิบการปรุงเชิงนิเวศน์
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custom input or presets to command Gemini */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div>
                    <label className="block text-[10px] font-black text-emerald-300 uppercase tracking-wider mb-1.5">
                      เลือกตัวประมวลผล AI พยากรณ์เพื่อสร้างกลยุทธ์กู้โลก
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => handleFetchAIEcoAdvice("cook", "วิเคราะห์การสั่งขนาด 'ข้าวน้อย' วันนี้และเสนอวิธีประหยัดปริมาณหุงข้าวที่ถูกต้อง")}
                        className="py-2 px-3 bg-white/10 hover:bg-white/15 text-white rounded-xl text-left text-xs font-semibold border border-white/10 transition-colors flex items-center justify-between"
                      >
                        <span>📉 ปรับลดการหุงวัตถุดิบ</span>
                        <ChevronRight size={13} className="text-emerald-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFetchAIEcoAdvice("cook", "คิดค้นเมนูใหม่ที่มีคาร์บอนฟุตพริ้นท์ต่ำสุด (Low-Carbon Menu) เพื่อแทนหมูแดงในสัปดาห์ถัดไป")}
                        className="py-2 px-3 bg-white/10 hover:bg-white/15 text-white rounded-xl text-left text-xs font-semibold border border-white/10 transition-colors flex items-center justify-between"
                      >
                        <span>🍛 เมนูทดแทนคาร์บอนต่ำ</span>
                        <ChevronRight size={13} className="text-emerald-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFetchAIEcoAdvice("cook", "วิเคราะห์พฤติกรรมคนสั่งร้านน้ำและคาดการณ์เศษวัสดุพลาสติกเพื่อส่งรายงานสิ่งแวดล้อม")}
                        className="py-2 px-3 bg-white/10 hover:bg-white/15 text-white rounded-xl text-left text-xs font-semibold border border-white/10 transition-colors flex items-center justify-between"
                      >
                        <span>🥤 คาดการณ์พลาสติกขยะ</span>
                        <ChevronRight size={13} className="text-emerald-400" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[10px] font-black text-emerald-300 uppercase tracking-wider mb-1.5">
                      หรือสั่งคำถามที่กังวลเป็นพิเศษในศูนย์อาหาร
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="เช่น ประหยัดเศษผักเหลือเยอะในแกงส้มได้อย่างไร?"
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        className="text-xs flex-1 p-2.5 bg-white/5 border border-white/10 focus:border-emerald-400 rounded-xl outline-none text-white focus:bg-white/10 transition-colors"
                      />
                      <button
                        type="button"
                        disabled={aiLoading}
                        onClick={() => handleFetchAIEcoAdvice("cook")}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white font-black text-xs rounded-xl flex items-center gap-1 shadow-md transition-all active:scale-95"
                      >
                        {aiLoading ? "กำลังวิ่ง..." : "วิเคราะห์"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Response area showing processed values from AI */}
                <div className="bg-emerald-950/70 rounded-2xl p-4 md:p-5 border border-emerald-800/80 flex flex-col justify-between min-h-[220px]">
                  {aiLoading ? (
                    <div className="space-y-4 animate-pulse flex-1 justify-center flex flex-col">
                      <div className="h-4 bg-emerald-800/40 rounded w-1/3"></div>
                      <div className="h-3 bg-emerald-800/40 rounded w-full"></div>
                      <div className="h-3 bg-emerald-800/40 rounded w-2/3"></div>
                      <div className="h-3 bg-emerald-800/40 rounded w-5/6"></div>
                    </div>
                  ) : cookAITip ? (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-3 overflow-y-auto max-h-[190px] pr-1">
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-black text-orange-400">📊 ผลการตรวจเศษอาหาร (Waste Audit)</span>
                          <p className="text-xs font-light text-slate-100 leading-relaxed mt-0.5">{cookAITip.wasteAudit}</p>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-black text-teal-400">💡 ไอเดียและเมนูลดโรคร้อน</span>
                          <p className="text-xs font-light text-slate-100 leading-relaxed mt-0.5">{cookAITip.ecoRecipeSuggestion}</p>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-widest font-black text-sky-400">🔮 คาดการณ์ทราฟฟิก &amp; วัตถุดิบ</span>
                          <p className="text-xs font-light text-slate-100 leading-relaxed mt-0.5">{cookAITip.forecastPrediction}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-emerald-800 text-[10px] text-emerald-300 italic flex justify-between">
                        <span>ดัชนีคาร์บอนประจำครัว:</span>
                        <span>{cookAITip.fact || "แกงสุกด้วยใบตองลดค่านิยมพลาสติกได้ครึ่งหนึ่ง"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-6 text-emerald-400/60 flex-1">
                      <Sparkles size={32} className="mb-2 text-emerald-400/40 animate-bounce" />
                      <p className="text-xs font-bold text-emerald-200">ยังไม่ได้รับการวิเคราะห์</p>
                      <p className="text-[10px] opacity-75 mt-1 max-w-xs">คลิกปุ่มซ้ายสุดเพื่อเริ่มให้ AI ประนอมตารางพยากรณ์วัฐจักรเศษอาหารและคาร์บอนวันนี้ตามข้อมูลสั่งพรีออเดอร์สะสม</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </section>
      </main>

      {/* Floating real-time tracker for the kitchen */}
      <footer className="bg-slate-900 border-t-2 border-slate-800 text-slate-400 p-4 text-center text-xs mt-10">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
          <p className="font-light">
            © 2026 <strong>SchoolNetZero App Platform by PS</strong>. พัฒนาขึ้นเพื่อขจัดขัดขวางขยะเศษอาหารระดับโรงเรียนมัธยมไทย สู่ความยั่งยืนสากล.
          </p>
          <div className="flex gap-4">
            <span className="text-emerald-400 font-bold hover:underline cursor-pointer" onClick={() => triggerToast("ข้อมูลช่วยเหลือ", "ระบบทำงานอัจฉริยะร่วมกับร้านค้านักเรียน", "success")}>Help Center</span>
            <span className="text-sky-400 font-bold hover:underline cursor-pointer" onClick={() => triggerToast("ระบบจัดอันดับ", "อ้างอิงสถิติร่วมกับความร่วมมือแต่ละพรีออเดอร์", "success")}>Grade Rankings</span>
            <span className="text-orange-400 font-bold hover:underline cursor-pointer" onClick={handleResetDatabase}>Admin Hard Reset</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
