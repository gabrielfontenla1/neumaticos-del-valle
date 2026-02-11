'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreateInstanceDialogProps {
  onCreated: () => void
}

export function CreateInstanceDialog({ onCreated }: CreateInstanceDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/baileys/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Instancia creada exitosamente')
        setName('')
        setOpen(false)
        onCreated()
      } else {
        toast.error(data.error || 'Error al crear instancia')
      }
    } catch (error) {
      toast.error('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-[#00a884] hover:bg-[#00a884]/80 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nueva instancia
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#202c33] border-[#2a3942] text-[#e9edef]">
        <DialogHeader>
          <DialogTitle className="text-[#e9edef]">Crear instancia de WhatsApp</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm text-[#8696a0] mb-1 block">Nombre</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: WhatsApp Principal"
              className="bg-[#2a3942] border-[#3b4a54] text-[#e9edef] placeholder:text-[#6a7a82]"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-[#2a3942] text-[#8696a0] hover:bg-[#2a3942]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="bg-[#00a884] hover:bg-[#00a884]/80 text-white"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Crear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
