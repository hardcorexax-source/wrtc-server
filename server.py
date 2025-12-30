import asyncio
import json
import sys
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer
from aiortc.contrib.signaling import BYE
import websockets

SIGNALING_URL = "wss://my-api-test-domen.pp.ua"

CONFIG = RTCConfiguration(
    iceServers=[RTCIceServer(urls=["stun:stun.l.google.com:19302"])]
)


class ServerPeer:
    def __init__(self):
        self.pc = None
        self.dc = None
        self.ws = None

    async def init_peer(self):
        print("🚀 Starting peer...")

        if self.pc:
            await self.cleanup()

        self.pc = RTCPeerConnection(configuration=CONFIG)

        # DataChannel
        self.dc = self.pc.createDataChannel("content")

        @self.dc.on("open")
        def on_open():
            print("✅✅✅ DATA CHANNEL OPENED!")
            asyncio.create_task(self.stdin_loop())

        @self.dc.on("message")
        def on_message(message):
            print("📨 Received from client:", message)

        @self.dc.on("close")
        def on_close():
            print("🔌 Data channel closed")
            asyncio.create_task(self.reinit())

        @self.dc.on("error")
        def on_error(error):
            print("❌ Data channel error:", error)

        @self.pc.on("iceconnectionstatechange")
        async def on_ice_state():
            print("ICE state:", self.pc.iceConnectionState)
            if self.pc.iceConnectionState in ("failed", "closed"):
                await self.reinit()

        # Offer
        offer = await self.pc.createOffer()
        await self.pc.setLocalDescription(offer)

        print("📡 Generated offer")

        await self.connect_signaling()

    async def connect_signaling(self):
        try:
            self.ws = await websockets.connect(SIGNALING_URL)
            print("✅ WebSocket connected")

            await self.ws.send(json.dumps({
                "role": "server",
                "name": "bot_father",
                "data": {
                    "type": self.pc.localDescription.type,
                    "sdp": self.pc.localDescription.sdp
                },
                "requestTo": "none"
            }))

            print("📤 Offer sent, waiting for answer...")

            async for msg in self.ws:
                data = json.loads(msg)

                if "data" in data and data["data"]["type"] == "answer":
                    print("📥 Answer received")
                    answer = RTCSessionDescription(
                        sdp=data["data"]["sdp"],
                        type=data["data"]["type"]
                    )
                    await self.pc.setRemoteDescription(answer)

        except Exception as e:
            print("❌ WebSocket error:", e)
            await self.reinit()

    async def stdin_loop(self):
        print("⌨️  Type messages, Ctrl+C to exit")
        loop = asyncio.get_event_loop()

        while self.dc and self.dc.readyState == "open":
            msg = await loop.run_in_executor(None, sys.stdin.readline)
            if not msg:
                break
            msg = msg.rstrip("\n")
            self.dc.send(msg)
            print("📤 Sent:", msg)

    async def reinit(self):
        print("🔄 Reinitializing...")
        await self.cleanup()
        await asyncio.sleep(1)
        await self.init_peer()

    async def cleanup(self):
        if self.ws:
            await self.ws.close()
            self.ws = None

        if self.pc:
            await self.pc.close()
            self.pc = None


async def main():
    peer = ServerPeer()
    await peer.init_peer()

    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⛔ stopped")
