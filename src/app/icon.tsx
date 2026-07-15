import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F766E',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 2.5,
          width: 16,
          height: 18,
          background: 'white',
          borderRadius: 2.5,
          paddingLeft: 4,
          paddingRight: 3,
        }}
      >
        <div style={{ width: '100%', height: 1.5, background: '#0F766E' }} />
        <div style={{ width: '100%', height: 1.5, background: '#0F766E' }} />
        <div style={{ width: '70%', height: 1.5, background: '#0F766E' }} />
      </div>
    </div>,
    { ...size },
  )
}
