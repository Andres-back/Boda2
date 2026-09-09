from pathlib import Path

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "wedding"
OUTPUT = ROOT / "output" / "pdf" / "Invitacion_Jans_y_Yurleydi_Alejandro_Valencia.pdf"
OPTIMIZED = ROOT / "tmp" / "pdfs" / "optimized-assets"

W, H = A4

LILAC_DARK = HexColor("#4B315F")
LILAC = HexColor("#865DA0")
LILAC_SOFT = HexColor("#DCC8EA")
LILAC_PALE = HexColor("#F4ECF8")
IVORY = HexColor("#FFFCF7")
INK = HexColor("#382C40")
MUTED = HexColor("#716477")
GOLD = HexColor("#B79A5B")


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Georgia", r"C:\Windows\Fonts\georgia.ttf"))
    pdfmetrics.registerFont(TTFont("GeorgiaBold", r"C:\Windows\Fonts\georgiab.ttf"))
    pdfmetrics.registerFont(TTFont("Gabriola", r"C:\Windows\Fonts\Gabriola.ttf"))


def optimized_asset(filename: str, max_edge: int) -> Path:
    source = ASSETS / filename
    destination = OPTIMIZED / filename
    OPTIMIZED.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = image.convert("RGBA")
        image.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)
        image.save(destination, format="PNG", optimize=True)
    return destination


def draw_image_fit(c: canvas.Canvas, path: Path, x: float, y: float, w: float, h: float, opacity: float = 1.0) -> None:
    image = ImageReader(str(path))
    source_w, source_h = image.getSize()
    scale = min(w / source_w, h / source_h)
    draw_w, draw_h = source_w * scale, source_h * scale
    c.saveState()
    c.setFillAlpha(opacity)
    c.drawImage(image, x + (w - draw_w) / 2, y + (h - draw_h) / 2, draw_w, draw_h, mask="auto")
    c.restoreState()


def draw_rotated_image(c: canvas.Canvas, path: Path, cx: float, cy: float, w: float, h: float, angle: float, opacity: float) -> None:
    c.saveState()
    c.translate(cx, cy)
    c.rotate(angle)
    c.setFillAlpha(opacity)
    c.drawImage(ImageReader(str(path)), -w / 2, -h / 2, w, h, mask="auto", preserveAspectRatio=True, anchor="c")
    c.restoreState()


def centered_paragraph(c: canvas.Canvas, text: str, y: float, width: float, style: ParagraphStyle) -> float:
    paragraph = Paragraph(text, style)
    _, height = paragraph.wrap(width, H)
    paragraph.drawOn(c, (W - width) / 2, y - height)
    return height


def draw_background(c: canvas.Canvas) -> None:
    c.setFillColor(IVORY)
    c.rect(0, 0, W, H, stroke=0, fill=1)

    # Soft paper-like lilac haze.
    for index in range(18, 0, -1):
        alpha = 0.005 + (18 - index) * 0.0009
        c.setFillColor(Color(0.73, 0.61, 0.81, alpha=alpha))
        radius = 28 + index * 14
        c.circle(W - 30, H - 145, radius, stroke=0, fill=1)
        c.circle(20, 210, radius * 0.82, stroke=0, fill=1)

    c.setStrokeColor(Color(0.52, 0.36, 0.63, alpha=0.38))
    c.setLineWidth(0.8)
    c.roundRect(20, 20, W - 40, H - 40, 18, stroke=1, fill=0)
    c.setStrokeColor(Color(0.72, 0.61, 0.38, alpha=0.48))
    c.setLineWidth(0.45)
    c.roundRect(27, 27, W - 54, H - 54, 15, stroke=1, fill=0)

    draw_image_fit(c, optimized_asset("generated-botanical.png", 420), 31, H - 145, 125, 125, 0.72)
    draw_image_fit(c, optimized_asset("generated-corner.png", 420), W - 161, 31, 130, 130, 0.48)


def draw_header(c: canvas.Canvas) -> None:
    c.setFillColor(LILAC)
    c.setFont("GeorgiaBold", 8.5)
    c.drawCentredString(W / 2, H - 76, "CON LA BENDICIÓN DE DIOS")

    c.setFillColor(INK)
    c.setFont("Georgia", 18)
    c.drawCentredString(W / 2, H - 108, "Nuestra boda")

    c.setFillColor(LILAC_DARK)
    c.setFont("Gabriola", 57)
    c.drawCentredString(W / 2, H - 164, "Jans & Yurleydi")

    c.setFillColor(MUTED)
    c.setFont("GeorgiaBold", 7.4)
    c.drawCentredString(W / 2, H - 184, "NARVAEZ  •  SOLARTE")

    c.setStrokeColor(LILAC_SOFT)
    c.setLineWidth(0.8)
    c.line(W / 2 - 135, H - 202, W / 2 - 28, H - 202)
    c.line(W / 2 + 28, H - 202, W / 2 + 135, H - 202)
    c.setFillColor(GOLD)
    c.circle(W / 2, H - 202, 2.2, stroke=0, fill=1)

    c.setFillColor(MUTED)
    c.setFont("Georgia", 10.5)
    c.drawCentredString(W / 2, H - 222, "“Lo que Dios ha unido, que no lo separe el hombre.”")
    c.setFont("GeorgiaBold", 6.8)
    c.drawCentredString(W / 2, H - 238, "MARCOS 10:9")


def draw_guest_card(c: canvas.Canvas) -> None:
    x, y, card_w, card_h = 62, 274, W - 124, 310

    c.saveState()
    c.setShadow = None
    c.setFillColor(Color(1, 1, 1, alpha=0.92))
    c.setStrokeColor(Color(0.52, 0.36, 0.63, alpha=0.24))
    c.setLineWidth(0.8)
    c.roundRect(x, y, card_w, card_h, 22, stroke=1, fill=1)
    c.setStrokeColor(Color(0.72, 0.61, 0.38, alpha=0.34))
    c.roundRect(x + 8, y + 8, card_w - 16, card_h - 16, 17, stroke=1, fill=0)
    c.restoreState()

    draw_image_fit(c, optimized_asset("generated-bible-rings.png", 1000), x + 45, y + 135, card_w - 90, 142, 0.92)

    c.setFillColor(LILAC)
    c.setFont("GeorgiaBold", 7.6)
    c.drawCentredString(W / 2, y + 122, "INVITACIÓN PERSONAL")

    c.setFillColor(INK)
    c.setFont("Gabriola", 29)
    c.drawCentredString(W / 2, y + 84, "Sr. Alejandro Valencia")

    c.setStrokeColor(LILAC_SOFT)
    c.line(W / 2 - 118, y + 67, W / 2 + 118, y + 67)

    c.setFillColor(MUTED)
    c.setFont("Georgia", 9.3)
    c.drawCentredString(W / 2, y + 47, "Será una alegría compartir este día contigo")
    c.setFillColor(LILAC_DARK)
    c.setFont("GeorgiaBold", 8)
    c.drawCentredString(W / 2, y + 27, "HEMOS RESERVADO PARA TI 1 LUGAR")


def draw_details(c: canvas.Canvas) -> None:
    draw_image_fit(c, optimized_asset("generated-divider.png", 900), W / 2 - 120, 238, 240, 44, 0.7)

    c.setFillColor(LILAC_DARK)
    c.setFont("Georgia", 17)
    c.drawCentredString(W / 2, 226, "Domingo, 11 de octubre de 2026")
    c.setFillColor(GOLD)
    c.setFont("GeorgiaBold", 8)
    c.drawCentredString(W / 2, 207, "6:00 P. M.")

    location_style = ParagraphStyle(
        "location",
        fontName="Georgia",
        fontSize=9.2,
        leading=13,
        textColor=MUTED,
        alignment=TA_CENTER,
    )
    centered_paragraph(
        c,
        "Iglesia Pentecostal Unida de Colombia - Sede 4<br/>Barrio San Agustín, Mocoa, Putumayo",
        182,
        390,
        location_style,
    )

    c.setFillColor(LILAC)
    c.setFont("GeorgiaBold", 7.2)
    c.drawCentredString(W / 2, 133, "CEREMONIA Y RECEPCIÓN AL FINALIZAR EL SERVICIO")

    c.setFillColor(INK)
    c.setFont("Gabriola", 19)
    c.drawCentredString(W / 2, 106, "Con amor, Jans & Yurleydi")

    map_url = "https://www.google.com/maps/search/?api=1&query=1.144042%2C-76.64302"
    c.setFillColor(LILAC)
    c.setFont("GeorgiaBold", 7.2)
    c.drawCentredString(W / 2, 77, "UBICACIÓN: 1.144042, -76.64302")
    c.linkURL(map_url, (W / 2 - 92, 68, W / 2 + 92, 88), relative=0)


def create_pdf() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    register_fonts()
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    c.setTitle("Invitación de boda - Jans Narvaez y Yurleydi Solarte")
    c.setAuthor("Jans Narvaez y Yurleydi Solarte")
    c.setSubject("Invitación personalizada para Alejandro Valencia")
    draw_background(c)
    draw_header(c)
    draw_guest_card(c)
    draw_details(c)
    c.showPage()
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    create_pdf()
