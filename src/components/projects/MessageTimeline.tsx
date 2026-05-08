import { SavoirCard } from "@/components/savoir/SavoirCard";

type TimelineMessage = {
  id: string;
  role: string;
  content: string;
  createdAt: Date | string;
};

export function MessageTimeline({ messages }: { messages: TimelineMessage[] }) {
  return (
    <SavoirCard className="p-5">
      <h2 className="font-display text-xl font-semibold">Timeline</h2>
      <div className="mt-5 space-y-4">
        {messages.length === 0 ? (
          <p className="text-sm text-white/55">Aucun message pour le moment.</p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="border-l border-[#00E5D1]/35 pl-4">
              <div className="flex items-center justify-between gap-3 text-xs text-white/45">
                <span className="font-mono">{message.role}</span>
                <time>{new Date(message.createdAt).toLocaleString("fr-FR")}</time>
              </div>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-white/75">{message.content}</p>
            </article>
          ))
        )}
      </div>
    </SavoirCard>
  );
}
