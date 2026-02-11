'use client'

import {
  FileText,
  CheckCircle,
  Globe,
  ShoppingCart,
  MessageCircle,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Copyright,
  Scale,
} from 'lucide-react'
import { LegalLayout } from '@/components/legal'
import type { LegalPageConfig } from '@/components/legal'

const terminosConfig: LegalPageConfig = {
  title: 'Términos y Condiciones',
  subtitle: 'Última actualización: Febrero 2026',
  intro: 'Estos Términos y Condiciones regulan el uso del sitio web de Neumáticos del Valle SRL y los servicios ofrecidos a través del mismo. Te pedimos que los leas detenidamente antes de utilizar nuestro Sitio.',
  icon: FileText,
  badge: 'Legal',
  sections: [
    {
      id: 'aceptacion-de-los-terminos',
      icon: CheckCircle,
      title: 'Aceptación de los Términos',
      content: [
        'Al acceder y utilizar el sitio web de Neumáticos del Valle SRL (en adelante, "el Sitio"), aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguno de estos términos, te pedimos que no utilices el Sitio.',
        'Nos reservamos el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigencia desde su publicación en el Sitio. El uso continuado del Sitio después de dichas modificaciones constituye tu aceptación de los términos actualizados.',
      ],
    },
    {
      id: 'uso-del-sitio',
      icon: Globe,
      title: 'Uso del Sitio',
      content: ['Al utilizar nuestro Sitio, te comprometés a:'],
      list: [
        'Proporcionar información veraz y actualizada en formularios y comunicaciones',
        'Utilizar el Sitio únicamente con fines lícitos y de acuerdo con estos términos',
        'No intentar acceder a áreas restringidas del Sitio sin autorización',
        'No utilizar el Sitio para transmitir contenido malicioso, difamatorio o ilegal',
        'No interferir con el funcionamiento normal del Sitio o sus servidores',
        'No recopilar información de otros usuarios sin su consentimiento',
      ],
      extra:
        'Nos reservamos el derecho de restringir el acceso a cualquier usuario que incumpla estos términos.',
    },
    {
      id: 'productos-y-precios',
      icon: ShoppingCart,
      title: 'Productos y Precios',
      content: [
        'La información sobre productos publicada en el Sitio se ofrece a título informativo:',
      ],
      list: [
        'Los precios están expresados en Pesos Argentinos (ARS) e incluyen IVA cuando corresponda',
        'Los precios pueden variar sin previo aviso debido a condiciones del mercado',
        'Las imágenes de productos son ilustrativas y pueden diferir del producto real',
        'La disponibilidad de productos está sujeta a stock existente en nuestras sucursales',
        'Las especificaciones técnicas se basan en la información proporcionada por los fabricantes',
        'Las promociones y descuentos tienen vigencia limitada según se indique en cada caso',
      ],
      extra:
        'El precio final será confirmado al momento de concretar la compra a través de WhatsApp con nuestro equipo de ventas.',
    },
    {
      id: 'proceso-de-compra',
      icon: MessageCircle,
      title: 'Proceso de Compra',
      content: [
        'Las compras en Neumáticos del Valle se realizan a través de WhatsApp Business:',
      ],
      list: [
        'El carrito de compras del Sitio genera un mensaje con el detalle de los productos seleccionados',
        'El proceso de compra se completa a través de la conversación por WhatsApp con nuestro equipo',
        'La confirmación del pedido se realiza una vez acordadas las condiciones de pago y entrega',
        'Los medios de pago aceptados serán informados durante la conversación por WhatsApp',
        'Neumáticos del Valle se reserva el derecho de rechazar un pedido si no puede cumplir con las condiciones solicitadas',
        'El plazo de entrega será informado al momento de confirmar el pedido',
      ],
      extra:
        'La publicación de productos en el Sitio no constituye una oferta vinculante. La relación contractual se perfecciona al confirmar el pedido por WhatsApp.',
    },
    {
      id: 'turnos-y-servicios',
      icon: Calendar,
      title: 'Turnos y Servicios',
      content: [
        'El sistema de reserva de turnos online está sujeto a las siguientes condiciones:',
      ],
      list: [
        'Los turnos solicitados quedan sujetos a confirmación por parte de nuestro equipo',
        'Te solicitamos presentarte con al menos 10 minutos de anticipación a tu turno',
        'En caso de no poder asistir, agradecemos que canceles o reprogrames tu turno con la mayor antelación posible',
        'Neumáticos del Valle se reserva el derecho de reprogramar turnos por razones operativas, notificándote con anticipación',
        'Los servicios disponibles y sus precios están sujetos a la evaluación del vehículo al momento de la atención',
        'El tiempo estimado de servicio es orientativo y puede variar según las condiciones del vehículo',
      ],
    },
    {
      id: 'garantias',
      icon: ShieldCheck,
      title: 'Garantías',
      content: [
        'Las garantías de los productos comercializados se rigen por las siguientes condiciones:',
      ],
      list: [
        'Los neumáticos cuentan con la garantía del fabricante según sus propios términos y condiciones',
        'La garantía no cubre daños por uso indebido, accidentes, sobrecarga o falta de mantenimiento',
        'Para hacer efectiva la garantía, es necesario presentar el comprobante de compra',
        'Los servicios realizados en nuestros talleres cuentan con garantía sobre la mano de obra',
        'La garantía de servicios no cubre problemas derivados de piezas no proporcionadas por nosotros',
      ],
      extra:
        'Los derechos del consumidor establecidos por la Ley 24.240 de Defensa del Consumidor son irrenunciables y prevalecen sobre cualquier disposición en contrario.',
    },
    {
      id: 'limitacion-de-responsabilidad',
      icon: AlertTriangle,
      title: 'Limitación de Responsabilidad',
      content: [
        'Neumáticos del Valle SRL no será responsable por:',
      ],
      list: [
        'Interrupciones temporales del Sitio por mantenimiento o problemas técnicos',
        'Errores u omisiones en el contenido del Sitio, incluyendo precios y disponibilidad',
        'Daños derivados del uso de información del Sitio sin verificación con nuestro equipo',
        'Problemas de conexión o compatibilidad con el dispositivo del usuario',
        'Contenido de sitios web de terceros enlazados desde nuestro Sitio',
        'Retrasos en la entrega por causas de fuerza mayor o circunstancias ajenas a nuestra voluntad',
      ],
      extra:
        'Nos esforzamos por mantener la información del Sitio actualizada y precisa, pero recomendamos confirmar datos importantes directamente con nuestro equipo.',
    },
    {
      id: 'propiedad-intelectual',
      icon: Copyright,
      title: 'Propiedad Intelectual',
      content: [
        'Todo el contenido del Sitio está protegido por derechos de propiedad intelectual:',
      ],
      list: [
        'Los textos, imágenes, logotipos, diseños y código del Sitio son propiedad de Neumáticos del Valle SRL o de sus respectivos titulares',
        'Las marcas de neumáticos y productos exhibidos pertenecen a sus respectivos fabricantes',
        'Se prohíbe la reproducción, distribución o modificación del contenido sin autorización expresa',
        'El uso del Sitio no otorga ninguna licencia sobre la propiedad intelectual del mismo',
      ],
    },
    {
      id: 'ley-aplicable-y-jurisdiccion',
      icon: Scale,
      title: 'Ley Aplicable y Jurisdicción',
      content: [
        'Estos Términos y Condiciones se rigen por las leyes de la República Argentina:',
      ],
      list: [
        'Cualquier controversia será sometida a la jurisdicción de los tribunales competentes de Santiago del Estero, Argentina',
        'Aplica la Ley 24.240 de Defensa del Consumidor y sus modificatorias',
        'Aplica la Ley 25.326 de Protección de Datos Personales',
        'Aplica el Código Civil y Comercial de la Nación Argentina',
        'El usuario puede realizar reclamos ante la Dirección Nacional de Defensa del Consumidor',
      ],
      extra:
        'Para cualquier consulta sobre estos términos, no dudes en contactarnos a través de WhatsApp o en cualquiera de nuestras sucursales.',
    },
  ],
}

export default function TerminosPage() {
  return <LegalLayout config={terminosConfig} />
}
