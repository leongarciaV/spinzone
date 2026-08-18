# SpinZone

PWA de spinning guiado por frecuencia cardiaca. Se conecta a un pulsómetro
compatible mediante Web Bluetooth, muestra el esfuerzo real frente al circuito
objetivo y ofrece avisos de voz durante el entrenamiento.

## Desarrollo

Requisitos: Node.js 22.13 o posterior.

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Verificación

```bash
npm run build
```

## Despliegue

El proyecto usa Next.js estándar y está preparado para desplegarse en Vercel.
Los cambios enviados a la rama `main` se publican automáticamente cuando el
repositorio está conectado a un proyecto de Vercel.

Web Bluetooth requiere HTTPS en producción. En iPhone debe utilizarse un
navegador que implemente Web Bluetooth.
