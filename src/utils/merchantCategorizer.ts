export const categorizeTransaction = (merchant: string): string => {
  const merchantLower = merchant.toLowerCase();
  
  // Supermercados y alimentación
  if (merchantLower.match(/mercadona|carrefour|lidl|alcampo|eroski|dia|hipercor|corte ingles|aldi|ahorramas|consum|froiz|gadis|masymas|caprabo|bonpreu|sorli|simply|opencor|vips|gourmet|alimentacion|supermercado|mercado|fruteria|panaderia|carniceria|pescaderia|charcuteria/)) {
    return 'Supermercados y alimentación';
  }
  
  // Cafeterías y restaurantes
  if (merchantLower.match(/restaurante|restaurant|bar |cafe|cafeteria|mcdon|burger|pizza|domino|telepizza|kfc|subway|starbucks|dunkin|foster|vips|ginos|lizarran|rodilla|pans|bocatta|muerde|nostrum|eating|dining|bistro|tavern|grill|bakery|patisserie|boulangerie|macarron|braseria|asador|sidreria|tapas|chiringubar|rest\.|comida|food/)) {
    return 'Cafeterías y restaurantes';
  }
  
  // Gasolina y combustible
  if (merchantLower.match(/repsol|shell|bp|cepsa|galp|petronor|disa|gas|gasolina|petrol|combustible|carburante|repostaje|gasolinera|estacion servicio|fuel/)) {
    return 'Gasolina y combustible';
  }
  
  // Transporte público
  if (merchantLower.match(/metro|renfe|ave|cercanias|rodalies|eusko tren|fgc|tmb|emt|ctm|crtm|guaguas|tram|tranvia|bus |autobus|transport public|abono transport|tarjeta transport|metrobus|app crtm|movilidad/)) {
    return 'Transporte público';
  }
  
  // Peajes
  if (merchantLower.match(/peaje|toll|autopista|autovia|cofiroute|bidegi|arabat|autoroute|aumar|abertis|cintra|ferrovial|ap-|a-\d|autop/)) {
    return 'Peajes';
  }
  
  // Parking y garaje
  if (merchantLower.match(/parking|garaje|garage|aparcamiento|estacionamiento|park\s|saba|empark|bamsa|dornier|apcoa/)) {
    return 'Parking y garaje';
  }
  
  // Taxis y Carsharing
  if (merchantLower.match(/taxi|uber|cabify|blablacar|free2move|emov|car2go|respiro|zity|muving|carsharing|ride/)) {
    return 'Taxis y Carsharing';
  }
  
  // Ropa y complementos
  if (merchantLower.match(/zara|h&m|mango|pull|bershka|stradivarius|massimo|oysho|inditex|primark|corte ingles|moda|ropa|complementos|zapatos|calzado|nike|adidas|levis|uniqlo|desigual|custo|adolfo|springfield|women secret|intimissimi|calzedonia|parfois|accessorize/)) {
    return 'Ropa y complementos';
  }
  
  // Electrónica
  if (merchantLower.match(/media markt|fnac|worten|carrefour tech|amazon.*electronic|apple|samsung|xiaomi|lg|sony|electronica|informatica|moviles|telefono|ordenador|tablet|pc componentes|coolmod|pcbox|xtralife/)) {
    return 'Electrónica';
  }
  
  // Libros, música y videojuegos
  if (merchantLower.match(/spotify|netflix|hbo|disney|amazon prime|apple music|youtube|twitch|steam|playstation|xbox|nintendo|game|fnac.*music|casa del libro|libros|musica|videojuegos|streaming|podcast|audible/)) {
    return 'Libros, música y videojuegos';
  }
  
  // Cine, teatro y espectáculos
  if (merchantLower.match(/cinema|cine|kinepolis|yelmo|palafox|renoir|teatro|concierto|festival|entradas|ticketmaster|atrapalo|entradium|giglon|evento|espectaculo|musical/)) {
    return 'Cine, teatro y espectáculos';
  }
  
  // Deporte y gimnasio
  if (merchantLower.match(/decathlon|sprinter|intersport|forum sport|deporte|gimnasio|gym|fitness|club deportivo|piscina|polideportivo|padel|tennis|golf|running|nike run|adidas|fitbit/)) {
    return 'Deporte y gimnasio';
  }
  
  // Dentista, médico
  if (merchantLower.match(/clinica|clinic|hospital|doctor|medico|dental|dentista|odontologo|farmacia|pharmacy|cruz verde|cinfa|salud|health|consulta medica|centro medico|laboratorio|analisis|radiologia/)) {
    return 'Dentista, médico';
  }
  
  // Belleza, peluquería y perfumería
  if (merchantLower.match(/peluqueria|salon|beauty|perfumeria|sephora|douglas|marionnaud|primor|ici paris|estetica|belleza|cosmetica|spa|masaje|uñas|manicura|barberia/)) {
    return 'Belleza, peluquería y perfumería';
  }
  
  // Hotel y alojamiento
  if (merchantLower.match(/hotel|hostal|parador|booking|airbnb|expedia|kayak|trivago|agoda|alojamiento|hospedaje|pension|apartamento|rural|balneario|resort/)) {
    return 'Hotel y alojamiento';
  }
  
  // Billetes de viaje
  if (merchantLower.match(/iberia|ryanair|vueling|easyjet|air europa|lufthansa|klm|british airways|vuelo|flight|viaje|billete|ticket|skyscanner|edreams/)) {
    return 'Billetes de viaje';
  }
  
  // Decoración y mobiliario
  if (merchantLower.match(/ikea|leroy merlin|aki|bauhaus|brico|bricodepot|conforama|el corte ingles.*hogar|decoracion|muebles|mobiliario|hogar|casa|jardin|bricolaje/)) {
    return 'Decoración y mobiliario';
  }
  
  // Mantenimiento del hogar
  if (merchantLower.match(/ferreteria|fontanero|electricista|pintor|cristaleria|cerrajero|reparacion|mantenimiento|limpieza|servicio tecnico|instalacion|reforma/)) {
    return 'Mantenimiento del hogar';
  }
  
  // Teléfono, TV e internet
  if (merchantLower.match(/vodafone|movistar|orange|yoigo|masmovil|telefonica|jazztel|pepephone|tuenti|lowi|simyo|telecomunicaciones|internet|tv|movil|fibra/)) {
    return 'Teléfono, TV e internet';
  }
  
  // Luz y gas
  if (merchantLower.match(/endesa|iberdrola|fenosa|edp|naturgy|gas natural|holaluz|factor energia|som energia|luz|electricidad|gas|energia|suministro/)) {
    return 'Luz y gas';
  }
  
  // Educación
  if (merchantLower.match(/universidad|university|colegio|school|instituto|educacion|curso|academia|formacion|training|udemy|coursera|edx|biblioteca|libros texto|material escolar/)) {
    return 'Educación';
  }
  
  // Cajeros
  if (merchantLower.match(/cajero|atm|reintegro|cash|efectivo|banco|bbva|santander|caixa|sabadell|bankia|ing|unicaja|cajamar|kutxabank|abanca|liberbank/)) {
    return 'Cajeros';
  }
  
  // Comisiones e intereses
  if (merchantLower.match(/comision|interes|cuota|mantenimiento.*cuenta|tarjeta.*credito.*cuota|banco.*cargo|recargo|penalty/)) {
    return 'Comisiones e intereses';
  }
  
  // Gasto Bizum / Ingreso Bizum (based on amount sign - but we'll default to Gasto for now)
  if (merchantLower.match(/bizum/)) {
    return 'Gasto Bizum';
  }
  
  // Regalos y juguetes
  if (merchantLower.match(/juguetes|toys|jugueteria|regalo|gift|toysrus|imaginarium|poly|dideco|eurekakids/)) {
    return 'Regalos y juguetes';
  }
  
  // Loterías y apuestas
  if (merchantLower.match(/loteria|once|primitiva|euromillon|bonoloto|apuesta|bet|casino|bingo|codere|sportium|pokerstars/)) {
    return 'Loterías y apuestas';
  }
  
  // Seguros (general - could be refined based on context)
  if (merchantLower.match(/seguro|insurance|axa|mapfre|mutua|allianz|zurich|generali|pelayo/)) {
    return 'Otros seguros';
  }
  
  // Ocio y viajes (otros)
  if (merchantLower.match(/parque|museo|zoo|aquarium|ocio|turismo|excursion|actividad|entretenimiento|diversion|atracciones/)) {
    return 'Ocio y viajes (otros)';
  }
  
  // Transferencias
  if (merchantLower.match(/transferencia|transfer|envio dinero|remesa|giro|western union/)) {
    return 'Transferencias';
  }
  
  // Compras online genéricas
  if (merchantLower.match(/amazon|ebay|aliexpress|pccomponentes|mediamarkt|carrefour|el corte ingles|compra|shop|tienda|store/)) {
    return 'Compras (otros)';
  }
  
  // Lavandería (seen in sample data)
  if (merchantLower.match(/laundry|lavanderia|tintoreria|limpieza seco/)) {
    return 'Otros gastos (otros)';
  }
  
  // Default fallback
  return 'Otros gastos (otros)';
};