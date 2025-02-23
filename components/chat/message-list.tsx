return (
  <div className="space-y-4 p-4 bg-white dark:bg-[#313338]">
    {messages.map((message) => (
      <div
        key={message.id}
        className="flex items-start gap-x-3 group"
      >
        <UserAvatar
          src={message.user?.image}
          fallback={message.user?.name?.[0] || "?"}
          className="w-8 h-8"
        />
        <div className="flex-1">
          <div className="flex items-center gap-x-2">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {message.user?.name}
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(message.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {message.content}
          </p>
        </div>
      </div>
    ))}
  </div>
) 