-- Seed initial FAQ data for Neumáticos del Valle
INSERT INTO faq_items (question, answer, category, tags) VALUES
-- General Questions
('¿Qué tipos de neumáticos venden?',
 'En Neumáticos del Valle ofrecemos una amplia variedad de neumáticos para automóviles, camionetas, SUVs y vehículos comerciales. Trabajamos con las mejores marcas del mercado como Bridgestone, Michelin, Pirelli, Goodyear, Fate y Firestone. Disponemos de neumáticos para todas las temporadas, incluyendo modelos específicos para verano, invierno y all-season.',
 'General',
 ARRAY['productos', 'marcas', 'tipos']),

('¿Dónde están ubicados?',
 'Nuestra tienda principal está ubicada en el Valle de Uco, Mendoza. Ofrecemos servicio de instalación en nuestro taller y también realizamos envíos a todo el país. Para coordinar una visita o consultar por envíos, contáctenos a través de WhatsApp o teléfono.',
 'General',
 ARRAY['ubicación', 'contacto', 'tienda']),

('¿Cuáles son los horarios de atención?',
 'Atendemos de lunes a viernes de 8:30 a 18:30 hs y sábados de 9:00 a 13:00 hs. Los domingos y feriados permanecemos cerrados. Recomendamos agendar un turno para la instalación de neumáticos para evitar demoras.',
 'General',
 ARRAY['horarios', 'atención', 'turnos']),

-- Technical Questions
('¿Cómo sé qué medida de neumático necesita mi vehículo?',
 'La medida de los neumáticos está indicada en el manual del propietario de su vehículo y también en una etiqueta ubicada generalmente en el marco de la puerta del conductor. La medida se expresa con tres números, por ejemplo: 205/55R16, donde 205 es el ancho en milímetros, 55 es el perfil (altura como porcentaje del ancho) y 16 es el diámetro de la llanta en pulgadas.',
 'Técnico',
 ARRAY['medidas', 'tamaño', 'especificaciones']),

('¿Qué significa el código en el costado del neumático?',
 'El código del costado contiene información importante: La medida (ej: 205/55R16), el índice de carga (peso máximo que soporta), el índice de velocidad (velocidad máxima segura), la fecha de fabricación (semana y año), y el tipo de construcción (R para radial). También encontrará información sobre presión máxima y certificaciones de seguridad.',
 'Técnico',
 ARRAY['código', 'especificaciones', 'nomenclatura']),

('¿Cuál es la presión correcta para mis neumáticos?',
 'La presión correcta varía según el vehículo y está especificada en el manual del propietario y en una etiqueta en el marco de la puerta del conductor. Generalmente oscila entre 30 y 35 PSI para autos de pasajeros. Es importante verificar la presión al menos una vez al mes con los neumáticos fríos, ya que una presión incorrecta afecta el desgaste, consumo de combustible y seguridad.',
 'Técnico',
 ARRAY['presión', 'mantenimiento', 'seguridad']),

('¿Cada cuánto debo rotar los neumáticos?',
 'Se recomienda rotar los neumáticos cada 10.000 a 12.000 kilómetros para asegurar un desgaste uniforme. La rotación consiste en cambiar la posición de los neumáticos (delanteros hacia atrás y viceversa) siguiendo el patrón recomendado para su tipo de vehículo (tracción delantera, trasera o integral).',
 'Técnico',
 ARRAY['rotación', 'mantenimiento', 'desgaste']),

-- Purchase and Service Questions
('¿Ofrecen servicio de instalación?',
 'Sí, ofrecemos servicio completo de instalación que incluye: montaje de neumáticos, balanceo computarizado, alineación (servicio adicional), válvulas nuevas cuando es necesario, y disposición responsable de los neumáticos viejos. El servicio de instalación tiene un costo adicional que varía según el tipo de vehículo.',
 'Servicios',
 ARRAY['instalación', 'montaje', 'balanceo']),

('¿Realizan alineación y balanceo?',
 'Sí, realizamos ambos servicios con equipamiento de última generación. El balanceo se incluye con la instalación de neumáticos nuevos. La alineación es un servicio adicional altamente recomendado para prevenir desgaste irregular y mejorar el manejo del vehículo. Recomendamos realizar la alineación al instalar neumáticos nuevos o cada 20.000 km.',
 'Servicios',
 ARRAY['alineación', 'balanceo', 'servicios']),

('¿Qué formas de pago aceptan?',
 'Aceptamos efectivo, débito, crédito (Visa, Mastercard, American Express), transferencia bancaria y MercadoPago. Ofrecemos planes de financiación con tarjetas de crédito según las promociones vigentes de cada banco. Consulte por descuentos especiales para pagos en efectivo.',
 'Compras',
 ARRAY['pagos', 'financiación', 'tarjetas']),

('¿Hacen envíos a domicilio?',
 'Sí, realizamos envíos a todo el país. El costo del envío varía según la cantidad de neumáticos y la ubicación de destino. Para compras de 4 neumáticos o más, ofrecemos descuentos especiales en el envío. Los neumáticos se envían por transporte especializado para garantizar que lleguen en perfectas condiciones.',
 'Compras',
 ARRAY['envíos', 'delivery', 'transporte']),

('¿Tienen garantía los neumáticos?',
 'Todos nuestros neumáticos nuevos cuentan con garantía del fabricante que cubre defectos de fabricación. El período de garantía varía según la marca pero generalmente es de 5 años desde la fecha de fabricación o hasta alcanzar el desgaste del indicador TWI. No cubre daños por mal uso, pinchazos o desgaste normal.',
 'Compras',
 ARRAY['garantía', 'defectos', 'cobertura']),

-- Maintenance Questions
('¿Cómo puedo extender la vida útil de mis neumáticos?',
 'Para maximizar la durabilidad: 1) Mantenga la presión correcta, 2) Realice rotaciones periódicas cada 10.000 km, 3) Mantenga la alineación correcta, 4) Evite frenadas y aceleraciones bruscas, 5) No sobrecargue el vehículo, 6) Inspeccione regularmente en busca de desgaste irregular o daños, 7) Evite golpes contra cordones y baches.',
 'Mantenimiento',
 ARRAY['durabilidad', 'cuidados', 'vida útil']),

('¿Cuándo debo cambiar los neumáticos?',
 'Debe cambiar los neumáticos cuando: 1) La profundidad del dibujo sea menor a 1.6mm (indicador TWI visible), 2) Tengan más de 5 años aunque parezcan en buen estado, 3) Presenten grietas, cortes o deformaciones, 4) Muestren desgaste irregular significativo, 5) Hayan sufrido daños estructurales. Por seguridad, recomendamos no esperar al límite legal.',
 'Mantenimiento',
 ARRAY['cambio', 'desgaste', 'seguridad']),

('¿Se pueden reparar los neumáticos pinchados?',
 'Los pinchazos en la banda de rodadura de hasta 6mm pueden repararse profesionalmente si no hay daño estructural. No se deben reparar: pinchazos en el costado, daños mayores a 6mm, neumáticos con reparaciones previas cercanas, o neumáticos que han rodado desinflados. La reparación debe hacerse desde el interior con parche y tapón.',
 'Mantenimiento',
 ARRAY['reparación', 'pinchazos', 'parches']),

-- Brand Specific Questions
('¿Cuál es la diferencia entre las marcas premium y económicas?',
 'Las marcas premium (Michelin, Bridgestone, Pirelli) ofrecen tecnología avanzada, mejor rendimiento en frenado, menor ruido, mayor durabilidad y mejor agarre en condiciones adversas. Las marcas económicas ofrecen una buena relación calidad-precio para uso urbano normal. La elección depende de su presupuesto, tipo de conducción y expectativas de rendimiento.',
 'Marcas',
 ARRAY['marcas', 'premium', 'económicas', 'comparación']),

('¿Qué marca recomiendan para mi vehículo?',
 'La recomendación depende de varios factores: tipo de vehículo, estilo de conducción, presupuesto y condiciones de uso. Para city cars recomendamos Fate o Firestone. Para sedanes medianos Bridgestone o Goodyear. Para vehículos premium o deportivos Michelin o Pirelli. Nuestros asesores pueden ayudarlo a elegir la mejor opción según sus necesidades específicas.',
 'Marcas',
 ARRAY['recomendaciones', 'marcas', 'asesoramiento']),

-- Seasonal Questions
('¿Necesito neumáticos de invierno en Mendoza?',
 'Si conduce regularmente en zonas de montaña o durante el invierno en el Valle de Uco, los neumáticos de invierno son altamente recomendables. Ofrecen mejor tracción en temperaturas bajo 7°C, nieve y hielo. Para uso urbano en Mendoza ciudad, los neumáticos all-season son generalmente suficientes.',
 'Estacional',
 ARRAY['invierno', 'nieve', 'estacional']),

('¿Qué son los neumáticos all-season?',
 'Los neumáticos all-season (todas las estaciones) están diseñados para ofrecer un rendimiento equilibrado durante todo el año. Combinan características de neumáticos de verano e invierno, siendo ideales para climas moderados como el de Mendoza. Ofrecen buen rendimiento en seco, mojado y nieve ligera, aunque no igualan a los especializados en condiciones extremas.',
 'Estacional',
 ARRAY['all-season', 'todo tiempo', 'estacional']);