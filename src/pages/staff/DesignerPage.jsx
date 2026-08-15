import { useState, useRef } from 'react'
import { Upload, Loader2, Send, X, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import staffApi from '../../utils/staffApi'
import { uploadMultipleToCloudinary } from '../../utils/uploadCloudinary'
import StageBoard from '../../Components/staff/StageBoard'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { canAct, PURPLE } from '../../Components/staff/staffConfig'

const isPdf = (url) => /\.pdf($|\?)/i.test(url || '')

function DesignActions(order, { removeOne }) {
  const [files, setFiles]         = useState([])   // URLs uploadées
  const [notes, setNotes]         = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending]     = useState(false)
  const inputRef = useRef(null)

  const handleUpload = async (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length === 0) return
    setUploading(true)
    try {
      const urls = await uploadMultipleToCloudinary(selected)
      setFiles(prev => [...prev, ...urls])
      toast.success(`${urls.length} fichier(s) ajouté(s)`)
    } catch (err) {
      toast.error(err.message || 'Erreur upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeFile = (url) => setFiles(prev => prev.filter(f => f !== url))

  const submit = async () => {
    if (files.length === 0) return toast.error('Ajoutez au moins un fichier de design')
    setSending(true)
    try {
      await staffApi.post(`/workflow/orders/${order._id}/design`, { files, notes })
      toast.success('Design envoyé en production')
      removeOne(order._id)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: PURPLE }}>Mon design</p>

      {/* Fichiers uploadés */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((url, i) => (
            <div key={i} className="relative">
              {isPdf(url) ? (
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl border-2 text-[10px] font-bold"
                  style={{ borderColor: 'rgba(124,58,237,0.25)', background: '#faf9ff', color: PURPLE }}>
                  <FileText size={18} /> PDF
                </div>
              ) : (
                <img src={url} alt="design" className="w-16 h-16 rounded-xl object-cover border-2" style={{ borderColor: 'rgba(124,58,237,0.25)' }} />
              )}
              <button onClick={() => removeFile(url)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow" style={{ background: '#ef4444' }}>
                <X size={11} color="white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input upload */}
      <input ref={inputRef} type="file" accept="image/*,application/pdf" multiple onChange={handleUpload} className="hidden" id={`design-${order._id}`} />
      <label htmlFor={`design-${order._id}`}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all hover:opacity-80"
        style={{ background: 'rgba(124,58,237,0.1)', color: PURPLE }}>
        {uploading ? <><Loader2 size={15} className="animate-spin" /> Upload…</> : <><Upload size={15} /> Ajouter le design (image/PDF)</>}
      </label>

      {/* Notes */}
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
        placeholder="Notes pour la production (optionnel)"
        className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 text-sm outline-none focus:border-purple-400 transition-colors resize-none" />

      <button onClick={submit} disabled={sending || uploading || files.length === 0}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
        style={{ background: PURPLE }}>
        {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        Envoyer en production
      </button>
    </div>
  )
}

function DesignerPage() {
  const { role } = useStaffAuth()
  return (
    <StageBoard
      stage="design"
      eyebrow="Service design"
      title="Commandes à designer"
      emptyText="Aucune commande en attente de design."
      summaryOpts={{ showHistory: true }}
      readOnly={!canAct(role, 'design')}
      renderActions={DesignActions}
    />
  )
}

export default DesignerPage
