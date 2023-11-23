import React from 'react'
import './App.css'
import { Button, LabeledInput } from './widgets'

const getCamera = () => document.getElementById('camera') as HTMLVideoElement
const getAudio = () => document.getElementById('audio') as HTMLAudioElement

interface Config {
  openAiApiKey: string
  elevenLabsApiKey: string
}
const ConfigForm = ({ onSubmit }: { onSubmit: (config: Config) => void }) => {
  const [openAiApiKey, setOpenAiApiKey] = React.useState('')
  const [elevenLabsApiKey, setElevenLabsApiKey] = React.useState('')

  const isDisabled: boolean = openAiApiKey.trim().length === 0 || elevenLabsApiKey.trim().length === 0

  return (
    <div className="flex flex-col gap-8">
      <LabeledInput
        label="OpenAI API key"
        id="openAiApiKey"
        value={openAiApiKey}
        onChange={e => setOpenAiApiKey(e.currentTarget.value)}
      />
      <LabeledInput
        label="ElevenLabs API key"
        id="elevenLabsApiKey"
        value={elevenLabsApiKey}
        onChange={e => setElevenLabsApiKey(e.currentTarget.value)}
      />
      <Button className="w-32" disabled={isDisabled} onClick={() => onSubmit({ openAiApiKey, elevenLabsApiKey })}>
        Save
      </Button>
      <p>
        API keys are stored in your browser's local storage.
        <br />
        They are not sent anywhere.
      </p>
    </div>
  )
}

function getCurrentCameraImage() {
  const video = getCamera()

  const canvas = document.createElement('canvas')
  // scale the canvas accordingly
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  // draw the video at that frame
  canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height)
  // convert it to a usable data URL
  return canvas.toDataURL()
}

function isAudioPlaying(audio: HTMLAudioElement) {
  return audio && audio.currentTime > 0 && !audio.paused && !audio.ended && audio.readyState > 2
}

let chatHistory: string[] = []

function userMessageForImageGeneration(base64Image: string, isFirstImage: boolean) {
  return {
    role: 'user',
    content: [
      {
        type: 'text',
        text: isFirstImage
          ? `Describe this image`
          : `Describe this image. If the human does anything remotely interesting, make a big deal about it! Keep it short.`,
      },
      {
        type: 'image_url',
        image_url: {
          url: `${base64Image}`,
        },
      },
    ],
  }
}

function getCurrentCameraBroadcastText(openAiApiKey: string) {
  const base64Image = getCurrentCameraImage()

  return fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'system',
          content: `You are an energetic radio sports broadcaster. Narrate the picture of the human as if it is a sporting event.
          Make it snarky and funny. Don't repeat yourself. Make it short. If the human does anything remotely interesting, make a big deal about it!`,
        },
        ...chatHistory.map(content => ({ role: 'assistant', content })),
        userMessageForImageGeneration(base64Image, chatHistory.length === 0),
      ],
      max_tokens: 300,
    }),
  })
    .then(res => {
      if (res.status === 401) {
        throw new Error('Invalid OpenAI API key')
      } else {
        return res.json()
      }
    })
    .then(res => {
      try {
        const message = res.choices[0]?.message?.content as string
        console.log(message)
        chatHistory = [...chatHistory, message]
        return message
      } catch (e) {
        console.error(e)
        return undefined
      }
    })
}

function textToSpeechStream(elevenLabsApiKey: string, text: string) {
  const voiceId = 'SOYHLrjzK2X1ezoPC6cr' // Harry

  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'XI-API-Key': elevenLabsApiKey,
    },
    method: 'POST',
    body: JSON.stringify({
      text,
      //model_id: 'eleven_multilingual_v2',
      model_id: 'eleven_multilingual_v1',
      voice_settings: {
        stability: 0.29,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true,
      },
    }),
  }).then(res => {
    if (res.status === 401) {
      throw new Error('Invalid ElevenLabs API key')
    } else {
      return res.body!
    }
  })
}

function playStreamInAudio(stream: ReadableStream<Uint8Array>, onEnd: () => void) {
  const reader = stream.getReader()
  const mediaSource = new MediaSource()
  const audio = getAudio()
  audio.src = window.URL.createObjectURL(mediaSource)

  mediaSource.addEventListener(
    'sourceopen',
    function () {
      var sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
      var chunks = []

      function pump(stream: ReadableStreamDefaultReader<Uint8Array>) {
        return stream.read().then(data => {
          if (data.value) {
            chunks.push(data.value)

            sourceBuffer.appendBuffer(data.value)
          }
        })
      }

      sourceBuffer.addEventListener('updateend', () => pump(reader), false)

      pump(reader)

      audio.play()
      reader.closed.then(() => {
        const intervalId = setInterval(() => {
          const isPlaying = isAudioPlaying(audio)
          console.log({ isPlaying })
          if (!isPlaying) {
            clearInterval(intervalId)
            onEnd()
          }
        }, 200)
      })
    },
    false,
  )
}

const LoadingText = ({ text }: { text: string }) => {
  const id = `dots-${Date.now()}`

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      const dots = document.getElementById(id)!
      dots.innerHTML = dots.innerHTML.length < 3 ? dots.innerHTML + '.' : ''
    }, 400)
    return () => clearInterval(intervalId)
  })

  return (
    <div>
      {text}
      <span id={id} />
    </div>
  )
}

function App() {
  const [isAnalyzingImage, setIsAnalyzingImage] = React.useState(false)
  const [isStreamingVoice, setIsStreamingVoice] = React.useState(false)
  const [isInProgress, setIsInProgress] = React.useState(false)
  const [config, setConfig] = React.useState<Config | undefined>(
    (() => {
      const config = window.localStorage.getItem('config')
      console.log(config)
      if (config) {
        const data = JSON.parse(config)
        if (typeof data.openAiApiKey === 'string' && typeof data.elevenLabsApiKey === 'string') {
          return data
        }
      }
      return undefined
    })(),
  )
  const [broadcastText, setBroadcastText] = React.useState<string | undefined>()

  const onSaveConfig = (config: Config) => {
    window.localStorage.setItem('config', JSON.stringify(config))
    setConfig(config)
  }

  const onDeleteConfig = () => {
    window.localStorage.removeItem('config')
    setConfig(undefined)
  }

  function feedAICommentaryToAudio() {
    if (config) {
      setBroadcastText(undefined)
      setIsAnalyzingImage(true)
      setIsInProgress(true)
      getCurrentCameraBroadcastText(config.openAiApiKey)
        .then(text => {
          setIsAnalyzingImage(false)
          setIsStreamingVoice(true)
          if (text) {
            setBroadcastText(text)
            return textToSpeechStream(config.elevenLabsApiKey, text)
          }
        })
        .then(stream => {
          setIsStreamingVoice(false)
          if (stream) {
            playStreamInAudio(stream, feedAICommentaryToAudio)
          }
        })
        .catch(err => {
          console.error(err)
          window.alert(err)
        })
        .finally(() => {
          console.log('Finally')
          setIsAnalyzingImage(false)
          setIsAnalyzingImage(false)
          setIsStreamingVoice(false)
          //setBroadcastText(undefined)
        })
    }
  }

  React.useEffect(() => {
    const camera = getCamera()
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then(stream => {
        camera.srcObject = stream
        camera.onloadedmetadata = () => {
          camera.play()
        }
      })
      .catch(err => {
        console.log(err)
      })
  }, [])

  const inProgress = isAnalyzingImage || isStreamingVoice

  return (
    <>
      <h1 className="text-left text-5xl mb-8 text-violet-400 font-semibold">
        Generative Video & Voice AI sportscaster
      </h1>
      <div className="grid grid-cols-2 gap-8">
        <video controls playsInline id="camera" className="w-full rounded-xl shadow-md" />
        <div className="text-left">
          {config ? (
            <>
              {!isInProgress && (
                <div className="inline-flex gap-4">
                  <Button
                    className={inProgress ? 'bg-gray-400 hover:bg-gray-600' : 'bg-green-500 hover:bg-green-700'}
                    onClick={feedAICommentaryToAudio}
                    disabled={inProgress}
                    children="Start narration"
                  />
                  <Button className="bg-red-600 hover:bg-red-700" onClick={onDeleteConfig}>
                    Delete API keys
                  </Button>
                </div>
              )}
              <div className="flex flex-col mt-4 gap-2 text-slate-400">
                {isAnalyzingImage && <LoadingText text="Analyzing image" />}
                {isStreamingVoice && <LoadingText text="Streaming voice" />}
                {broadcastText && <div className="text-xl">{broadcastText}</div>}
              </div>
              <audio controls id="audio" style={{ opacity: 0 }} />
            </>
          ) : (
            <ConfigForm onSubmit={onSaveConfig} />
          )}
        </div>
      </div>
    </>
  )
}

export default App
