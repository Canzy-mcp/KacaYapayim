import type { ProfessionCost, ProfessionField, ProfessionFormula, ProfessionTemplate } from "./schema.ts";

const number = (key: string, label: string, section: string, sortOrder: number, defaultValue = 0, unit?: string): ProfessionField =>
  ({ key, label, section, sortOrder, fieldType: "number", defaultValue, minValue: 0, maxValue: 100000, unit });
const integer = (key: string, label: string, section: string, sortOrder: number, defaultValue = 0): ProfessionField =>
  ({ key, label, section, sortOrder, fieldType: "integer", defaultValue, minValue: 0, maxValue: 1000 });
const toggle = (key: string, label: string, section: string, sortOrder: number, defaultValue = false): ProfessionField =>
  ({ key, label, section, sortOrder, fieldType: "toggle", defaultValue });
const cost = (key: string, name: string, category: ProfessionCost["category"], unit: ProfessionCost["unit"], defaultValue: number, sortOrder: number): ProfessionCost =>
  ({ key, name, category, unit, defaultValue, sortOrder });
const formula = (key: string, name: string, expression: string, sortOrder: number,
  costTemplateKey?: string, quantityExpression?: string, condition?: ProfessionFormula["condition"]): ProfessionFormula =>
  ({ key, name, expression, sortOrder, formulaType: costTemplateKey ? "cost" : "quantity", costTemplateKey, quantityExpression, condition });
const positive = (field: string) => ({ field, operator: "greater_than" as const, value: 0 });
const yes = (field: string) => ({ field, operator: "is_true" as const });

export const painterTemplate: ProfessionTemplate = {
  slug: "painter", name: "Boyacı", description: "İç ve dış cephe boya işleri", icon: "paintbrush", category: "construction", version: 1,
  sections: [
    { key: "surface", title: "Alanlar", sortOrder: 10 }, { key: "application", title: "Uygulamalar", sortOrder: 20 },
    { key: "labor", title: "İşçilik", sortOrder: 30 }, { key: "extras", title: "Ek Giderler", sortOrder: 40 },
  ],
  fields: [
    { ...number("wall_area", "Duvar Alanı", "surface", 10, 0, "m²"), required: true },
    number("ceiling_area", "Tavan Alanı", "surface", 20, 0, "m²"),
    { ...integer("wall_coats", "Duvar Kat Sayısı", "application", 10, 2), minValue: 1, maxValue: 10 },
    { ...integer("ceiling_coats", "Tavan Kat Sayısı", "application", 20, 2), minValue: 1, maxValue: 10, visibilityCondition: positive("ceiling_area") },
    toggle("primer_required", "Astar Uygulanacak mı?", "application", 30),
    { ...integer("primer_coats", "Astar Kat Sayısı", "application", 40, 1), minValue: 1, maxValue: 10, visibilityCondition: yes("primer_required") },
    toggle("putty_required", "Macun Uygulanacak mı?", "application", 50),
    { ...number("putty_area", "Macun Alanı", "application", 60, 0, "m²"), visibilityCondition: yes("putty_required") },
    { ...number("days", "İş Süresi", "labor", 10, 3, "gün"), required: true, minValue: 0.01, maxValue: 365 },
    integer("master_count", "Usta Sayısı", "labor", 20, 1), integer("helper_count", "Yardımcı Sayısı", "labor", 30, 0),
    toggle("include_consumables", "Sarf Malzemeleri", "extras", 10, true), toggle("include_transport", "Yol / Araç", "extras", 20, true),
    { ...number("waste_percentage", "Fire Payı", "extras", 30, 10, "%"), fieldType: "percentage", maxValue: 100 },
    { key: "notes", label: "İş Notları", section: "extras", sortOrder: 40, fieldType: "textarea", defaultValue: "" },
  ],
  validations: [
    { key: "area_required", message: "Duvar veya tavan alanından en az birini gir.", expression: "field.wall_area + field.ceiling_area" },
    { key: "primer_wall_required", message: "Astar için duvar alanı gir.", expression: "field.wall_area", condition: yes("primer_required") },
    { key: "putty_wall_required", message: "Macun için duvar alanı gir.", expression: "field.wall_area", condition: yes("putty_required") },
    { key: "putty_area_required", message: "Macun uygulanacak alanı gir.", expression: "field.putty_area", condition: yes("putty_required") },
  ],
  settings: [
    { key: "paint_coverage_per_liter", name: "Boya Örtücülüğü", defaultValue: 10, minValue: 0.01, maxValue: 1000, unit: "m²/L" },
    { key: "primer_coverage_per_liter", name: "Astar Örtücülüğü", defaultValue: 10, minValue: 0.01, maxValue: 1000, unit: "m²/L" },
    { key: "ceiling_paint_coverage_per_liter", name: "Tavan Boyası Örtücülüğü", defaultValue: 10, minValue: 0.01, maxValue: 1000, unit: "m²/L" },
    { key: "putty_kg_per_square_meter", name: "Macun Tüketimi", defaultValue: 1, minValue: 0.01, maxValue: 1000, unit: "kg/m²" },
  ],
  costs: [
    cost("interior_paint", "İç Cephe Boyası", "material", "liter", 450, 10),
    cost("primer", "Astar", "material", "liter", 300, 20),
    cost("ceiling_paint", "Tavan Boyası", "material", "liter", 350, 30),
    cost("putty", "Macun", "material", "kilogram", 60, 40),
    cost("master_labor", "Usta", "labor", "day", 3000, 50),
    cost("helper_labor", "Yardımcı", "labor", "day", 1800, 60),
    cost("consumables", "Sarf Malzemeleri", "consumable", "fixed", 750, 70),
    cost("transport", "Yol / Araç", "transport", "fixed", 800, 80),
  ],
  formulas: [
    formula("paint_quantity", "Duvar boyası miktarı", "round(field.wall_area * field.wall_coats / setting.paint_coverage_per_liter * (1 + field.waste_percentage / 100) * 10000) / 10000", 10, undefined, undefined, positive("wall_area")),
    formula("paint_cost", "Duvar boyası maliyeti", "result.paint_quantity * cost.interior_paint", 20, "interior_paint", "result.paint_quantity", positive("wall_area")),
    formula("primer_quantity", "Astar miktarı", "round(field.wall_area * field.primer_coats / setting.primer_coverage_per_liter * (1 + field.waste_percentage / 100) * 10000) / 10000", 30, undefined, undefined, yes("primer_required")),
    formula("primer_cost", "Astar maliyeti", "result.primer_quantity * cost.primer", 40, "primer", "result.primer_quantity", yes("primer_required")),
    formula("ceiling_quantity", "Tavan boyası miktarı", "round(field.ceiling_area * field.ceiling_coats / setting.ceiling_paint_coverage_per_liter * (1 + field.waste_percentage / 100) * 10000) / 10000", 50, undefined, undefined, positive("ceiling_area")),
    formula("ceiling_cost", "Tavan boyası maliyeti", "result.ceiling_quantity * cost.ceiling_paint", 60, "ceiling_paint", "result.ceiling_quantity", positive("ceiling_area")),
    formula("putty_quantity", "Macun miktarı", "round(field.putty_area * setting.putty_kg_per_square_meter * (1 + field.waste_percentage / 100) * 10000) / 10000", 70, undefined, undefined, yes("putty_required")),
    formula("putty_cost", "Macun maliyeti", "result.putty_quantity * cost.putty", 80, "putty", "result.putty_quantity", yes("putty_required")),
    formula("master_cost", "Usta işçiliği", "field.master_count * field.days * cost.master_labor", 90, "master_labor", "field.master_count * field.days", positive("master_count")),
    formula("helper_cost", "Yardımcı işçiliği", "field.helper_count * field.days * cost.helper_labor", 100, "helper_labor", "field.helper_count * field.days", positive("helper_count")),
    formula("consumables_cost", "Sarf malzemeleri", "cost.consumables", 110, "consumables", "1", yes("include_consumables")),
    formula("transport_cost", "Yol / araç", "cost.transport", 120, "transport", "1", yes("include_transport")),
  ],
  quoteItems: [
    { key: "surface_prep", name: "Duvar yüzey hazırlığı", description: "Uygulama öncesi temel yüzey hazırlığı.", condition: positive("wall_area"), sortOrder: 10 },
    { key: "putty", name: "Gerekli alanlarda macun uygulaması", condition: yes("putty_required"), sortOrder: 20 },
    { key: "primer", name: "kat astar uygulaması", nameFieldSuffix: "primer_coats", condition: yes("primer_required"), sortOrder: 30 },
    { key: "wall_paint", name: "kat iç cephe boya uygulaması", nameFieldSuffix: "wall_coats", condition: positive("wall_area"), sortOrder: 40 },
    { key: "ceiling_paint", name: "kat tavan boyası", nameFieldSuffix: "ceiling_coats", condition: positive("ceiling_area"), sortOrder: 50 },
    { key: "labor", name: "İşçilik", condition: positive("master_count"), sortOrder: 60 },
    { key: "consumables", name: "Temel sarf malzemeleri", condition: yes("include_consumables"), sortOrder: 70 },
  ],
  quoteExclusions: ["Mobilya taşıma", "Elektrik ve tesisat onarımları", "Büyük yüzey tamiratları", "Özel iskele veya vinç işleri"],
};

export const electricianTemplate: ProfessionTemplate = {
  slug: "electrician", name: "Elektrikçi", description: "Elektrik tesisatı ve montaj işleri", icon: "zap", category: "technical", version: 1,
  sections: [{ key: "installation", title: "Tesisat", sortOrder: 10 }, { key: "labor", title: "İşçilik", sortOrder: 20 }, { key: "extras", title: "Ek Giderler", sortOrder: 30 }],
  fields: [
    integer("socket_count", "Priz Sayısı", "installation", 10), integer("switch_count", "Anahtar Sayısı", "installation", 20),
    number("cable_2_5_length", "2,5 mm Kablo", "installation", 30, 0, "m"), number("cable_4_length", "4 mm Kablo", "installation", 40, 0, "m"),
    integer("breaker_count", "Sigorta Sayısı", "installation", 50), integer("junction_box_count", "Buat Sayısı", "installation", 60),
    { ...number("days", "İş Süresi", "labor", 10, 1, "gün"), required: true, minValue: 0.01, maxValue: 365 },
    integer("electrician_count", "Elektrikçi Sayısı", "labor", 20, 1), integer("helper_count", "Yardımcı Sayısı", "labor", 30),
    toggle("include_transport", "Yol / Araç", "extras", 10, true), toggle("include_consumables", "Sarf Malzemeleri", "extras", 20, true),
  ],
  settings: [{ key: "cable_waste_percentage", name: "Kablo Fire Payı", defaultValue: 5, minValue: 0, maxValue: 100, unit: "%" }],
  costs: [
    cost("socket", "Priz", "material", "piece", 250, 10), cost("switch", "Anahtar", "material", "piece", 180, 20),
    cost("cable_2_5", "2,5 mm Kablo", "material", "meter", 18, 30), cost("cable_4", "4 mm Kablo", "material", "meter", 32, 40),
    cost("breaker", "Sigorta", "material", "piece", 320, 50), cost("junction_box", "Buat", "material", "piece", 65, 60),
    cost("electrician_labor", "Elektrikçi", "labor", "day", 3000, 70), cost("helper_labor", "Yardımcı", "labor", "day", 1800, 80),
    cost("consumables", "Sarf Malzemeleri", "consumable", "fixed", 450, 90), cost("transport", "Yol / Araç", "transport", "fixed", 800, 100),
  ],
  formulas: [
    formula("socket_cost", "Priz maliyeti", "field.socket_count * cost.socket", 10, "socket", "field.socket_count", positive("socket_count")),
    formula("switch_cost", "Anahtar maliyeti", "field.switch_count * cost.switch", 20, "switch", "field.switch_count", positive("switch_count")),
    formula("cable_2_5_qty", "2,5 mm kablo miktarı", "round(field.cable_2_5_length * (1 + setting.cable_waste_percentage / 100) * 10000) / 10000", 30, undefined, undefined, positive("cable_2_5_length")),
    formula("cable_2_5_cost", "2,5 mm kablo maliyeti", "result.cable_2_5_qty * cost.cable_2_5", 40, "cable_2_5", "result.cable_2_5_qty", positive("cable_2_5_length")),
    formula("cable_4_qty", "4 mm kablo miktarı", "round(field.cable_4_length * (1 + setting.cable_waste_percentage / 100) * 10000) / 10000", 50, undefined, undefined, positive("cable_4_length")),
    formula("cable_4_cost", "4 mm kablo maliyeti", "result.cable_4_qty * cost.cable_4", 60, "cable_4", "result.cable_4_qty", positive("cable_4_length")),
    formula("breaker_cost", "Sigorta maliyeti", "field.breaker_count * cost.breaker", 70, "breaker", "field.breaker_count", positive("breaker_count")),
    formula("junction_cost", "Buat maliyeti", "field.junction_box_count * cost.junction_box", 80, "junction_box", "field.junction_box_count", positive("junction_box_count")),
    formula("electrician_cost", "Elektrikçi işçiliği", "field.electrician_count * field.days * cost.electrician_labor", 90, "electrician_labor", "field.electrician_count * field.days", positive("electrician_count")),
    formula("helper_cost", "Yardımcı işçiliği", "field.helper_count * field.days * cost.helper_labor", 100, "helper_labor", "field.helper_count * field.days", positive("helper_count")),
    formula("consumables_cost", "Sarf malzemeleri", "cost.consumables", 110, "consumables", "1", yes("include_consumables")),
    formula("transport_cost", "Yol / araç", "cost.transport", 120, "transport", "1", yes("include_transport")),
  ],
  quoteItems: [
    { key: "sockets", name: "Priz montajı", condition: positive("socket_count"), sortOrder: 10 },
    { key: "switches", name: "Anahtar montajı", condition: positive("switch_count"), sortOrder: 20 },
    { key: "cabling", name: "Elektrik kablolama", condition: positive("cable_2_5_length"), sortOrder: 30 },
    { key: "breakers", name: "Sigorta montajı", condition: positive("breaker_count"), sortOrder: 40 },
    { key: "labor", name: "Montaj ve işçilik", sortOrder: 50 },
  ],
  quoteExclusions: ["Duvar sıva ve boya onarımı", "Malzeme dışı ilave işler"],
};

export const plumberTemplate: ProfessionTemplate = {
  slug: "plumber", name: "Tesisatçı", description: "Su tesisatı ve armatür montajı", icon: "wrench", category: "technical", version: 1,
  sections: [{ key: "installation", title: "Tesisat", sortOrder: 10 }, { key: "labor", title: "İşçilik", sortOrder: 20 }, { key: "extras", title: "Ek Giderler", sortOrder: 30 }],
  fields: [
    number("pipe_length", "Boru Uzunluğu", "installation", 10, 0, "m"), integer("fitting_count", "Bağlantı Parçası", "installation", 20),
    integer("faucet_count", "Musluk / Armatür", "installation", 30), toggle("leak_test", "Kaçak Testi", "installation", 40, true),
    { ...number("days", "İş Süresi", "labor", 10, 1, "gün"), required: true, minValue: 0.01, maxValue: 365 },
    integer("plumber_count", "Tesisatçı Sayısı", "labor", 20, 1), integer("helper_count", "Yardımcı Sayısı", "labor", 30),
    toggle("include_transport", "Yol / Araç", "extras", 10, true),
  ],
  settings: [{ key: "pipe_waste_percentage", name: "Boru Fire Payı", defaultValue: 5, minValue: 0, maxValue: 100, unit: "%" }],
  costs: [
    cost("pipe", "Boru", "material", "meter", 95, 10), cost("fitting", "Bağlantı Parçası", "material", "piece", 45, 20),
    cost("faucet", "Musluk / Armatür", "material", "piece", 650, 30), cost("leak_test", "Kaçak Testi", "other", "fixed", 450, 40),
    cost("plumber_labor", "Tesisatçı", "labor", "day", 3000, 50), cost("helper_labor", "Yardımcı", "labor", "day", 1800, 60),
    cost("transport", "Yol / Araç", "transport", "fixed", 800, 70),
  ],
  formulas: [
    formula("pipe_qty", "Boru miktarı", "round(field.pipe_length * (1 + setting.pipe_waste_percentage / 100) * 10000) / 10000", 10, undefined, undefined, positive("pipe_length")),
    formula("pipe_cost", "Boru maliyeti", "result.pipe_qty * cost.pipe", 20, "pipe", "result.pipe_qty", positive("pipe_length")),
    formula("fitting_cost", "Bağlantı parçası maliyeti", "field.fitting_count * cost.fitting", 30, "fitting", "field.fitting_count", positive("fitting_count")),
    formula("faucet_cost", "Armatür maliyeti", "field.faucet_count * cost.faucet", 40, "faucet", "field.faucet_count", positive("faucet_count")),
    formula("leak_test_cost", "Kaçak testi", "cost.leak_test", 50, "leak_test", "1", yes("leak_test")),
    formula("plumber_cost", "Tesisatçı işçiliği", "field.plumber_count * field.days * cost.plumber_labor", 60, "plumber_labor", "field.plumber_count * field.days", positive("plumber_count")),
    formula("helper_cost", "Yardımcı işçiliği", "field.helper_count * field.days * cost.helper_labor", 70, "helper_labor", "field.helper_count * field.days", positive("helper_count")),
    formula("transport_cost", "Yol / araç", "cost.transport", 80, "transport", "1", yes("include_transport")),
  ],
  quoteItems: [
    { key: "pipes", name: "Su borusu döşeme", condition: positive("pipe_length"), sortOrder: 10 },
    { key: "fittings", name: "Bağlantı parçalarının montajı", condition: positive("fitting_count"), sortOrder: 20 },
    { key: "faucets", name: "Armatür montajı", condition: positive("faucet_count"), sortOrder: 30 },
    { key: "leak", name: "Kaçak testi", condition: yes("leak_test"), sortOrder: 40 },
    { key: "labor", name: "Tesisat işçiliği", sortOrder: 50 },
  ], quoteExclusions: ["Fayans ve boya onarımı", "Kırma sonrası moloz taşıma"],
};

export const hvacTemplate: ProfessionTemplate = {
  slug: "hvac", name: "Klimacı", description: "Klima montajı ve bağlantı işleri", icon: "wind", category: "technical", version: 1,
  sections: [{ key: "unit", title: "Klima Bilgileri", sortOrder: 10 }, { key: "installation", title: "Montaj", sortOrder: 20 },
    { key: "electrical", title: "Elektrik", sortOrder: 30 }, { key: "labor", title: "İşçilik", sortOrder: 40 }],
  fields: [
    { ...integer("btu", "Klima Kapasitesi", "unit", 10, 12000), minValue: 3000, maxValue: 100000, unit: "BTU" },
    number("pipe_length", "Bakır Boru Uzunluğu", "installation", 10, 0, "m"),
    integer("wall_holes", "Duvar Delme Sayısı", "installation", 20),
    integer("installation_floor", "Montaj Katı", "installation", 30),
    toggle("difficult_access", "Dış Ünite Erişimi Zor", "installation", 40),
    toggle("electrical_line", "Yeni Elektrik Hattı", "electrical", 10),
    { ...number("electrical_line_length", "Hat Uzunluğu", "electrical", 20, 0, "m"), visibilityCondition: yes("electrical_line") },
    { ...number("days", "İş Süresi", "labor", 10, 1, "gün"), required: true, minValue: 0.01, maxValue: 365 },
    integer("technician_count", "Teknisyen Sayısı", "labor", 20, 1), toggle("include_transport", "Yol / Araç", "labor", 30, true),
  ],
  settings: [{ key: "standard_pipe_included", name: "Standart Dahil Boru", defaultValue: 0, minValue: 0, maxValue: 100, unit: "m" }],
  costs: [
    cost("copper_pipe", "Bakır Boru", "material", "meter", 450, 10), cost("wall_drilling", "Duvar Delme", "other", "piece", 350, 20),
    cost("electrical_cable", "Elektrik Kablosu", "material", "meter", 75, 30), cost("technician_labor", "Teknisyen", "labor", "day", 3500, 40),
    cost("difficult_access", "Zorlu Erişim", "other", "fixed", 1200, 50), cost("transport", "Yol / Araç", "transport", "fixed", 800, 60),
  ],
  formulas: [
    formula("billable_pipe", "Faturalandırılan boru", "max(0, field.pipe_length - setting.standard_pipe_included)", 10, undefined, undefined, positive("pipe_length")),
    formula("pipe_cost", "Bakır boru maliyeti", "result.billable_pipe * cost.copper_pipe", 20, "copper_pipe", "result.billable_pipe", positive("pipe_length")),
    formula("drilling_cost", "Duvar delme maliyeti", "field.wall_holes * cost.wall_drilling", 30, "wall_drilling", "field.wall_holes", positive("wall_holes")),
    formula("electrical_cost", "Elektrik hattı maliyeti", "field.electrical_line_length * cost.electrical_cable", 40, "electrical_cable", "field.electrical_line_length", yes("electrical_line")),
    formula("technician_cost", "Teknisyen işçiliği", "field.technician_count * field.days * cost.technician_labor", 50, "technician_labor", "field.technician_count * field.days", positive("technician_count")),
    formula("access_cost", "Zorlu erişim", "cost.difficult_access", 60, "difficult_access", "1", yes("difficult_access")),
    formula("transport_cost", "Yol / araç", "cost.transport", 70, "transport", "1", yes("include_transport")),
  ],
  quoteItems: [
    { key: "unit_mount", name: "İç ve dış ünite montajı", sortOrder: 10 },
    { key: "piping", name: "Bakır boru bağlantısı", condition: positive("pipe_length"), sortOrder: 20 },
    { key: "drilling", name: "Duvar delme", condition: positive("wall_holes"), sortOrder: 30 },
    { key: "electrical", name: "Elektrik hattı çekimi", condition: yes("electrical_line"), sortOrder: 40 },
    { key: "commission", name: "Çalıştırma ve kontrol", sortOrder: 50 },
  ], quoteExclusions: ["Cihaz bedeli", "İskele veya vinç hizmeti"],
};

export const builtInTemplates = [painterTemplate, electricianTemplate, plumberTemplate, hvacTemplate];
