import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Parse parameters
    const title = searchParams.get("title") || "ChampsArena Tournament";
    const game = searchParams.get("game") || "ESPORTS";
    const prize = searchParams.get("prize") || "0";
    const date = searchParams.get("date") || "TBD";

    const gameLabel = game.replace("_", " ");
    const prizeFormatted = parseFloat(prize) > 0 
      ? `$${parseFloat(prize).toLocaleString()}`
      : "Free Entry";

    // Return the generated image response
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            backgroundColor: "#f3f4f6", // Light surface container
            backgroundImage: "radial-gradient(circle at 25px 25px, #1a1a1a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1a1a1a 2%, transparent 0%)",
            backgroundSize: "100px 100px",
            padding: "60px",
            border: "20px solid #1a1a1a", // Bold border
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Top Row: Brand & Game Badge */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#1a1a1a",
                color: "#ffffff",
                padding: "10px 24px",
                fontSize: "24px",
                fontWeight: "900",
                textTransform: "uppercase",
                border: "4px solid #1a1a1a",
                boxShadow: "4px 4px 0px #ff3b30",
              }}
            >
              CHAMPSARENA
            </div>
            <div
              style={{
                display: "flex",
                backgroundColor: "#ffcc00", // Accent Yellow
                color: "#1a1a1a",
                padding: "10px 24px",
                fontSize: "20px",
                fontWeight: "900",
                textTransform: "uppercase",
                border: "4px solid #1a1a1a",
                boxShadow: "4px 4px 0px #1a1a1a",
              }}
            >
              {gameLabel}
            </div>
          </div>

          {/* Middle: Tournament Name */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              width: "100%",
              margin: "40px 0",
            }}
          >
            <div
              style={{
                fontSize: "56px",
                fontWeight: "900",
                color: "#1a1a1a",
                textTransform: "uppercase",
                lineHeight: "1.1",
                maxWidth: "950px",
                wordBreak: "break-word",
                display: "flex",
                flexWrap: "wrap",
              }}
            >
              {title}
            </div>
          </div>

          {/* Bottom Row: Date & Prize Pool */}
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            {/* Date Details */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                backgroundColor: "#ffffff",
                padding: "16px 28px",
                border: "4px solid #1a1a1a",
                boxShadow: "6px 6px 0px #1a1a1a",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "900",
                  color: "#1a1a1a",
                  opacity: 0.6,
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Tournament Date
              </span>
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: "900",
                  color: "#1a1a1a",
                  textTransform: "uppercase",
                }}
              >
                {date}
              </span>
            </div>

            {/* Prize Pool Details */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                backgroundColor: "#ff3b30", // Accent Red
                padding: "16px 28px",
                border: "4px solid #1a1a1a",
                boxShadow: "6px 6px 0px #1a1a1a",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: "900",
                  color: "#ffffff",
                  opacity: 0.8,
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Total Prize Pool
              </span>
              <span
                style={{
                  fontSize: "36px",
                  fontWeight: "900",
                  color: "#ffffff",
                  textTransform: "uppercase",
                  lineHeight: "1",
                }}
              >
                {prizeFormatted}
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error("Failed to generate OG image:", error);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}
