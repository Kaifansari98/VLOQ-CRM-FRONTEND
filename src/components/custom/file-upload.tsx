import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function FileUpload() {
  const [file, setFile] = useState<File | null>(null)

  return (
    <div className="space-y-2">
      <Label htmlFor="file">Upload File</Label>
      <Input
        id="file"
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      {file && (
        <div className="flex items-center gap-2">
          <p className="text-sm">{file.name}</p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setFile(null)}
          >
            Remove
          </Button>
        </div>
      )}
    </div>
  )
}