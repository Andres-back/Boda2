import assert from "node:assert/strict";
import { parseBogotaInput, toBogotaInput, weddingTime, weddingPresentation, publicWeddingEvent } from "../src/lib/wedding-event";

for (const tz of ["UTC", "America/Bogota", "Asia/Tokyo"]) {
  process.env.TZ = tz;
  const ceremony = parseBogotaInput("2026-10-10T14:30");
  assert.equal(ceremony.toISOString(), "2026-10-10T19:30:00.000Z");
  assert.equal(toBogotaInput(ceremony), "2026-10-10T14:30");
  assert.equal(weddingTime(ceremony), "2:30 p. m.");
  assert.equal(toBogotaInput("2026-10-11T02:00:00Z"), "2026-10-10T21:00");
  for (const invalid of ["", "2026-02-30T14:30", "2026-10-10T25:30", "2026-10-10", "2026-10-10T14:30Z"]) {
    assert.ok(Number.isNaN(parseBogotaInput(invalid).getTime()), invalid);
  }
  const event = publicWeddingEvent({
    nombre: "Boda", fecha: ceremony, horaRecepcion: "18:30", lugar: "Iglesia Cruzada Cristiana",
    barrio: "Barrio San Francisco", ciudad: "Mocoa, Putumayo", organizadorWhatsapp: "573209107554",
  });
  const view = weddingPresentation(event);
  assert.equal(view.receptionTime, "6:30 p. m.");
  assert.equal(view.date, "10 de octubre de 2026");
  assert.equal(view.phoneDisplay, "320 910 7554");
  assert.equal(view.whatsappUrl, "https://wa.me/573209107554");
  assert.match(decodeURIComponent(view.mapsUrl), /Iglesia Cruzada Cristiana, Barrio San Francisco, Mocoa, Putumayo/);
  const changed = weddingPresentation({ ...event, fecha: parseBogotaInput("2026-11-15T10:15").toISOString(), lugar: "Otro lugar", horaRecepcion: "12:00", whatsapp: "573001112233" });
  assert.equal(changed.date, "15 de noviembre de 2026");
  assert.equal(changed.ceremonyTime, "10:15 a. m.");
  assert.equal(changed.receptionTime, "12:00 p. m.");
  assert.match(decodeURIComponent(changed.mapsUrl), /Otro lugar/);
  assert.equal(changed.whatsappUrl, "https://wa.me/573001112233");
  assert.deepEqual(Object.keys(event).sort(), ["barrio", "ciudad", "fecha", "horaRecepcion", "lugar", "nombre", "whatsapp"]);
}
console.log("PASS: Colombia timezone, invalid dates, editable presentation, map, WhatsApp and public allowlist.");
