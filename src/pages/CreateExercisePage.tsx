import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2, Mic, Square, Play, Pause } from 'lucide-react'
import { db } from '../db'
import type { ExerciseVariant } from '../types'
import { uuid } from '../utils/uuid'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import VideoThumbnail from '../components/ui/VideoThumbnail'

export default function CreateExercisePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const existing = useLiveQuery(() => id ? db.exercises.get(id) : undefined, [id])

  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<string>('')
  const [variants, setVariants] = useState<ExerciseVariant[]>([])
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioSpeed, setAudioSpeed] = useState<1 | 1.5 | 2>(1)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingStartRef = useRef<number>(0)

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setComment(existing.comment ?? '')
      setVariants(existing.variants)
      setThumbnail(existing.video?.thumbnail ?? '')
    }
  }, [existing])

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    await new Promise(res => { video.onloadedmetadata = res })

    if (video.duration > 60) {
      alert('O vídeo deve ter no máximo 1 minuto. Selecione um vídeo mais curto ou use a opção HD.')
      return
    }

    setVideoFile(file)
    const thumb = await generateThumbnail(video)
    setThumbnail(thumb)
  }

  async function generateThumbnail(video: HTMLVideoElement): Promise<string> {
    return new Promise(res => {
      video.currentTime = 0
      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 320
        canvas.height = 180
        canvas.getContext('2d')!.drawImage(video, 0, 0, 320, 180)
        res(canvas.toDataURL('image/jpeg', 0.7))
      }
    })
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream)
    mediaRecorderRef.current = mr
    audioChunksRef.current = []
    recordingStartRef.current = Date.now()

    mr.ondataavailable = e => audioChunksRef.current.push(e.data)
    mr.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      setAudioBlob(blob)
      setAudioDuration(Math.round((Date.now() - recordingStartRef.current) / 1000))
      stream.getTracks().forEach(t => t.stop())
    }
    mr.start()
    setRecording(true)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  function toggleAudio() {
    if (!audioRef.current || !audioBlob) return
    if (!audioRef.current.src) {
      audioRef.current.src = URL.createObjectURL(audioBlob)
    }
    if (audioPlaying) {
      audioRef.current.pause()
      setAudioPlaying(false)
    } else {
      audioRef.current.playbackRate = audioSpeed
      audioRef.current.play()
      setAudioPlaying(true)
    }
  }

  function addVariant() {
    setVariants(prev => [...prev, { id: uuid(), name: '', comment: '' }])
  }

  function updateVariant(id: string, patch: Partial<ExerciseVariant>) {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v))
  }

  function removeVariant(id: string) {
    setVariants(prev => prev.filter(v => v.id !== id))
  }

  async function handleSave() {
    if (!name.trim()) return

    let videoData = existing?.video
    if (videoFile) {
      videoData = {
        blob: videoFile,
        thumbnail,
        duration: 0,
        isHD: false,
      }
    }

    let audioData = existing?.audio
    if (audioBlob) {
      audioData = { blob: audioBlob, duration: audioDuration }
    }

    const payload = {
      name: name.trim(),
      comment: comment.trim(),
      video: videoData,
      audio: audioData,
      variants,
      createdAt: existing?.createdAt ?? Date.now(),
      readonly: false,
    }

    if (isEdit && id) {
      await db.exercises.update(id, payload)
    } else {
      await db.exercises.add({ ...payload, id: uuid() })
    }
    navigate(-1)
  }

  return (
    <div className="flex flex-col min-h-svh bg-[#111111] pb-24">
      <PageHeader title={isEdit ? 'Editar Exercício' : 'Novo Exercício'} />

      <div className="flex flex-col gap-4 px-4 pt-2">
        <div>
          <label className="text-xs text-[#888888] mb-1 block">Nome do exercício</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Agachamento Livre"
            className="w-full bg-[#1C1C1C] text-[#F0F0F0] rounded-xl px-4 py-3 text-sm border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
          />
        </div>

        {/* Video upload */}
        <div>
          <label className="text-xs text-[#888888] mb-2 block">Vídeo (máx. 1 minuto)</label>
          <div className="flex items-center gap-3">
            <VideoThumbnail thumbnail={thumbnail} size="md" />
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-[#4BDF93] cursor-pointer">
                <Plus size={14} />
                {thumbnail ? 'Trocar vídeo' : 'Adicionar vídeo'}
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
              </label>
              <label className="flex items-center gap-2 text-xs text-[#888888] cursor-pointer">
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                HD (sem compressão)
              </label>
            </div>
          </div>
        </div>

        {/* Audio recording */}
        <div>
          <label className="text-xs text-[#888888] mb-2 block">Áudio do professor (opcional)</label>
          <div className="flex items-center gap-3">
            {recording ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 text-sm text-[#FF0D5F] border border-[#FF0D5F] rounded-xl px-4 py-2"
              >
                <Square size={14} />
                Parar gravação
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 text-sm text-[#888888] border border-[#2A2A2A] rounded-xl px-4 py-2"
              >
                <Mic size={14} />
                {audioBlob ? 'Regravar' : 'Gravar áudio'}
              </button>
            )}
            {audioBlob && !recording && (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAudio}
                  className="w-8 h-8 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center"
                >
                  {audioPlaying ? <Pause size={14} className="text-[#4BDF93]" /> : <Play size={14} className="text-[#4BDF93] ml-0.5" />}
                </button>
                <span className="text-xs text-[#888888]">{audioDuration}s</span>
              </div>
            )}
          </div>
          <audio ref={audioRef} onEnded={() => setAudioPlaying(false)} className="hidden" />
        </div>

        {/* Comment */}
        <div>
          <label className="text-xs text-[#888888] mb-1 block">Comentário do professor</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Instruções técnicas, dicas de execução..."
            rows={3}
            className="w-full bg-[#1C1C1C] text-[#F0F0F0] rounded-xl px-4 py-3 text-sm border border-[#2A2A2A] resize-none focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
          />
        </div>

        {/* Variants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#F0F0F0]">Exercícios alternativos</p>
            <button onClick={addVariant} className="flex items-center gap-1 text-sm text-[#4BDF93]">
              <Plus size={14} />
              Adicionar
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {variants.map(v => (
              <div key={v.id} className="bg-[#1C1C1C] rounded-2xl border border-[#2A2A2A] p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    value={v.name}
                    onChange={e => updateVariant(v.id, { name: e.target.value })}
                    placeholder="Nome do exercício alternativo"
                    className="flex-1 bg-[#252525] text-[#F0F0F0] rounded-lg px-3 py-2 text-sm border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
                  />
                  <button onClick={() => removeVariant(v.id)} className="text-[#888888] p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <VideoThumbnail thumbnail={v.video?.thumbnail} size="sm" />
                  <label className="text-sm text-[#4BDF93] cursor-pointer">
                    <Plus size={14} className="inline mr-1" />
                    Vídeo
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const vid = document.createElement('video')
                        vid.src = URL.createObjectURL(file)
                        await new Promise(res => { vid.onloadedmetadata = res })
                        if (vid.duration > 60) { alert('Máximo 1 minuto'); return }
                        const thumb = await new Promise<string>(res => {
                          vid.currentTime = 0
                          vid.onseeked = () => {
                            const c = document.createElement('canvas')
                            c.width = 320; c.height = 180
                            c.getContext('2d')!.drawImage(vid, 0, 0, 320, 180)
                            res(c.toDataURL('image/jpeg', 0.7))
                          }
                        })
                        updateVariant(v.id, { video: { blob: file, thumbnail: thumb, duration: vid.duration, isHD: false } })
                      }}
                    />
                  </label>
                </div>
                <input
                  value={v.comment ?? ''}
                  onChange={e => updateVariant(v.id, { comment: e.target.value })}
                  placeholder="Comentário (opcional)"
                  className="w-full bg-[#252525] text-[#F0F0F0] rounded-lg px-3 py-2 text-xs border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-6 pt-3 bg-[#111111] border-t border-[#2A2A2A] z-10">
        <Button fullWidth size="lg" onClick={handleSave} disabled={!name.trim()}>
          {isEdit ? 'Salvar' : 'Criar exercício'}
        </Button>
      </div>
    </div>
  )
}
