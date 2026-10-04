import io
import logging
import socket
import sys
from typing import List

from mad_app.config import settings

logger = logging.getLogger("network")


def get_lan_ip_addresses() -> List[str]:
    """
    Returns unique non-loopback IPv4 addresses for this machine,
    with the primary routed LAN IP listed first.
    """
    ips: List[str] = []

    # 1. Explicitly configured host IP (e.g. passed to Docker container)
    if settings.HOST_LAN_IP and settings.HOST_LAN_IP.strip():
        configured = settings.HOST_LAN_IP.strip()
        if configured not in ips:
            ips.append(configured)

    # 2. Detect default routed interface IP (best for active Wi-Fi/Ethernet)
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.settimeout(0.5)
            # Connecting to a public address determines the routing interface without sending packets
            s.connect(("8.8.8.8", 80))
            routed_ip = s.getsockname()[0]
            if (
                routed_ip
                and not routed_ip.startswith("127.")
                and not routed_ip.startswith("169.254.")
                and routed_ip not in ips
            ):
                ips.append(routed_ip)
    except Exception:
        pass

    # 3. Check hostname-associated addresses
    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None, socket.AF_INET):
            ip = info[4][0]
            if (
                ip
                and not ip.startswith("127.")
                and not ip.startswith("169.254.")
                and ip not in ips
            ):
                ips.append(ip)
    except Exception:
        pass

    return ips


def render_ascii_qr(data: str) -> str:
    """Renders a text-based ASCII QR code for terminal display."""
    try:
        import qrcode

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=1,
            border=1,
        )
        qr.add_data(data)
        qr.make(fit=True)

        output = io.StringIO()
        qr.print_ascii(out=output, invert=True)
        return output.getvalue()
    except Exception as e:
        logger.debug(f"Could not render ASCII QR code: {e}")
        return ""


def log_startup_lan_banner():
    """Logs the network endpoints and terminal QR code on server start."""
    ips = get_lan_ip_addresses()
    port = settings.BACKEND_PORT

    banner_lines = [
        "",
        "=" * 64,
        f"  [RebootMind] {settings.PROJECT_NAME} v{settings.VERSION}",
        "=" * 64,
        "  Local Address:",
        f"    http://localhost:{port}",
    ]

    if ips:
        banner_lines.append("")
        banner_lines.append("  [+] Multi-Device LAN URLs (Same Wi-Fi):")
        for ip in ips:
            banner_lines.append(f"    http://{ip}:{port}")

        primary_url = f"http://{ips[0]}:{port}"
        banner_lines.append("")
        banner_lines.append("  [>] For Phone App / Other Devices:")
        banner_lines.append(f"      Backend API & Socket: {primary_url}")
        banner_lines.append(f"      Web UI (if active):   http://{ips[0]}:3000")

        qr_text = render_ascii_qr(primary_url)
        if qr_text:
            banner_lines.append("")
            banner_lines.append(f"  [#] Scan Server Address (QR Code for {primary_url}):")
            banner_lines.append(qr_text)
    else:
        banner_lines.append("  [!] No active LAN network interface detected.")
        banner_lines.append("      Ensure device is connected to Wi-Fi or Ethernet.")

    banner_lines.append("=" * 64)
    banner_lines.append("")

    # Safe print handling for Windows consoles
    message = "\n".join(banner_lines)
    try:
        print(message, flush=True)
    except UnicodeEncodeError:
        # Fallback to ascii replacement if console encoding is restrictive
        print(message.encode(sys.stdout.encoding or "utf-8", errors="replace").decode(sys.stdout.encoding or "utf-8"), flush=True)
