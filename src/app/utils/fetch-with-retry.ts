function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const backupApiKeys = [
  "AIzaSyDZmpBf9FfciLA70iXKb5xCmRv4_C1gQdg",
  "AIzaSyBvFZ95fFihWvsU1y_MyUPog9wAc6MGwgM",
  "AIzaSyD_nNj69ny_xpn_zw9xq-Jn2SqeKVIdNbk",
  "AIzaSyA0W9OssAPQE39iHlVoBGNxpTeXTh1p_4U",
  "AIzaSyD76fm4WIyiG-0dAA9NM_QniJWHhpmgvXs",
  "AIzaSyCINGgaYkMy1L2vSavql9a7vVKuz9hE2os",
  "AIzaSyApv6sMjv_S6x8AjifvXxKWw4az5EV-B2A",
  "AIzaSyDGEyV7HsZa1x2sPxL2WlaocbJZ3MQASQM",
  "AIzaSyA_pONzlCOacJIPSR5IzyuyUpJ6hjfBZQs",
  "AIzaSyBRCJnXbfsGkCAshoHhmbYg2_9QiCvBh4M",
  "AIzaSyADy4gAIrx3KxAVTn8BrZe0jiiG3vd5Kig",
  "AIzaSyD4XmvjgtBy7Mg6erCJM6bo2Trbz3mkARE",
  "AIzaSyB6ss5LyQZ0DpYCxg48B1srKfyh0oxHWs4",
  "AIzaSyBCoH__3RV5IllD_sbACQljotTzhRytosI",
]

const COOLDOWN_PERIOD = 60000
const AVAILABLE_MODELS = ["gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.5-flash", "gemma-3n-e4b-it"]

let currentModelIndex = 0

export async function fetchWithRetry(
  query: string,
  maxRetries = 3,
  delayBetweenRetries = 1000
): Promise<string> {
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      return await fetchGeminiResponse(query)
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("429") && attempt < maxRetries - 1) {
        await delay(delayBetweenRetries)
        attempt++
      } else {
        console.error("Max retries reached or different error occurred.", error)
        return "Error fetching answer."
      }
    }
  }
  return "Error fetching answer."
}


async function fetchGeminiResponse(query: string): Promise<string> {
  const model = AVAILABLE_MODELS[currentModelIndex]
  let apiKey = await getApiKey()
  if (!apiKey) {
    apiKey = await getAvailableBackupKey()
  }

  const url = (key: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

  const options = (key: string) => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: query }] }] }),
  })

  try {
    let response = await fetch(url(apiKey), options(apiKey))

    if (!response.ok) {
      if (response.status === 429) {
        await markKeyAsLimited(apiKey)
      }
      apiKey = await getAvailableBackupKey()
      response = await fetch(url(apiKey), options(apiKey))

      if (!response.ok) {
        if (response.status === 429) {
          await markKeyAsLimited(apiKey)
        }
        throw new Error(`${response.status} Error with both primary and backup keys`)
      }
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
  } catch (error) {
    switchToNextModel()
    return await fetchGeminiResponse(query)
  }
}

async function getApiKey(): Promise<string> {
  try {
    return localStorage.getItem("apikey_coursera_extension") || ""
  } catch (error) {
    console.error("Error getting API key:", error)
    return ""
  }
}

async function getKeyStatuses(): Promise<Record<string, number>> {
  try {
    const statuses = localStorage.getItem("key_statuses")
    return statuses ? JSON.parse(statuses) : {}
  } catch (error) {
    console.error("Error getting key statuses:", error)
    return {}
  }
}

async function saveKeyStatuses(statuses: Record<string, number>): Promise<void> {
  try {
    localStorage.setItem("key_statuses", JSON.stringify(statuses))
  } catch (error) {
    console.error("Error saving key statuses:", error)
  }
}

async function markKeyAsLimited(key: string): Promise<void> {
  const statuses = await getKeyStatuses()
  statuses[key] = Date.now()
  await saveKeyStatuses(statuses)
}

async function getAvailableBackupKey(): Promise<string> {
  const statuses = await getKeyStatuses()
  const now = Date.now()
  const availableKeys = backupApiKeys.filter((key) => {
    const lastLimited = statuses[key] || 0
    return now - lastLimited > COOLDOWN_PERIOD
  })

  if (availableKeys.length === 0) {
    const oldestKey = backupApiKeys.reduce(
      (oldest, key) => {
        const time = statuses[key] || 0
        return time < oldest.time ? { key, time } : oldest
      },
      { key: backupApiKeys[0], time: Number.POSITIVE_INFINITY },
    ).key
    return oldestKey
  }
  const randomIndex = Math.floor(Math.random() * availableKeys.length)
  return availableKeys[randomIndex]
}

function switchToNextModel(): void {
  currentModelIndex = (currentModelIndex + 1) % AVAILABLE_MODELS.length
  console.log(`Switched to model: ${AVAILABLE_MODELS[currentModelIndex]}`)
}
