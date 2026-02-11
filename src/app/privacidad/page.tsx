'use client'

import {
  Shield,
  Database,
  Users,
  MessageCircle,
  Cookie,
  Lock,
  UserCheck,
  Mail,
} from 'lucide-react'
import { LegalLayout } from '@/components/legal'
import type { LegalPageConfig } from '@/components/legal'

const privacidadConfig: LegalPageConfig = {
  title: 'Política de Privacidad',
  subtitle: 'Última actualización: Febrero 2026',
  intro: 'En Neumáticos del Valle SRL nos comprometemos a proteger tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos tu información personal cuando utilizás nuestro sitio web y servicios.',
  icon: Shield,
  badge: 'Legal',
  sections: [
    {
      id: 'informacion-que-recopilamos',
      icon: Database,
      title: 'Información que Recopilamos',
      content: [
        'Recopilamos información que nos proporcionás voluntariamente al realizar una compra, solicitar un turno o contactarnos:',
      ],
      list: [
        'Datos personales: nombre, teléfono, correo electrónico',
        'Datos de navegación: páginas visitadas, tiempo de permanencia, dispositivo utilizado',
        'Datos de compra: productos consultados, historial de pedidos',
        'Datos de comunicación: mensajes enviados por WhatsApp y formularios de contacto',
      ],
    },
    {
      id: 'uso-de-la-informacion',
      icon: Users,
      title: 'Uso de la Información',
      content: [
        'Utilizamos tu información personal para los siguientes fines:',
      ],
      list: [
        'Procesar y gestionar tus pedidos de neumáticos y servicios',
        'Comunicarnos contigo sobre el estado de tus compras y turnos',
        'Enviarte información relevante sobre productos, ofertas y servicios',
        'Mejorar la experiencia de usuario en nuestro sitio web',
        'Generar estadísticas internas de uso (de forma anónima)',
        'Cumplir con obligaciones legales y regulatorias',
      ],
    },
    {
      id: 'whatsapp-y-comunicaciones',
      icon: MessageCircle,
      title: 'WhatsApp y Comunicaciones',
      content: [
        'Nuestro proceso de compra se realiza a través de WhatsApp Business. Al iniciar una compra o consulta por este medio:',
      ],
      list: [
        'Utilizamos la plataforma Twilio para gestionar comunicaciones automatizadas',
        'Los mensajes transaccionales incluyen confirmaciones de pedidos y recordatorios de turnos',
        'Tu número de teléfono se almacena de forma segura para poder responder a tus consultas',
        'Podés solicitar dejar de recibir mensajes en cualquier momento enviando "STOP"',
        'No compartimos tu número de teléfono con terceros no relacionados al servicio',
      ],
    },
    {
      id: 'cookies-y-tecnologias-de-seguimiento',
      icon: Cookie,
      title: 'Cookies y Tecnologías de Seguimiento',
      content: [
        'Nuestro sitio web utiliza cookies y tecnologías similares para mejorar tu experiencia:',
      ],
      list: [
        'Cookies esenciales: necesarias para el funcionamiento del sitio (carrito de compras, sesión)',
        'Cookies de análisis: nos ayudan a entender cómo usás el sitio para mejorarlo',
        'Cookies de preferencias: recuerdan tus configuraciones como tema oscuro/claro',
        'No utilizamos cookies de publicidad de terceros',
      ],
      extra:
        'Podés configurar tu navegador para bloquear o eliminar cookies, aunque esto puede afectar la funcionalidad del sitio.',
    },
    {
      id: 'compartir-informacion-con-terceros',
      icon: Users,
      title: 'Compartir Información con Terceros',
      content: [
        'No vendemos ni alquilamos tu información personal. Solo compartimos datos en los siguientes casos:',
      ],
      list: [
        'Proveedores de servicios: Twilio (comunicaciones), Supabase (base de datos), Vercel (hosting)',
        'Obligaciones legales: cuando sea requerido por autoridades competentes o por orden judicial',
        'Protección de derechos: para proteger nuestros derechos legales o la seguridad de nuestros usuarios',
      ],
      extra:
        'Todos nuestros proveedores están sujetos a acuerdos de confidencialidad y protección de datos.',
    },
    {
      id: 'seguridad-de-los-datos',
      icon: Lock,
      title: 'Seguridad de los Datos',
      content: [
        'Implementamos medidas de seguridad técnicas y organizativas para proteger tu información:',
      ],
      list: [
        'Cifrado SSL/TLS en todas las comunicaciones del sitio',
        'Acceso restringido a datos personales solo a personal autorizado',
        'Base de datos con políticas de seguridad a nivel de fila (Row Level Security)',
        'Monitoreo continuo de accesos y actividad sospechosa',
        'Backups regulares y protegidos de la información',
      ],
    },
    {
      id: 'tus-derechos',
      icon: UserCheck,
      title: 'Tus Derechos',
      content: [
        'De acuerdo con la Ley 25.326 de Protección de Datos Personales de la República Argentina, tenés derecho a:',
      ],
      list: [
        'Acceso: solicitar información sobre los datos personales que tenemos sobre vos',
        'Rectificación: corregir datos inexactos o incompletos',
        'Supresión: solicitar la eliminación de tus datos personales',
        'Oposición: oponerte al tratamiento de tus datos en determinadas circunstancias',
        'Portabilidad: recibir tus datos en un formato estructurado y de uso común',
      ],
      extra:
        'Para ejercer cualquiera de estos derechos, contactanos a través de los medios indicados al final de esta página.',
    },
    {
      id: 'contacto',
      icon: Mail,
      title: 'Contacto',
      content: [
        'Si tenés preguntas sobre esta Política de Privacidad o querés ejercer tus derechos, podés contactarnos:',
      ],
      list: [
        'WhatsApp: +54 9 385 585-4741',
        'Ubicación: Neumáticos del Valle SRL, NOA Argentina',
        'A través del formulario de contacto de nuestro sitio web',
      ],
      extra:
        'Nos comprometemos a responder tu solicitud en un plazo máximo de 10 días hábiles.',
    },
  ],
}

export default function PrivacidadPage() {
  return <LegalLayout config={privacidadConfig} />
}
