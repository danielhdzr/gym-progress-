# Gym Progress 🏋️

App web (PWA) para registrar tus entrenos y **progresar con sobrecarga progresiva**. En cada sesión te dice qué peso y cuántas reps intentar según lo que hiciste la última vez.

## Funciones

- **Sugerencias de progresión** (doble progresión): mismo peso y +1 rep hasta llegar al tope del rango en todas las series; después sube el peso. Si fallas el mínimo dos sesiones seguidas, sugiere un deload de −10%.
- **Registro rápido**: las series vienen precargadas con la sugerencia; solo ajustas y marcas ✓.
- **Temporizador de descanso** automático al marcar una serie (vibra al terminar).
- **Rutinas editables**: incluye Push / Pull / Legs de ejemplo.
- **Progreso**: gráfica de 1RM estimado (Epley), peso máximo y % de mejora por ejercicio.
- **Detección de estancamiento**: avisa si un ejercicio lleva 3 sesiones sin mejorar.
- **Récords personales** al terminar cada entreno.
- **Volumen semanal** por músculo comparado con el rango de 10–20 series.
- **Registrar entrenos pasados y editar el historial**: las sugerencias y los récords se recalculan según la fecha.
- **RPE y notas**: anota qué tan pesada fue cada serie (1–10). Si llegaste al fallo la app no sube el peso; si fue fácil, pide +2 reps.
- **Calculadora de discos y calentamiento**: discos por lado para cada peso y una rampa de calentamiento (barra, 40/60/80 %), según tu barra y tus discos.
- **Peso corporal** con gráfica de evolución.
- **Funciona sin internet**, y los datos se guardan en el dispositivo. Puedes exportar e importar un respaldo en JSON.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173 (y en tu red local para probar desde el celular)
npm test         # pruebas de la lógica de progresión
npm run build    # genera dist/
```

## Usarla en el celular

La app se publica en GitHub Pages con:

```bash
npm run deploy
```

Esto corre las pruebas, compila y sube `dist/` a la rama `gh-pages`. GitHub activa Pages automáticamente con esa rama y el sitio se actualiza en ~1 minuto.

Después abre `https://danielhdzr.github.io/gym-progress-/` en el celular y elige **Agregar a pantalla de inicio** (Safari en iPhone) o **Instalar app** (Chrome en Android).

## Publicar en App Store / Play Store (más adelante)

La app se puede envolver con [Capacitor](https://capacitorjs.com/) sin reescribirla:

```bash
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
npx cap init "Gym Progress" com.tuusuario.gymprogress --web-dir dist
npm run build && npx cap add ios && npx cap add android
npx cap open ios   # o android
```

## Estructura

```
src/
  lib/progression.ts   # lógica de sugerencias, 1RM, estancamiento, récords
  lib/workout.ts       # crear y terminar entrenos
  lib/store.tsx        # estado + persistencia en localStorage
  lib/defaults.ts      # ejercicios y rutinas iniciales
  components/          # pantallas (Entrenar, Progreso, Historial, Ajustes)
```
