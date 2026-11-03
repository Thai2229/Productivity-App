// Everything the page needs to talk to /api/internships

export type Stage =
  | 'APPLIED'
  | 'SCREENING'
  | 'EARLY_INTERVIEW'
  | 'FINAL_INTERVIEW'
  | 'OFFER'
  | 'REJECTED'

export type Internship = {
  id: string
  company: string
  role: string
  stage: Stage
  location: string | null
  link: string | null
  appliedOn: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

// What the form sends. Blank strings tell the server to clear a field.
export type InternshipDraft = {
  company: string
  role: string
  stage: Stage
  location: string
  link: string
  appliedOn: string
  notes: string
}

// Same order as the server's enum, so lists show the pipeline in order
export const STAGES: { value: Stage; label: string }[] = [
  { value: 'APPLIED', label: 'Applied' },
  { value: 'SCREENING', label: 'Screening' },
  { value: 'EARLY_INTERVIEW', label: 'Early interviews' },
  { value: 'FINAL_INTERVIEW', label: 'Final interview' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'REJECTED', label: 'Rejected' },
]

export function stageLabel(stage: Stage) {
  const match = STAGES.find((item) => item.value === stage)
  if (!match) {
    return stage
  }
  return match.label
}

// Sends a request and turns server errors into thrown Errors with the server's message
async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  const options: RequestInit = { method, headers: {} }

  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' }
    options.body = JSON.stringify(body)
  }

  const response = await fetch('/api/internships' + path, options)

  if (response.status === 204) {
    return undefined as T
  }

  let data: { error?: string }
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(data.error || 'Request failed (' + response.status + ')')
  }

  return data as T
}

export async function listInternships() {
  const data = await request<{ internships: Internship[] }>('', 'GET')
  return data.internships
}

export async function createInternship(draft: InternshipDraft) {
  const data = await request<{ internship: Internship }>('', 'POST', draft)
  return data.internship
}

export async function updateInternship(id: string, changes: Partial<InternshipDraft>) {
  const data = await request<{ internship: Internship }>('/' + id, 'PATCH', changes)
  return data.internship
}

export async function deleteInternship(id: string) {
  await request<void>('/' + id, 'DELETE')
}