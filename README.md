# Call of Washed: WarTime

Versión actual: **3.3.0** (16-XI-2026). Juego en un solo HTML: `dist/Call of Washed.html`.


El juego se entrega como **un solo HTML**; este árbol es la fuente desde la que se arma.

```
src/
  index.tpl.html     esqueleto del HTML (marcadores @@css@@, @@include ...@@, @@modules@@)
  html/body.html     marcado del juego (menús, HUD, canvas)
  css/*.css          estilos, en orden alfabético
  js/*.js            módulos, en el orden de src/modules.txt (todos comparten un único ámbito de módulo)
  modules.txt        orden de armado de js/
tools/
  build.py           python3 tools/build.py [salida]   → dist/Call of Washed.html
  verify.py          python3 tools/verify.py otro.html → IGUAL / DIFERENTE (ignora las cabeceras de módulo)
  patchlib.py        rep(archivo, viejo, nuevo) y where(texto) para editar con reemplazos exactos
  split.py           (una sola vez) cómo se partió el archivo único en módulos
test/                pruebas con Playwright (necesitan three y cannon-es instalados con npm, ver test/lib.js)
```

Flujo: editar `src/` → `python3 tools/build.py` → probar el HTML de `dist/`.

Los módulos NO son módulos ES independientes: se concatenan dentro de un único `<script type="module">`, así que una
función o constante de un archivo se ve desde cualquier otro (siempre que esté declarada antes de usarse al ejecutarse).

## Módulos de `js/`
| archivo | contenido |
|---|---|
| 00_config | CONFIG: balance y ajustes (armas, accesorios, ventajas, clases, rachas, desbloqueos) |
| 01_util | matemáticas, RNG, almacenamiento, eventos |
| 02_input | teclado, ratón, gamepad |
| 03_physics | bloques AABB, rayos, colisión |
| 04_movement | movimiento del soldado |
| 05_camera | cámara en 1ª y 3ª persona |
| 06_ragdoll | ragdoll |
| 07_weapons | disparo, retroceso, balas |
| 07b_loadout | clases, accesorios, progreso, respaldo |
| 07c_tactical | humo, rachas (avioneta de reconocimiento, mortero, bombardero bimotor de hélice, caja en paracaídas) |
| 07d_ballistics | balística de tiro largo (W.longRange): gravedad, rozamiento, viento por partida, alza 100–1000 m, respiración y pulso |
| 08_entities | materiales, geometrías, accesorios de época, telas, uniformes (antes operadores) |
| 08f_guns | modelos procedurales de las armas de época (1939–45) |
| 08a_fighter | estado de simulación del soldado |
| 08b_soldierview | modelo y animación del soldado |
| 08c_corpses | cuerpos |
| 08d_viewmodel | arma y manos en primera persona |
| 08e_outfits | ropa civil (paciente, recluso, guardia), aspecto y animación de los infectados |
| 09_maps / 09b_mapdefs / 09c_smallmaps | sistema de mapas y definiciones (incluye el campo de tiro) |
| 09d_prison | mapa de la cárcel (modo historia): enfermería, pasillo, almacén |
| 09e_furgon | mapa mínimo del furgón (interludios de campaña; el interior lo arma 12f) |
| 10_props | objetos sueltos y escombros |
| 11_ai | bots |
| 12_rules / 12b_modes | reglas y modos |
| 12c_zombies | modo Cárcel: infectados (ZombieBrain), ataques (zarpazo, agarre, mordisco, reptante), guion, linterna |
| 12d_inventory | modo Cárcel: inventario, bolsillos, equipo (mochila, bolso, chaleco), objetos y lanzables |
| 12e_campaign | campaña El Relojero: datos de Partes y misiones (cabeceras exactas), progreso `cow.camp`, migración 3.0, Modo lector |
| 12f_scenes | motor de escenas: cabeceras, textos, elecciones, «Mirar», cámara sentada; set del furgón y guion de El furgón I |
| 13_fx / 13c_post | efectos y posproceso |
| 14_net | red |
| 15a_strings | textos es/en |
| 15b_ui | menús, HUD |
| 16_audio | sonido |
| 17_replay | repetición de la baja |
| 18_loop | bucle principal |

## Pruebas de la 3.0
`test/camp.js` (menú, Modo lector y El furgón I completo), `test/regress.js` (MP, campo de tiro, Cárcel, migración de perfil 2.x y códigos CW2; `OLD=` ruta de la 2.13.2), `test/shots.js` (capturas). Ejecutar con `COW_DEPS=deps/node_modules/`.

## Fase 1 · Época (3.1.0)
- Armas, accesorios, rachas, uniformes y facciones de la época; sin operadores modernos. Facciones por partida: `cfg.fac` (`CONFIG.MATCHUPS`).
- `test/longrange.js`: tiro a 626 m desde la torre del campo de tiro (alza 100 cae corto, alza 600 acierta, viento 4 m/s desvía).
- `test/lineup.js` (uniformes por facción), `test/streakshot.js`, `test/menushots.js`, `test/wsheet.js` (hoja de iconos de armas), `test/fpw2.js` (primera persona).
- Dificultad de campaña: `CONFIG.CAMP_DIFF` (lectura, recluta, veterano, relojero), guardada en `cow.camp.diff`.
- Menú: `css/60_period.css` (expediente de época; fuentes Stardos Stencil, IM Fell English, Special Elite).
