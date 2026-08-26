import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Xwégán — Gestion locative pour l'Afrique de l'Ouest";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0b3d2e 0%, #0f5132 55%, #146c43 100%)",
          color: "white",
          fontFamily: "sans-serif",
          padding: 60,
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: -2 }}>
          Xwégán
        </div>
        <div
          style={{
            fontSize: 36,
            opacity: 0.92,
            marginTop: 24,
            textAlign: "center",
            maxWidth: 920,
          }}
        >
          Gestion locative pour l&apos;Afrique de l&apos;Ouest
        </div>
        <div style={{ fontSize: 28, opacity: 0.82, marginTop: 28 }}>
          Loyers · Quittances · Pannes · Litiges
        </div>
      </div>
    ),
    { ...size },
  );
}
