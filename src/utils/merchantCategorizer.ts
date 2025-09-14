export const categorizeTransaction = (merchant: string): string => {
  const merchantLower = merchant.toLowerCase();
  
  // Food & Dining
  if (merchantLower.match(/restaurant|bar|cafe|mcdon|burger|pizza|food|rest\.|eating|dining|bistro|tavern|grill|bakery|patisserie|boulangerie|supermarket|mercado|carrefour|lidl|alcampo|eroski|dia|hipercor|corte ingles|consumo/)) {
    return 'Food & Dining';
  }
  
  // Transportation
  if (merchantLower.match(/taxi|uber|cabify|metro|bus|train|parking|gasolina|gas|petrol|shell|repsol|bp|cepsa|galp|iberdrola|endesa|transport|renfe|ave|cercanias|blablacar|peaje|toll|autopista/)) {
    return 'Transportation';
  }
  
  // Shopping
  if (merchantLower.match(/amazon|zara|h&m|mango|decathlon|ikea|media markt|fnac|el corte|shopping|tienda|shop|store|mall|centro comercial|primark|inditex|pull|bershka|stradivarius|massimo|oysho/)) {
    return 'Shopping';
  }
  
  // Entertainment
  if (merchantLower.match(/cinema|cine|theater|spotify|netflix|apple|google play|steam|playstation|xbox|concert|festival|disco|club|entertainment|ocio|museo|museum|parque|park/)) {
    return 'Entertainment';
  }
  
  // Health & Medical
  if (merchantLower.match(/farmacia|pharmacy|hospital|clinica|clinic|doctor|medic|dental|optical|salud|health|seguro|insurance|cruz verde|cinfa/)) {
    return 'Health & Medical';
  }
  
  // Travel
  if (merchantLower.match(/hotel|hostal|booking|airbnb|flight|vuelo|iberia|ryanair|vueling|easyjet|travel|viaje|turismo|tourism|agencia viajes|expedia|kayak|skyscanner|avis|hertz|europcar/)) {
    return 'Travel';
  }
  
  // Bills & Utilities
  if (merchantLower.match(/vodafone|movistar|orange|yoigo|masmovil|telefonica|agua|water|luz|electric|gas natural|endesa|iberdrola|fenosa|edp|naturgy|recibo|factura|bill|utility|banco|bank|cajero|atm/)) {
    return 'Bills & Utilities';
  }
  
  // Education
  if (merchantLower.match(/universidad|university|colegio|school|education|curso|course|academia|library|biblioteca|formacion|training|udemy|coursera|edx/)) {
    return 'Education';
  }
  
  // Default category
  return 'Other';
};