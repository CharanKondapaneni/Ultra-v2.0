export interface JourneyPhase {
  id: string
  index: number
  name: string
  emotion: number
  emotionLabel: string
  touchpoints: string[]
  action: string
  thought: string
  painPoints: string[]
  opportunity: string
  momentOfTruth?: boolean
  momentLabel?: string
  demoStep?: string
  flowKey?: string
  futureEmotion?: number
}

export interface Journey {
  scenario: string
  timeframe: string
  baselineSatisfaction: number
  baselineScale?: number
  baselineNote: string
  illustrative?: boolean
  phases: JourneyPhase[]
  futureLabel?: string
  futureNote?: string
  traceability?: Array<{ phase: string; painPoint: string; signal: string; signalId?: string; demoStep?: string }>
}

export type Point = [number, number]
