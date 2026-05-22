import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header if API key exists
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini AI successfully initialized server-side.");
  } catch (err) {
    console.error("Failed to initialize Gemini AI Client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY provided; falling back to mock expert generator.");
}

// In-Memory Database State
let initialShops = [
  {
    id: "shop-1",
    name: "เเม่มณี",
    thaiName: "เเม่มณี (Mae Manee's Food A-La-Carte)",
    description: "อาหารตามสั่งจานเด็ด ตระหนักรู้เรื่องขยะอาหาร ใช้วัตถุดิถิ่น แหล่งโปรตีนคาร์บอนต่ำ",
    isPartner: true,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400",
    rating: 4.8,
    category: "อาหารตามสั่ง",
    menu: [
      {
        id: "menu-1-1",
        name: "ข้าวกะเพราหมูชิ้น",
        thaiName: "ข้าวกะเพราหมูชิ้น (Stir-Fried Basil with Pork)",
        price: 45,
        baseCarbon: 1.4, // kg CO2e
        category: "food"
      },
      {
        id: "menu-1-2",
        name: "ข้าวผัดไข่",
        thaiName: "ข้าวผัดไข่ (Fried Rice with Egg)",
        price: 40,
        baseCarbon: 0.8,
        category: "food"
      },
      {
        id: "menu-1-3",
        name: "ข้าวหมูกระเทียม",
        thaiName: "ข้าวหมูกระเทียม (Stir-Fried Pork Garlic)",
        price: 50,
        baseCarbon: 1.3,
        category: "food"
      },
      {
        id: "menu-1-4",
        name: "ข้าวไก่ทอดสไปซี่",
        thaiName: "ข้าวไก่ทอดสไปซี่ (Spicy Fried Chicken on Rice)",
        price: 50,
        baseCarbon: 1.2,
        category: "food"
      },
      {
        id: "menu-1-5",
        name: "ข้าวไข่ลูกเขย",
        thaiName: "ข้าวไข่ลูกเขย (Egg with Sweet Tamarind Sauce on Rice)",
        price: 40,
        baseCarbon: 0.7,
        category: "food"
      },
      {
        id: "menu-1-6",
        name: "ผัดไทย",
        thaiName: "ผัดไทย (Pad Thai Noodles)",
        price: 50,
        baseCarbon: 0.9,
        category: "food"
      },
      {
        id: "menu-1-7",
        name: "สุกี้",
        thaiName: "สุกี้ (Suki Soup / Dry)",
        price: 50,
        baseCarbon: 1.0,
        category: "food"
      },
      {
        id: "menu-1-other",
        name: "อื่น ๆ (ระบุเอง)",
        thaiName: "อื่น ๆ (ระบุรายละเอียดเมนูที่ต้องการ)",
        price: 45,
        baseCarbon: 1.1,
        category: "food"
      }
    ]
  },
  {
    id: "shop-2",
    name: "ร้าน ก๋วยเตี๋ยวโอชา นครปฐม",
    thaiName: "ร้าน ก๋วยเตี๋ยวโอชา นครปฐม (Ocha Noodles Nakhon Pathom)",
    description: "เน้นเส้นและซุปร้อนอร่อยเข้มข้น ปลูกผักอินทรีย์เคียงชาม ไม่ทิ้งเศษผักเลอะแกง",
    isPartner: true,
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400",
    rating: 4.7,
    category: "ก๋วยเตี๋ยวเเละซุป",
    menu: [
      {
        id: "menu-2-1",
        name: "เส้นเล็กต้มยำปลาสด",
        thaiName: "เส้นเล็กต้มยำปลาสด (Fish Tom Yum Noodles)",
        price: 45,
        baseCarbon: 0.9,
        category: "food"
      },
      {
        id: "menu-2-2",
        name: "บะหมี่น้ำหมูแดง",
        thaiName: "บะหมี่น้ำหมูแดง (Pork Noodles with Soup)",
        price: 50,
        baseCarbon: 1.5,
        category: "food"
      },
      {
        id: "menu-2-other",
        name: "อื่น ๆ (ระบุเอง)",
        thaiName: "อื่น ๆ (ระบุรายละเอียดเมนูที่ต้องการ)",
        price: 45,
        baseCarbon: 1.0,
        category: "food"
      }
    ]
  },
  {
    id: "shop-3",
    name: "ครัวข้าวสวย ข้าวปุ้น",
    thaiName: "ครัวข้าวสวย ข้าวปุ้น (Khao Suay & Khao Pun Local Foods)",
    description: "เมนูทางเลือกเพื่ออนาคตที่ดีกว่า ขนมจีนน้ำยาธรรมชาติ ปราศจากขยะพลาสติกห่อหุ้ม",
    isPartner: true,
    image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=400",
    rating: 4.9,
    category: "อาหารจานเดียว",
    menu: [
      {
        id: "menu-3-1",
        name: "ขนมจีนน้ำยาป่า",
        thaiName: "ขนมจีนน้ำยาป่า (Rice Vermicelli with Spicy Wild Soup)",
        price: 40,
        baseCarbon: 0.4,
        category: "food"
      },
      {
        id: "menu-3-2",
        name: "ข้าวแกงส้มมะละกอ",
        thaiName: "ข้าวแกงส้มมะละกอ (Papaya Orange Curry on Rice)",
        price: 45,
        baseCarbon: 0.8,
        category: "food"
      },
      {
        id: "menu-3-3",
        name: "ข้าวราดผัดพริกแกงหมู",
        thaiName: "ข้าวราดผัดพริกแกงหมู (Stir-Fried Curly Pork Curry on Rice)",
        price: 50,
        baseCarbon: 1.2,
        category: "food"
      },
      {
        id: "menu-3-4",
        name: "ข้าวไข่เจียวสมุนไพร",
        thaiName: "ข้าวไข่เจียวสมุนไพรออร์แกนิก (Organic Herb Omelette on Rice)",
        price: 35,
        baseCarbon: 0.6,
        category: "food"
      },
      {
        id: "menu-3-5",
        name: "ข้าวผัดกะเพราเต้าหู้เห็ดหอม",
        thaiName: "ข้าวผัดกะเพราเต้าหู้เห็ดหอมไร้เนื้อสัตว์ (Plant-Based Tofu Mushroom Basil on Rice)",
        price: 45,
        baseCarbon: 0.5,
        category: "food"
      },
      {
        id: "menu-3-other",
        name: "อื่น ๆ (ระบุเอง)",
        thaiName: "อื่น ๆ (ระบุรายละเอียดเมนูที่ต้องการ)",
        price: 45,
        baseCarbon: 0.9,
        category: "food"
      }
    ]
  },
  {
    id: "shop-4",
    name: "praderm",
    thaiName: "praderm (Praderm Premium Drinks & Coffee)",
    description: "พราวเดิร์มเครื่องดื่มรักษ์โลก นำแก้วมาเองลดทันที 5 บาท หรือปฏิเสธหลอดพลาสติก",
    isPartner: true,
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=400",
    rating: 4.6,
    category: "เครื่องดื่ม",
    menu: [
      {
        id: "menu-4-1",
        name: "น้ำมะพร้าวน้ำหอมปั่น",
        thaiName: "น้ำมะพร้าวน้ำหอมปั่น (Coconut Smoothie)",
        price: 35,
        baseCarbon: 0.3,
        category: "drink"
      },
      {
        id: "menu-4-2",
        name: "ชามะนาวใบเตย",
        thaiName: "ชามะนาวใบเตย (Lemon Pandan Tea)",
        price: 25,
        baseCarbon: 0.2,
        category: "drink"
      },
      {
        id: "menu-4-3",
        name: "มัทฉะลาเต้",
        thaiName: "มัทฉะลาเต้ครีมนมทางเลือก (Matcha Green Tea Latte)",
        price: 45,
        baseCarbon: 0.4,
        category: "drink"
      },
      {
        id: "menu-4-4",
        name: "อเมริกาโน่เย็น",
        thaiName: "อเมริกาโน่หอมเข้มข้น (Rich Iced Americano)",
        price: 35,
        baseCarbon: 0.3,
        category: "drink"
      },
      {
        id: "menu-4-5",
        name: "เอสเพรสโซ่เย็น",
        thaiName: "เอสเพรสโซ่รสไทยหวานมัน (Sweet & Creamy Iced Espresso)",
        price: 40,
        baseCarbon: 0.4,
        category: "drink"
      },
      {
        id: "menu-4-6",
        name: "คาปูชิโน่เย็น",
        thaiName: "คาปูชิโน่ฟองนมนุ่ม (Frothy Iced Cappuccino)",
        price: 45,
        baseCarbon: 0.4,
        category: "drink"
      },
      {
        id: "menu-4-7",
        name: "ลาเต้เย็น",
        thaiName: "ลาเต้เย็นรสนุ่มละมุน (Smooth Iced Latte)",
        price: 45,
        baseCarbon: 0.4,
        category: "drink"
      },
      {
        id: "menu-4-other",
        name: "อื่น ๆ (ระบุเอง)",
        thaiName: "อื่น ๆ (ระบุรายละเอียดเครื่องดื่มที่ต้องการ)",
        price: 35,
        baseCarbon: 0.3,
        category: "drink"
      }
    ]
  }
];

// Baseline simulated historical metrics for today (cook-view has "2520 / 3000" orders)
let ordersList: any[] = [];

function generateSeededOrders() {
  const list: any[] = [];
  const now = new Date();
  
  // Create 2520 initial simulated orders to represent active engagement
  // Let's seed aggregate counts but also define the actual records to keep statistical validity
  
  // We will distribute across shops
  const portions = ["ข้าวน้อย", "ปกติ", "ข้าวมาก"];
  const portionWeights = [0.3, 0.6, 0.1]; // 30% ordered XS, 60% normal, 10% XL
  const veggieOptions = ["ใส่ผักปกติ", "ไม่เอาผัก"];
  const veggieWeights = [0.85, 0.15]; // 15% didn't want veggies
  
  // Shops
  // 2520 orders totals
  // let's distribute roughly: Shop 1: 1080, Shop 2: 720, Shop 3: 420, Shop 4: 300
  const distributions = [
    { count: 1080, shopIdx: 0 },
    { count: 720, shopIdx: 1 },
    { count: 420, shopIdx: 2 },
    { count: 300, shopIdx: 3 }
  ];

  let orderIdCounter = 1;

  distributions.forEach(({ count, shopIdx }) => {
    const shop = initialShops[shopIdx];
    for (let i = 0; i < count; i++) {
      const menuIdx = i % shop.menu.length;
      const menuItem = shop.menu[menuIdx];
      
      const portionNum = Math.random();
      const portion = portionNum < 0.3 ? "ข้าวน้อย" : portionNum < 0.9 ? "ปกติ" : "ข้าวมาก";
      
      const veggiesNum = Math.random();
      const noVeggies = veggiesNum < 0.15; // 15% don't want veggies
      
      const noStraw = Math.random() < 0.75; // 75% choose no straw
      const ownCup = Math.random() < 0.45; // 45% bring own cup and get discount
      const noPlasticUtensil = Math.random() < 0.60; // 60% refuse plastic utensils
      const ownContainer = Math.random() < 0.35; // 35% bring own box

      // Calculate Carbon Impact
      // Base carbon depends on meal
      let carbon = menuItem.baseCarbon;
      
      // Portion modification
      if (portion === "ข้าวน้อย") {
        carbon *= 0.85; // Less rice reduces methane from rice paddies + transport
      } else if (portion === "ข้าวมาก") {
        carbon *= 1.15;
      }
      
      // Utensils modification
      if (noStraw) carbon -= 0.02;
      if (ownCup) carbon -= 0.10;
      if (noPlasticUtensil) carbon -= 0.04;
      if (ownContainer) carbon -= 0.15;
      
      // Ensure carbon is positive
      carbon = Math.max(0.05, Math.round(carbon * 100) / 100);

      // Final price
      let finalPrice = menuItem.price;
      if (ownCup && menuItem.category === "drink") {
        finalPrice = Math.max(10, finalPrice - 5); // 5 baht discount
      }

      list.push({
        id: `seeded-${orderIdCounter++}`,
        studentId: `STD-${Math.floor(1000 + Math.random() * 9000)}`,
        studentName: `นักเรียนชั้น ม.${Math.floor(1 + Math.random() * 6)}/${Math.floor(1 + Math.random() * 8)}`,
        shopId: shop.id,
        shopName: shop.name,
        menuId: menuItem.id,
        menuName: menuItem.name,
        thaiMenuName: menuItem.thaiName,
        price: finalPrice,
        ricePortion: portion,
        noVeggies: noVeggies,
        noStraw: noStraw,
        ownCup: ownCup,
        noPlasticUtensil: noPlasticUtensil,
        ownContainer: ownContainer,
        carbonFootprint: carbon,
        timestamp: new Date(now.getTime() - Math.floor(Math.random() * 12 * 3600000)), // dynamic hours back
        isSeeded: true
      });
    }
  });

  ordersList = list;
}

// Generate the seeded orders initially
generateSeededOrders();


// ----- REST API HANDLERS -----

// 1. Get List of Shops & Menus
app.get("/api/shops", (req, res) => {
  res.json({ success: true, data: initialShops });
});

// 2. Get All Current Orders & Summary Statistics
app.get("/api/orders", (req, res) => {
  // Aggregate stats
  const totalOrdersCount = ordersList.length;
  
  // Calculate Portions
  const ricePortionXS = ordersList.filter(o => o.ricePortion === "ข้าวน้อย").length;
  const ricePortionNormal = ordersList.filter(o => o.ricePortion === "ปกติ").length;
  const ricePortionXL = ordersList.filter(o => o.ricePortion === "ข้าวมาก").length;
  
  // Zero Waste statistics
  const countNoStraw = ordersList.filter(o => o.noStraw).length;
  const countOwnCup = ordersList.filter(o => o.ownCup).length;
  const countNoPlasticUtensils = ordersList.filter(o => o.noPlasticUtensil).length;
  const countNoVeggies = ordersList.filter(o => o.noVeggies).length;
  const countOwnContainer = ordersList.filter(o => o.ownContainer).length;

  // Calculatings Food Waste reduction & Carbon Savings:
  // Baseline assumption for average student meal:
  // - Leaves ~ 30g worth of waste food if they take Portion Normal/XL but only eat what they need.
  // - Choosing portion "ข้าวน้อย" saves on average 120 grams of cooked rice that usually ends in garbage.
  // - Food waste savings = cooked rice portion saved (120g per "ข้าวน้อย" portion) + generic green choices.
  const foodWasteSavedKg = parseFloat(((ricePortionXS * 0.12) + (ordersList.filter(o => o.isSeeded === false).length * 0.05)).toFixed(2));
  
  // Standard Carbon baseline: If they ordered without eco customizations, what would it be?
  // Let's assume standard carbon per menu item without any utensils refuse is baseline.
  // Savings is computed as (Baseline - ActualCarbon)
  let totalSavedCarbon = 0;
  ordersList.forEach(o => {
    const shop = initialShops.find(s => s.id === o.shopId);
    const item = shop?.menu.find(m => m.id === o.menuId);
    if (item) {
      const baseline = item.baseCarbon;
      const actual = o.carbonFootprint;
      if (baseline > actual) {
         totalSavedCarbon += (baseline - actual);
      }
    }
  });
  
  // Plus plastic waste products avoided (straws, cups, cutlery, containers)
  const totalPlasticsAvoided = countNoStraw + countOwnCup + countNoPlasticUtensils + countOwnContainer;

  res.json({
    success: true,
    totalCount: totalOrdersCount,
    portions: {
      xs: ricePortionXS,
      normal: ricePortionNormal,
      xl: ricePortionXL
    },
    sustainability: {
      foodWasteSavedKg: foodWasteSavedKg,
      savedCO2eKg: parseFloat(totalSavedCarbon.toFixed(2)),
      plasticsAvoidedCount: totalPlasticsAvoided,
      noStrawCount: countNoStraw,
      ownCupCount: countOwnCup,
      noCutleryCount: countNoPlasticUtensils,
      noVeggiesCount: countNoVeggies,
      ownContainerCount: countOwnContainer
    },
    orders: ordersList.slice(-50).reverse() // Return 50 most recent orders
  });
});

// 3. Post a New Student Pre-Order
app.post("/api/orders", (req, res) => {
  const {
    studentName,
    shopId,
    menuId,
    ricePortion,
    noVeggies,
    noStraw,
    ownCup,
    noPlasticUtensil,
    ownContainer,
    noodleType,
    noodleSoup,
    noodleDryOrSoup,
    customMenuName
  } = req.body;

  if (!shopId || !menuId) {
    return res.status(400).json({ success: false, error: "Missing required selection fields." });
  }

  const shop = initialShops.find(s => s.id === shopId);
  const menuItem = shop?.menu.find(m => m.id === menuId);

  if (!shop || !menuItem) {
    return res.status(404).json({ success: false, error: "Selected Merchant or Menu not found." });
  }

  // Carbon calculation logic
  let carbon = menuItem.baseCarbon;
  if (ricePortion === "ข้าวน้อย") {
    carbon *= 0.85; // Portion reduction
  } else if (ricePortion === "ข้าวมาก") {
    carbon *= 1.15;
  }

  if (noStraw) carbon -= 0.02;
  if (ownCup) carbon -= 0.10;
  if (noPlasticUtensil) carbon -= 0.04;
  if (ownContainer) carbon -= 0.15;

  carbon = Math.max(0.05, Math.round(carbon * 100) / 100);

  // Price calculation
  let finalPrice = menuItem.price;
  if (ownCup && menuItem.category === "drink") {
    finalPrice = Math.max(10, finalPrice - 5); // 5 Baht discount for customized cup
  }

  const newOrder = {
    id: `live-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    studentId: `STD-LIVE`,
    studentName: studentName || "Anonymous Eco Student",
    shopId: shop.id,
    shopName: shop.name,
    menuId: menuItem.id,
    menuName: menuItem.id.endsWith("-other") && customMenuName ? `อื่น ๆ: ${customMenuName}` : menuItem.name,
    thaiMenuName: menuItem.id.endsWith("-other") && customMenuName ? `เมนูสั่งทำพิเศษ: ${customMenuName}` : menuItem.thaiName,
    price: finalPrice,
    ricePortion: ricePortion || "ปกติ",
    noVeggies: !!noVeggies,
    noStraw: !!noStraw,
    ownCup: !!ownCup,
    noPlasticUtensil: !!noPlasticUtensil,
    ownContainer: !!ownContainer,
    carbonFootprint: carbon,
    timestamp: new Date(),
    isSeeded: false,
    noodleType: noodleType || undefined,
    noodleSoup: noodleSoup || undefined,
    noodleDryOrSoup: noodleDryOrSoup || undefined
  };

  ordersList.push(newOrder);

  res.json({
    success: true,
    data: newOrder
  });
});

// 4. Reset orders back to base seed state
app.post("/api/orders/reset", (req, res) => {
  ordersList = [];
  generateSeededOrders();
  res.json({ success: true, message: "Orders database restored to initial seed state successfully." });
});


// 5. Ask Gemini AI for Smart Optimization / Sustainable Forecast Tips
app.post("/api/gemini/analysis", async (req, res) => {
  const { view, extraContext } = req.body;

  // Let's summarize our order ratios to feed into Gemini context
  const total = ordersList.length;
  const xs = ordersList.filter(o => o.ricePortion === "ข้าวน้อย").length;
  const normal = ordersList.filter(o => o.ricePortion === "ปกติ").length;
  const xl = ordersList.filter(o => o.ricePortion === "ข้าวมาก").length;
  const noStraw = ordersList.filter(o => o.noStraw).length;
  const ownCup = ordersList.filter(o => o.ownCup).length;
  const noVeggies = ordersList.filter(o => o.noVeggies).length;

  // Calculate generic savings
  const totalCarbonSaved = ordersList.reduce((acc, curr) => {
    const s = initialShops.find(sh => sh.id === curr.shopId);
    const i = s?.menu.find(me => me.id === curr.menuId);
    if (i) {
      const diff = i.baseCarbon - curr.carbonFootprint;
      return acc + (diff > 0 ? diff : 0);
    }
    return acc;
  }, 0);

  const statsText = `
  สถานะล่าสุดวันนี้:
  - ยอดรวมพรีออเดอร์ทั้งหมด: ${total} รายการ
  - อัตราส่วนข้าวน้อย (ลด Food Waste): ${xs} รายการ (${total > 0 ? Math.round((xs/total)*100) : 0}%)
  - อัตราส่วนข้าวปกติ: ${normal} รายการ (${total > 0 ? Math.round((normal/total)*100) : 0}%)
  - อัตราส่วนข้าวมาก: ${xl} รายการ (${total > 0 ? Math.round((xl/total)*100) : 0}%)
  - จำนวนคนไม่รับหลอด: ${noStraw} คน
  - จำนวนคนนำแก้วมาเอง: ${ownCup} คน
  - ไม่ใส่ผัก (คาดการณ์เศษผักเหลือ): ${noVeggies} คน
  - ปริมาณคาร์บอน (CO2e) ที่ช่วยลดได้สะสมวันนี้: ${totalCarbonSaved.toFixed(1)} kg CO2e
  `;

  // We write robust local mock tips in case API is unavailable or limits exceeded
  const localMockStudentTips = [
    {
      badge: "ดาวรุ่งพิทักษ์โลก",
      headline: "คุณเป็นส่วนหนึ่งของขบวนการ NetZero Canteen!",
      tips: [
        "การเลือก 'ข้าวน้อย' ของเพื่อนๆ ทั้งโรงเรียนร่วมกันในสัปดาห์นี้ ช่วยประหยัดข้าวสารที่ปกติจะถูกทิ้งเป็นขยะได้ถึง 200 กิโลกรัม!",
        "การปฎิเสธหลอดพลาสติก 1 ชิ้น ดูเหมือนน้อย แต่เมื่อพลังของเด็กๆ 2500 คนมารวมกันลดขยะพลาสติกได้ใหญ่ครึ่งตึกทีเดียว!",
        "ลองเลือกเมนูประเภทเต้าหู้หรือขนมจีนน้ำยาป่าในวันพรุ่งนี้ เพื่อช่วยตัดลดการปล่อยแก๊สคาร์บอนถึง 70% เทียบกับเมนูเนื้อสัตว์ใหญ่"
      ]
    },
    {
      badge: "ยอดฝีมือเซฟอาหาร",
      headline: "ลดขยะอาหารจากจุดเริ่มต้น (Source Reduction)",
      tips: [
        "รู้หรือไม่ว่าข้าวสาร 1 เม็ดใช้ทรัพยากรน้ำมากกว่าที่คิด การเลือกพรีออเดอร์ตามจริงคือหัวใจสำคัญ",
        "พกกล่องพลาสติติดตัวเพื่อแชร์ความตระหนักรู้ให้เพื่อนๆ สนุกไปกับการสะสมเหรียญคาร์บอนในโรงเรียน",
        "เครื่องดื่มและชาสมุนไพรร้าน praderm มีคาร์บอนฟุตพริ้นท์น้อยกว่าเครื่องดื่มอัดลมพลาสติก 2 เท่า ทานอร่อยแถมโลกยิ้มได้!"
      ]
    }
  ];

  const localMockCookTips = {
    wasteAudit: "วันนี้มีนักเรียนเลือก 'ข้าวน้อย' ถึง 30% ส่งผลให้แม่ครัวปรุงข้าวสุกประหยัดขึ้น 90 กิโลกรัมโดยไม่ต้องเหลือกองทิ้งเป็นเศษอาหารหลังรับประทานเสร็จ",
    ecoRecipeSuggestion: "เมนู 'ขนมจีนน้ำยาป่า' ได้รับความนิยมสูงที่สุด แม่ครัวสามารถผลักดันโปรตีนธรรมชาติและผักออร์แกนิกท้องถิ่นทดแทนหมูแดงในวันพรุ่งนี้เพื่อช่วยประหยัดต้นทุนและลดคาร์บอนได้เพิ่มขึ้นอีก 24%",
    forecastPrediction: "คาดการณ์พรุ่งนี้ อิงอุณหภูมิค่อนข้างร้อน นักเรียนจะสั่งร้านเครื่องดื่ม praderm เพิ่มขึ้น 20% แนะนำสต็อกผลไม้ออร์แกนิกจากเกษตรกรไทย และเตรียมถังปุ๋ยหมักสำหรับกากมะพร้าวเพื่อสร้างเป็นโรงเรียนสีเขียวหมุนเวียนสมบูรณ์"
  };

  if (!ai) {
    // If Gemini is not set up, respond with friendly simulated dynamic advice
    if (view === "student") {
      const selectedMock = localMockStudentTips[Math.floor(Math.random() * localMockStudentTips.length)];
      return res.json({
        success: true,
        source: "local-simulation",
        data: {
          badge: selectedMock.badge,
          headline: `คำพูดจาก AI: ${selectedMock.headline}`,
          insight: selectedMock.tips[0],
          actionPlans: selectedMock.tips,
          fact: `การลดขยะอาหาร (Food Waste) มีคุณค่าเท่ากับการปกป้องผืนป่าอย่างมีนัยสำคัญ`
        }
      });
    } else {
      return res.json({
        success: true,
        source: "local-simulation",
        data: {
          wasteAudit: localMockCookTips.wasteAudit,
          ecoRecipeSuggestion: `ไอเดียสูตรอาหาร: ${localMockCookTips.ecoRecipeSuggestion}`,
          forecastPrediction: localMockCookTips.forecastPrediction,
          fact: `การลดขยะเศษอาหารสะสมและปรับขนาดสัดส่วนข้าว คือกลยุทธ์สูงสุดของการเดินหน้าสู่ NetZero Canteen ที่ยั่งยืน`
        }
      });
    }
  }

  try {
    const prompt = view === "student"
      ? `You are an eco-friendly AI advisor for SchoolNetZero at a Thai school.
         Analyze current school lunch metrics and student options:
         ${statsText}
         Extra Student Context provided: "${extraContext || "ทั่วไป"}"
         
         Please generate highly inspiring, creative, positive tips in THAI for students to keep up the eco actions.
         Format the response strictly as valid JSON matching this schema:
         {
           "badge": "A creative Thai environmental badge title for this student (e.g. เทพธิดาข้าวน้อย, ผู้พิชิตหลอดพลาสติก, ฮีโร่คาร์บอนโมโน)",
           "headline": "A catchy encouraging Thai headline",
           "insight": "A surprising micro-fact related to their portions combined with today's school canteen metrics",
           "actionPlans": ["Action Tip 1 (short sentence in Thai)", "Action Tip 2", "Action Tip 3"],
           "fact": "A short, engaging cool eco carbon-saving scientific fact in Thai"
         }
         Only output the JSON string, do not include any markdown fences or triple backticks.`

      : `You are a professional Sustainable Canteen Consultant AI advice generator for the Canteen Cook.
         Analyze today's pre-ordering patterns to optimize food prep and slash waste:
         ${statsText}
         Extra Cook request context: "${extraContext || "ปรับปรุงเมนูและประหยัดงบ"}"
         
         Provide highly practical, concrete advice in THAI for the school kitchen.
         Format the response strictly as valid JSON matching this schema:
         {
           "wasteAudit": "Detailed practical Thai summary on how today's portion options (like 'ข้าวน้อย') translated to actual raw material savings or storage suggestions in the kitchen.",
           "ecoRecipeSuggestion": "A concrete recipe substitution or eco-friendly meal structure idea in Thai for tomorrow to lower carbon footprints (e.g., using local vegetable fiber instead of imported meat).",
           "forecastPrediction": "A waste forecast prediction in Thai based on the order ratio and how of specific shops (e.g., chicken rice veggie-refusal rates implying they should chop less celery).",
           "fact": "A powerful Thai kitchen sustainability metric quote."
         }
         Only output the JSON string, do not include any markdown fences or triple backticks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const cleanText = response.text ? response.text.trim() : "";
    let data;
    try {
      data = JSON.parse(cleanText);
    } catch (e) {
      console.warn("Gemini didn't return perfect JSON, parsing manually or falling back...", cleanText);
      // fallback in case of string parsing errors
      data = view === "student" ? localMockStudentTips[0] : localMockCookTips;
    }

    res.json({
      success: true,
      source: "gemini-api",
      data: data
    });

  } catch (err: any) {
    console.error("Gemini API Error details:", err);
    // Fallback gracefully to simulated data
    const fallback = view === "student" ? localMockStudentTips[0] : localMockCookTips;
    res.json({
      success: true,
      source: "fallback-error",
      error: err.message || String(err),
      data: fallback
    });
  }
});


// ----- MIDDLEWARE & STATIC ASSSETS SERVING -----

// Vite middleware for development or fallback configuration
if (process.env.NODE_ENV !== "production") {
  (async () => {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Failed to load Vite server middleware:", e);
    }
  })();
} else {
  // Production serving of Vite compiled bundle
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Bind server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SchoolNetZero Backend] running on http://localhost:${PORT}`);
});
