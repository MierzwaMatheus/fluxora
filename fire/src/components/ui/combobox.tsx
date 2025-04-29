"use client"

import * as React from "react"
import { Check, ChevronDown, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  label: string
  value: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  onEdit?: (value: string) => void
  onDelete?: (value: string) => void
  placeholder?: string
  className?: string
}

export function Combobox({
  options,
  value,
  onChange,
  onEdit,
  onDelete,
  placeholder = "Selecione uma opção",
  className,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  const selectedOption = options.find(option => option.value === value)

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInputClick = () => {
    setIsOpen(true)
    inputRef.current?.focus()
  }

  const handleOptionSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setSearchTerm("")
    setIsOpen(false)
  }

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        listRef.current && 
        inputRef.current && 
        !listRef.current.contains(event.target as Node) && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        placeholder={isOpen ? "Digite para filtrar..." : placeholder}
        value={isOpen ? searchTerm : selectedOption?.label || ""}
        onChange={(e) => setSearchTerm(e.target.value)}
        onClick={handleInputClick}
      />
      <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50" />
      
      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md mt-1"
        >
          {filteredOptions.map((option) => (
            <li
              key={option.value}
              className={cn(
                "relative flex items-center justify-between rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                option.value === value && "bg-accent text-accent-foreground"
              )}
            >
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => handleOptionSelect(option.value)}
              >
                <span>{option.label}</span>
                {option.value === value && (
                  <Check className="ml-auto h-4 w-4 inline-block" />
                )}
              </div>
              <div className="flex items-center gap-1 ml-2">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(option.value);
                      setIsOpen(false);
                    }}
                    className="p-1 rounded-sm hover:bg-blue-100 transition-colors"
                    title="Editar produto"
                  >
                    <Pencil className="h-3 w-3 text-blue-500" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(option.value);
                      setIsOpen(false);
                    }}
                    className="p-1 rounded-sm hover:bg-red-100 transition-colors"
                    title="Excluir produto"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </button>
                )}
              </div>
            </li>
          ))}
          {filteredOptions.length === 0 && (
            <li className="relative flex items-center rounded-sm px-3 py-2 text-sm text-muted-foreground">
              Nenhuma opção encontrada
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
