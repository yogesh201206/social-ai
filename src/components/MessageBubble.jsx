export default function MessageBubble({ role, content, timestamp }) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-6 w-6 rounded-lg gradient-bg flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">AI</span>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Marketing Assistant</span>
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'gradient-bg text-white rounded-br-md shadow-lg shadow-brand-500/20'
              : 'glass text-gray-800 dark:text-gray-200 rounded-bl-md'
          }`}
        >
          {content}
        </div>
        {timestamp && (
          <p className={`text-[10px] text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}
