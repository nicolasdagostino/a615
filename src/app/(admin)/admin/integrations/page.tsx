import {
  GmailIcon,
  GoogleMeetIcon,
  JiraIcon,
  LinearIcon,
  LoomIcon,
  MailchimpIcon,
  NotionIcon,
  TrelloIcon,
  ZoomIcon,
} from "@/components/integration/icon";
import IntegrationBreadcrumb from "@/components/integration/IntegrationBreadcrumb";
import IntegrationCard from "@/components/integration/IntegrationCard";

const integrationData = [
  {
    id: "whatsapp",
    title: "WhatsApp (manual por ahora)",
    description:
      "Usalo para notificaciones y comunicación. (Conexión real más adelante).",
    icon: <GmailIcon />,
    connect: false,
  },
  {
    id: "google-calendar",
    title: "Google Calendar",
    description:
      "Sincronizá horarios/agenda de clases. (Mock por ahora).",
    icon: <GoogleMeetIcon />,
    connect: false,
  },
  {
    id: "zoom",
    title: "Zoom",
    description:
      "Si hacés clases online o reuniones con coaches.",
    icon: <ZoomIcon />,
    connect: false,
  },
  {
    id: "mailchimp",
    title: "Mailchimp",
    description:
      "Newsletter / campañas para la comunidad del box.",
    icon: <MailchimpIcon />,
    connect: false,
  },
  {
    id: "notion",
    title: "Notion",
    description:
      "Documentación interna: reglas, onboarding, programación.",
    icon: <NotionIcon />,
    connect: false,
  },
  {
    id: "trello",
    title: "Trello",
    description:
      "Tareas del box: mantenimiento, eventos, pendientes.",
    icon: <TrelloIcon />,
    connect: false,
  },
  {
    id: "jira",
    title: "Jira",
    description:
      "Si querés llevar incidencias/bugs del sistema del box.",
    icon: <JiraIcon />,
    connect: false,
  },
  {
    id: "loom",
    title: "Loom",
    description:
      "Videos rápidos: técnica, anuncios, instrucciones.",
    icon: <LoomIcon />,
    connect: false,
  },
  {
    id: "linear",
    title: "Linear",
    description:
      "Gestión interna alternativa (similar a Jira).",
    icon: <LinearIcon />,
    connect: false,
  },
];

export default function AdminIntegrationsPage() {
  return (
    <div>
      <IntegrationBreadcrumb pageTitle="Integrations" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {integrationData.map((item) => (
          <IntegrationCard
            key={item.id}
            title={item.title}
            icon={item.icon}
            description={item.description}
            connect={item.connect}
          />
        ))}
      </div>
    </div>
  );
}
