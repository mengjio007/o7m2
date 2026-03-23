interface MiningMessage {
  challenge: string
  targetHash: string
  difficulty: number
}

interface MiningResult {
  type: 'success' | 'progress'
  nonce?: string
  hashRate: number
  attempts: number
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function mine(challenge: string, targetHash: string): Promise<MiningResult> {
  let nonce = 0
  let hashCount = 0
  const startTime = performance.now()

  while (true) {
    const hash = await sha256(challenge + nonce.toString())
    hashCount++

    if (hash.startsWith(targetHash)) {
      const elapsed = (performance.now() - startTime) / 1000
      return {
        type: 'success',
        nonce: nonce.toString(),
        hashRate: Math.round(hashCount / elapsed),
        attempts: hashCount,
      }
    }

    nonce++

    // Report progress every 1000 iterations
    if (nonce % 1000 === 0) {
      const elapsed = (performance.now() - startTime) / 1000
      self.postMessage({
        type: 'progress',
        hashRate: Math.round(hashCount / elapsed),
        attempts: hashCount,
      })
    }

    // Yield to prevent blocking
    if (nonce % 10000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }
}

self.onmessage = async (e: MessageEvent<MiningMessage>) => {
  const { challenge, targetHash } = e.data
  const result = await mine(challenge, targetHash)
  self.postMessage(result)
}

export {}
