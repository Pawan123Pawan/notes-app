import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F766E',
        borderRadius: 36,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 12,
          width: 84,
          height: 100,
          background: 'white',
          borderRadius: 12,
          paddingLeft: 20,
          paddingRight: 16,
        }}
      >
        <div style={{ width: '100%', height: 8, background: '#0F766E' }} />
        <div style={{ width: '100%', height: 8, background: '#0F766E' }} />
        <div style={{ width: '70%', height: 8, background: '#0F766E' }} />
      </div>
    </div>,
    { ...size },
  )
}
