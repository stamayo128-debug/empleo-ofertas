# Ofertas

Web privada de una sola persona para gestionar ofertas de empleo. Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4. Los datos viven en Postgres (Supabase); el navegador nunca habla con Supabase: todo pasa por el servidor con la clave secreta (`lib/db.ts`, `server-only`).

## Variables de entorno (ninguna con prefijo `NEXT_PUBLIC_`)

| Variable | Contenido |
|---|---|
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SECRET_KEY` | clave secreta de Supabase |
| `APP_PASSWORD_HASH` | `scrypt:N:r:p:saltHex:hashHex` (lo genera el script) |
| `SESSION_SECRET` | 32 bytes aleatorios en base64url (mínimo 32 caracteres) |
| `SESSION_VERSION` | `1`; súbelo y redespliega para cerrar todas las sesiones |
| `CRON_SECRET` | aleatorio (mínimo 16 caracteres); Vercel lo envía como `Authorization: Bearer` al cron |

Ver `.env.example`. En local van en `.env.local` (ignorado por git).

## Generar contraseña y hash

```bash
node scripts/gen-password.mjs
```

Imprime una contraseña aleatoria de 24 caracteres y su hash. Guarda la contraseña en tu gestor; el hash va en `APP_PASSWORD_HASH`. Para `SESSION_SECRET` y `CRON_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

La cookie de sesión es `Secure`: en `http://localhost` funciona en Chrome/Firefox, no en todos los navegadores.

## Despliegue (Vercel)

1. Importa el repositorio en Vercel (Hobby). `vercel.json` fija la región `dub1` (Irlanda, como la base) y el cron diario `0 12 * * *` hacia `/api/keepalive`.
2. En Project Settings → Environment Variables, añade las seis variables (marcadas como *Sensitive*) en Production y Preview.
3. Despliega. Deja activada la Deployment Protection de Vercel para las previews.

`/api/keepalive` hace una consulta mínima y borra los `login_intentos` de más de 30 días; solo responde con el Bearer correcto.

## Base de datos

La base ya existe; esta app no crea ni modifica el esquema. Usa las tablas `ofertas`, `descartes`, `ejecuciones`, `busquedas`, `eventos_oferta`, `contactos`, `login_intentos`, `criterios_busqueda` (una fila activa) y `agente_notas`; las vistas `v_ofertas_web` (ofertas con columnas calculadas: municipio, experiencia, enviada, tiene_salario, es_remoto, tramo_experiencia, orden_enviadas y, desde la migración 0007, `url_principal`, `plataforma_principal`, `fuentes` (jsonb), `n_fuentes`, `por_verificar`, `verificar_motivo`, `verificada_en`, `posible_duplicada_de`, `posible_duplicada_codigo`, `cv_doc_url`, `cv_doc_version`, `cv_doc_creado_en`, `mensaje_actualizado_en`, `descarte_usuario_motivo`, `descarte_usuario_detalle` y `descartada_en`), `v_cuadre_busquedas_v2` y `v_descartes_motivos`; y las funciones RPC `marcar_enviadas(p_ids)`, `revertir_envios(p_items)` y, desde la 0007, `descartar_ofertas(p_ids, p_motivo, p_detalle)`, `revertir_descartes(p_items)`, `marcar_verificada(p_id, p_verificada)` y `fusionar_ofertas(p_principal, p_duplicada)`. La tabla `ofertas_fuentes` (una fila por URL de cada oferta) solo se lee a través de la columna `fuentes` de la vista; `descartes.fusionado_en` oculta de la pantalla Descartes los duplicados ya absorbidos como fuente de otra oferta.

**Requiere la migración 0007**: sin las columnas nuevas de `v_ofertas_web` y sin `descartes.fusionado_en` las pantallas fallan.

## Pantallas

- **Ofertas (`/`)**: pestañas Hoy, Por revisar, Por verificar, Por enviar, Enviadas y Todas (los enlaces antiguos con `tab=seguimiento` se tratan como Enviadas). Filtros por zona, modalidad (`mod`), experiencia (`exp`), salario (`sal`), y en "Más filtros" plataforma, estado y encaje; el buscador de texto mira puesto, empresa, lugar y municipio. En el móvil todos los filtros están en una hoja.
- **Tarjeta compacta**: línea de estado (Nueva, seguimiento vencido, Por verificar, Descartada y su motivo) con el encaje a la derecha; puesto; empresa · lugar · modalidad; resumen de una línea (solo si la ficha está leída); y una línea de datos con fecha, plataforma principal (`+N` si la oferta está en más sitios), salario y "Ficha básica". Las acciones dependen de la pestaña: **Por enviar** (casilla y "Marcar como enviada"), **Por verificar** ("Ya está verificada"); en todas, "Abrir oferta" hacia `url_principal`.
- **Panel de detalle**: cabecera con las acciones (Abrir oferta, Marcar como enviada, **Copiar mensaje** si hay mensaje, **Abrir CV vN** si hay `cv_doc_url`, Copiar enlace y **Descartar…**). Después, avisos (Por verificar, Descartada con motivo y nota, ficha básica o parcial) y secciones plegables: Encaje, De un vistazo y Este puesto va de… (abiertas); Qué harás, Requisitos, Herramientas e idiomas, Qué ofrecen, **Dónde se publica (N)** (cada fuente con plataforma, tipo, enlace y fecha de primera vez vista; los agregadores van agrupados), Candidatura, Respuesta, Contacto publicado, Notas, Historial y Datos técnicos. Si la ficha no está leída, el panel lo dice: "Aún no hemos leído el anuncio: solo tenemos título, empresa y lugar del listado. Ábrelo para ver los detalles."
- **Por verificar**: ofertas con enlace roto o genérico, ficha imposible de leer, posible duplicado o datos contradictorios (`por_verificar`, con su `verificar_motivo`). En el panel, **Ya está verificada** (con Deshacer) y, si hay `posible_duplicada_de`, **Fusionar con OF-x** (pide confirmación; la oferta abierta pasa a Descartada y OF-x conserva sus fuentes y datos) y **Ver OF-x**.
- **Descartes manuales**: **Descartar…** (panel, y "Descartar seleccionadas" en la barra de lote de Por enviar) abre un diálogo con motivo de lista cerrada (No me interesa, Nivel demasiado alto, Piden demasiada experiencia, Ubicación, Sector o empresa, Condiciones, Ya está cerrada, Duplicada, Otro) y nota opcional de hasta 300 caracteres; el aviso trae **Deshacer**. Las descartadas se ven en Ofertas → Todas → "Incluir descartadas" (la tarjeta dice "Descartada: motivo" y el panel indica quién la descartó, cuándo y la nota) y en la sección plegable **Descartadas por ti (N)** de `/descartes`.
- **Criterios (`/criterios`)**: formulario para editar los criterios que lee la búsqueda diaria (listas de una entrada por línea, números, interruptores y textos largos) y bloque plegable "Lo que recuerda el agente" con las notas activas y el botón Archivar.
- **Descartes (`/descartes`)** e **Historial (`/historial`)**: el historial muestra los resultados del scraper y la cola pendiente por búsqueda.

## Marcado de solicitudes enviadas

- Cada oferta pendiente tiene el botón **Marcar como enviada** (tarjeta y panel de detalle). Pasa a Postulado, fija la fecha de envío y el próximo seguimiento (lo calcula la función `marcar_enviadas`) y muestra un aviso con **Deshacer**.
- En la pestaña **Por enviar**, **Seleccionar varias** activa casillas en las tarjetas y una barra inferior para marcar hasta 200 ofertas de una vez.
- Al abrir una oferta pendiente con "Abrir oferta", se guarda su id en `sessionStorage` (si el navegador lo permite) y, al volver a la pestaña, aparece "¿Enviaste la solicitud a X?" con la acción "Sí, marcar" (10 s).

## Acciones del servidor

Todas empiezan con `requireSession()` y validan la entrada con zod `strictObject` (rechazan campos extra): `actualizarOferta`, `recuperarDescarte`, `marcarEnviadas`, `deshacerEnvios`, `descartarOfertas`, `deshacerDescartes`, `marcarVerificada`, `fusionarOfertas`, `guardarCriterios` y `archivarNota`. Todas devuelven `{ ok, error }`; los campos nuevos de la 0007 no se editan con `actualizarOferta`, van por RPC.

El Excel (`/api/export`) añade al final de la hoja Ofertas las columnas "Otras fuentes", "Por verificar", "Motivo descarte (tú)" y "CV adaptado (Drive)".

<!-- Despliegue automático desde GitHub a Vercel activado. -->
