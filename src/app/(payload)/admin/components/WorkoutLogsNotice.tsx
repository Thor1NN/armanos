import React from 'react'

type WorkoutLogsNoticeProps = {
  id?: number | string
  payload: {
    count: (args: {
      collection: 'workout-logs'
      limit: number
      where: { workout: { equals: number | string } }
    }) => Promise<{ totalDocs: number }>
  }
}

export async function WorkoutLogsNotice({ id, payload }: WorkoutLogsNoticeProps) {
  if (!id || id === 'create') {
    return null
  }

  const workoutLogs = await payload.count({
    collection: 'workout-logs',
    limit: 1,
    where: { workout: { equals: id } },
  })

  if (workoutLogs.totalDocs === 0) {
    return null
  }

  return (
    <div
      style={{
        background: '#fff7ed',
        border: '1px solid #fdba74',
        borderRadius: 12,
        color: '#7c2d12',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        marginBottom: 16,
        padding: '6px 10px',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 1 }}>
        Ten trening ma juz zapisane logi.
      </div>
      <div style={{ color: '#9a3412', fontSize: 10, lineHeight: 1 }}>
        Nie mozna go usunac ani usuwac istniejacych wierszy cwiczen. Mozesz nadal edytowac
        opisy lub dodawac nowe cwiczenia.
      </div>
    </div>
  )
}
