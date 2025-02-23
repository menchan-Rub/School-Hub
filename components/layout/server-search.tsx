"use client"

import { Search } from "lucide-react"
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useNavigationStore } from '@/lib/stores/navigation-store'

interface ServerSearchProps {
  data: {
    label: string
    type: "channel" | "member"
    data: {
      id: string
      name: string
      icon: any
    }[] | undefined
  }[]
}

export function ServerSearch({ data }: ServerSearchProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { setActiveView } = useNavigationStore()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition"
      >
        <Search className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
        <p className="font-semibold text-sm text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition">
          検索
        </p>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="検索..." />
        <CommandList>
          <CommandEmpty>
            見つかりませんでした
          </CommandEmpty>
          {data.map(({ label, type, data }) => {
            if (!data?.length) return null

            return (
              <CommandGroup key={label} heading={label}>
                {data?.map(({ id, name, icon: Icon }) => (
                  <CommandItem
                    key={id}
                    onSelect={() => {
                      setOpen(false)
                      setActiveView(id)
                    }}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )
          })}
        </CommandList>
      </CommandDialog>
    </>
  )
} 