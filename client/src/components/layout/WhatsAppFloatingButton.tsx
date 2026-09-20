// Persistent chrome, visible on every page — kept to a plain hover/press
// response rather than an attention-seeking animation (pulsing, bouncing),
// since anything louder gets tiring the hundredth time someone sees it.
export function WhatsAppFloatingButton() {
  return (
    <a
      href="https://wa.me/916281776748"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-[0_4px_14px_rgba(0,0,0,0.18),0_2px_4px_rgba(0,0,0,0.1)] transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
    >
      <img src="https://cdn.simpleicons.org/whatsapp/ffffff" alt="" className="h-7 w-7" />
    </a>
  );
}
