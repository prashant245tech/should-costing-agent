// Mock database layer with seeded data
// In production with working Prisma, replace db calls with prisma client

export type SkillLevel = 'entry' | 'intermediate' | 'expert';

export interface MaterialPrice {
  id: string;
  materialName: string;
  pricePerUnit: number;
  unit: string;
  supplier?: string;
  currency: string;
  lastUpdated: Date;
}

export interface LaborRate {
  id: string;
  processType: string;
  region: string;
  hourlyRate: number;
  skillLevel: SkillLevel;
  lastUpdated: Date;
}

export interface HistoricalCost {
  id: string;
  productName: string;
  productDescription: string;
  totalCost: number;
  breakdown: Record<string, unknown>;
  createdAt: Date;
  userId?: string;
}

// ============ SEEDED MATERIAL PRICES ============
const materialPrices: MaterialPrice[] = [
  // Wood materials
  { id: '1', materialName: 'oak wood', pricePerUnit: 12.50, unit: 'board_foot', currency: 'USD', lastUpdated: new Date() },
  { id: '2', materialName: 'pine wood', pricePerUnit: 4.50, unit: 'board_foot', currency: 'USD', lastUpdated: new Date() },
  { id: '3', materialName: 'walnut wood', pricePerUnit: 18.00, unit: 'board_foot', currency: 'USD', lastUpdated: new Date() },
  { id: '4', materialName: 'maple wood', pricePerUnit: 8.50, unit: 'board_foot', currency: 'USD', lastUpdated: new Date() },
  { id: '5', materialName: 'cherry wood', pricePerUnit: 14.00, unit: 'board_foot', currency: 'USD', lastUpdated: new Date() },
  { id: '6', materialName: 'plywood', pricePerUnit: 45.00, unit: 'sheet', currency: 'USD', lastUpdated: new Date() },
  { id: '7', materialName: 'mdf', pricePerUnit: 35.00, unit: 'sheet', currency: 'USD', lastUpdated: new Date() },
  
  // Metals
  { id: '8', materialName: 'steel', pricePerUnit: 0.85, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  { id: '9', materialName: 'aluminum', pricePerUnit: 1.20, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  { id: '10', materialName: 'stainless steel', pricePerUnit: 2.50, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  { id: '11', materialName: 'copper', pricePerUnit: 4.50, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  { id: '12', materialName: 'brass', pricePerUnit: 3.80, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  { id: '13', materialName: 'iron', pricePerUnit: 0.45, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  
  // Plastics
  { id: '14', materialName: 'abs plastic', pricePerUnit: 2.20, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  { id: '15', materialName: 'polycarbonate', pricePerUnit: 3.50, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  { id: '16', materialName: 'acrylic', pricePerUnit: 4.00, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  { id: '17', materialName: 'pvc', pricePerUnit: 1.50, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  { id: '18', materialName: 'hdpe', pricePerUnit: 1.80, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  
  // Textiles
  { id: '19', materialName: 'cotton fabric', pricePerUnit: 8.00, unit: 'yard', currency: 'USD', lastUpdated: new Date() },
  { id: '20', materialName: 'leather', pricePerUnit: 25.00, unit: 'sq_ft', currency: 'USD', lastUpdated: new Date() },
  { id: '21', materialName: 'synthetic leather', pricePerUnit: 12.00, unit: 'sq_ft', currency: 'USD', lastUpdated: new Date() },
  { id: '22', materialName: 'foam padding', pricePerUnit: 3.50, unit: 'sq_ft', currency: 'USD', lastUpdated: new Date() },
  { id: '23', materialName: 'polyester fabric', pricePerUnit: 5.50, unit: 'yard', currency: 'USD', lastUpdated: new Date() },
  
  // Glass & Ceramics
  { id: '24', materialName: 'tempered glass', pricePerUnit: 15.00, unit: 'sq_ft', currency: 'USD', lastUpdated: new Date() },
  { id: '25', materialName: 'standard glass', pricePerUnit: 8.00, unit: 'sq_ft', currency: 'USD', lastUpdated: new Date() },
  { id: '26', materialName: 'ceramic', pricePerUnit: 6.00, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  
  // Hardware & Fasteners
  { id: '27', materialName: 'screws', pricePerUnit: 0.05, unit: 'piece', currency: 'USD', lastUpdated: new Date() },
  { id: '28', materialName: 'bolts', pricePerUnit: 0.15, unit: 'piece', currency: 'USD', lastUpdated: new Date() },
  { id: '29', materialName: 'nails', pricePerUnit: 0.02, unit: 'piece', currency: 'USD', lastUpdated: new Date() },
  { id: '30', materialName: 'hinges', pricePerUnit: 3.50, unit: 'piece', currency: 'USD', lastUpdated: new Date() },
  { id: '31', materialName: 'drawer slides', pricePerUnit: 12.00, unit: 'pair', currency: 'USD', lastUpdated: new Date() },
  { id: '32', materialName: 'handles', pricePerUnit: 5.00, unit: 'piece', currency: 'USD', lastUpdated: new Date() },
  { id: '33', materialName: 'knobs', pricePerUnit: 3.00, unit: 'piece', currency: 'USD', lastUpdated: new Date() },
  
  // Finishes & Coatings
  { id: '34', materialName: 'wood stain', pricePerUnit: 25.00, unit: 'gallon', currency: 'USD', lastUpdated: new Date() },
  { id: '35', materialName: 'polyurethane finish', pricePerUnit: 45.00, unit: 'gallon', currency: 'USD', lastUpdated: new Date() },
  { id: '36', materialName: 'paint', pricePerUnit: 35.00, unit: 'gallon', currency: 'USD', lastUpdated: new Date() },
  { id: '37', materialName: 'lacquer', pricePerUnit: 55.00, unit: 'gallon', currency: 'USD', lastUpdated: new Date() },
  { id: '38', materialName: 'wood glue', pricePerUnit: 15.00, unit: 'gallon', currency: 'USD', lastUpdated: new Date() },
  
  // Electronics components
  { id: '39', materialName: 'led lights', pricePerUnit: 0.50, unit: 'piece', currency: 'USD', lastUpdated: new Date() },
  { id: '40', materialName: 'wiring', pricePerUnit: 0.25, unit: 'foot', currency: 'USD', lastUpdated: new Date() },
  { id: '41', materialName: 'circuit board', pricePerUnit: 15.00, unit: 'piece', currency: 'USD', lastUpdated: new Date() },
  { id: '42', materialName: 'motor', pricePerUnit: 25.00, unit: 'piece', currency: 'USD', lastUpdated: new Date() },
  { id: '43', materialName: 'battery', pricePerUnit: 8.00, unit: 'piece', currency: 'USD', lastUpdated: new Date() },
  
  // Rubber & Foam
  { id: '44', materialName: 'rubber', pricePerUnit: 2.50, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  { id: '45', materialName: 'silicone', pricePerUnit: 8.00, unit: 'lb', currency: 'USD', lastUpdated: new Date() },
  { id: '46', materialName: 'memory foam', pricePerUnit: 5.00, unit: 'sq_ft', currency: 'USD', lastUpdated: new Date() },
  
  // Concrete & Stone
  { id: '47', materialName: 'concrete', pricePerUnit: 120.00, unit: 'cubic_yard', currency: 'USD', lastUpdated: new Date() },
  { id: '48', materialName: 'marble', pricePerUnit: 75.00, unit: 'sq_ft', currency: 'USD', lastUpdated: new Date() },
  { id: '49', materialName: 'granite', pricePerUnit: 60.00, unit: 'sq_ft', currency: 'USD', lastUpdated: new Date() },
  { id: '50', materialName: 'quartz', pricePerUnit: 70.00, unit: 'sq_ft', currency: 'USD', lastUpdated: new Date() },
];

// ============ SEEDED LABOR RATES ============
const laborRates: LaborRate[] = [
  // Assembly
  { id: '1', processType: 'assembly', region: 'US', hourlyRate: 25.00, skillLevel: 'entry', lastUpdated: new Date() },
  { id: '2', processType: 'assembly', region: 'US', hourlyRate: 35.00, skillLevel: 'intermediate', lastUpdated: new Date() },
  { id: '3', processType: 'assembly', region: 'US', hourlyRate: 50.00, skillLevel: 'expert', lastUpdated: new Date() },
  
  // Welding
  { id: '4', processType: 'welding', region: 'US', hourlyRate: 35.00, skillLevel: 'entry', lastUpdated: new Date() },
  { id: '5', processType: 'welding', region: 'US', hourlyRate: 50.00, skillLevel: 'intermediate', lastUpdated: new Date() },
  { id: '6', processType: 'welding', region: 'US', hourlyRate: 75.00, skillLevel: 'expert', lastUpdated: new Date() },
  
  // Machining
  { id: '7', processType: 'machining', region: 'US', hourlyRate: 40.00, skillLevel: 'entry', lastUpdated: new Date() },
  { id: '8', processType: 'machining', region: 'US', hourlyRate: 60.00, skillLevel: 'intermediate', lastUpdated: new Date() },
  { id: '9', processType: 'machining', region: 'US', hourlyRate: 85.00, skillLevel: 'expert', lastUpdated: new Date() },
  
  // Woodworking
  { id: '10', processType: 'woodworking', region: 'US', hourlyRate: 30.00, skillLevel: 'entry', lastUpdated: new Date() },
  { id: '11', processType: 'woodworking', region: 'US', hourlyRate: 45.00, skillLevel: 'intermediate', lastUpdated: new Date() },
  { id: '12', processType: 'woodworking', region: 'US', hourlyRate: 65.00, skillLevel: 'expert', lastUpdated: new Date() },
  
  // Finishing
  { id: '13', processType: 'finishing', region: 'US', hourlyRate: 25.00, skillLevel: 'entry', lastUpdated: new Date() },
  { id: '14', processType: 'finishing', region: 'US', hourlyRate: 35.00, skillLevel: 'intermediate', lastUpdated: new Date() },
  { id: '15', processType: 'finishing', region: 'US', hourlyRate: 50.00, skillLevel: 'expert', lastUpdated: new Date() },
  
  // Upholstery
  { id: '16', processType: 'upholstery', region: 'US', hourlyRate: 28.00, skillLevel: 'entry', lastUpdated: new Date() },
  { id: '17', processType: 'upholstery', region: 'US', hourlyRate: 40.00, skillLevel: 'intermediate', lastUpdated: new Date() },
  { id: '18', processType: 'upholstery', region: 'US', hourlyRate: 55.00, skillLevel: 'expert', lastUpdated: new Date() },
  
  // Electronics Assembly
  { id: '19', processType: 'electronics_assembly', region: 'US', hourlyRate: 30.00, skillLevel: 'entry', lastUpdated: new Date() },
  { id: '20', processType: 'electronics_assembly', region: 'US', hourlyRate: 45.00, skillLevel: 'intermediate', lastUpdated: new Date() },
  { id: '21', processType: 'electronics_assembly', region: 'US', hourlyRate: 70.00, skillLevel: 'expert', lastUpdated: new Date() },
  
  // Painting
  { id: '22', processType: 'painting', region: 'US', hourlyRate: 22.00, skillLevel: 'entry', lastUpdated: new Date() },
  { id: '23', processType: 'painting', region: 'US', hourlyRate: 32.00, skillLevel: 'intermediate', lastUpdated: new Date() },
  { id: '24', processType: 'painting', region: 'US', hourlyRate: 45.00, skillLevel: 'expert', lastUpdated: new Date() },
  
  // Quality Control
  { id: '25', processType: 'quality_control', region: 'US', hourlyRate: 28.00, skillLevel: 'entry', lastUpdated: new Date() },
  { id: '26', processType: 'quality_control', region: 'US', hourlyRate: 40.00, skillLevel: 'intermediate', lastUpdated: new Date() },
  { id: '27', processType: 'quality_control', region: 'US', hourlyRate: 55.00, skillLevel: 'expert', lastUpdated: new Date() },
  
  // Packaging
  { id: '28', processType: 'packaging', region: 'US', hourlyRate: 18.00, skillLevel: 'entry', lastUpdated: new Date() },
  { id: '29', processType: 'packaging', region: 'US', hourlyRate: 24.00, skillLevel: 'intermediate', lastUpdated: new Date() },
  { id: '30', processType: 'packaging', region: 'US', hourlyRate: 32.00, skillLevel: 'expert', lastUpdated: new Date() },
];

// ============ SEEDED HISTORICAL COSTS ============
const historicalCosts: HistoricalCost[] = [
  {
    id: '1',
    productName: 'Wooden Dining Table',
    productDescription: '6-foot oak dining table with 4 legs, seats 6 people',
    totalCost: 697.00,
    breakdown: {
      materials: { oak_tabletop: 150, legs: 60, hardware: 25, finish: 30 },
      labor: { manufacturing: 280, assembly: 50 },
      overhead: 102
    },
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    productName: 'Office Chair',
    productDescription: 'Ergonomic office chair with mesh back, adjustable height, armrests',
    totalCost: 285.00,
    breakdown: {
      materials: { frame: 45, mesh: 35, foam: 25, wheels: 20, hardware: 15 },
      labor: { manufacturing: 60, assembly: 30 },
      overhead: 55
    },
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    productName: 'Bookshelf',
    productDescription: '5-shelf walnut bookshelf, 72 inches tall, 36 inches wide',
    totalCost: 425.00,
    breakdown: {
      materials: { walnut_boards: 180, hardware: 20, finish: 25 },
      labor: { manufacturing: 100, assembly: 40 },
      overhead: 60
    },
    createdAt: new Date('2024-03-10'),
  },
  {
    id: '4',
    productName: 'Coffee Table',
    productDescription: 'Modern coffee table with tempered glass top and steel frame',
    totalCost: 320.00,
    breakdown: {
      materials: { tempered_glass: 75, steel_frame: 65, hardware: 15 },
      labor: { manufacturing: 80, assembly: 35 },
      overhead: 50
    },
    createdAt: new Date('2024-04-05'),
  },
  {
    id: '5',
    productName: 'Kitchen Cabinet Set',
    productDescription: 'Set of 10 maple kitchen cabinets with soft-close hinges',
    totalCost: 2850.00,
    breakdown: {
      materials: { maple_boards: 800, hinges: 150, handles: 100, hardware: 200, finish: 150 },
      labor: { manufacturing: 650, assembly: 300, installation: 200 },
      overhead: 300
    },
    createdAt: new Date('2024-05-12'),
  },
];

// ============ DATABASE QUERY FUNCTIONS ============

export function findMaterialPrice(materialName: string): MaterialPrice | undefined {
  const searchTerm = materialName.toLowerCase().trim();
  return materialPrices.find(m => 
    m.materialName.toLowerCase().includes(searchTerm) ||
    searchTerm.includes(m.materialName.toLowerCase())
  );
}

export function findAllMaterialPrices(): MaterialPrice[] {
  return materialPrices;
}

export function findLaborRate(processType: string, skillLevel: SkillLevel = 'intermediate', region: string = 'US'): LaborRate | undefined {
  const searchTerm = processType.toLowerCase().trim();
  return laborRates.find(l => 
    l.processType.toLowerCase().includes(searchTerm) &&
    l.skillLevel === skillLevel &&
    l.region === region
  );
}

export function findAllLaborRates(): LaborRate[] {
  return laborRates;
}

export function searchSimilarProducts(description: string): HistoricalCost[] {
  const searchTerms = description.toLowerCase().split(' ');
  return historicalCosts.filter(h => {
    const productText = `${h.productName} ${h.productDescription}`.toLowerCase();
    return searchTerms.some(term => productText.includes(term));
  });
}

export function findAllHistoricalCosts(): HistoricalCost[] {
  return historicalCosts;
}

export function saveHistoricalCost(cost: Omit<HistoricalCost, 'id' | 'createdAt'>): HistoricalCost {
  const newCost: HistoricalCost = {
    ...cost,
    id: String(historicalCosts.length + 1),
    createdAt: new Date(),
  };
  historicalCosts.push(newCost);
  return newCost;
}

// Export all data for direct access if needed
export const db = {
  materialPrices,
  laborRates,
  historicalCosts,
  findMaterialPrice,
  findAllMaterialPrices,
  findLaborRate,
  findAllLaborRates,
  searchSimilarProducts,
  findAllHistoricalCosts,
  saveHistoricalCost,
};

export default db;
