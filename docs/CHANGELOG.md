# Changelog

## v0.1.0 (en desarrollo)

### Features iniciales

- ✅ Auth con email/password + persistencia con `chrome.storage.local`
- ✅ Banco de respuestas coquetas con seed curado (~60 entradas)
- ✅ Auto-fav al agregar respuestas manuales
- ✅ Filtros por tab: Global / Favoritos con drag & drop
- ✅ Emoji picker custom estilo WhatsApp (351 emojis, búsqueda, multi-select max 4)
- ✅ Modal agregar con texto o solo emojis
- ✅ Scroll en contenedor de burbujas
- ✅ Burbujas que caben en viewport, sin overflow
- ✅ Botón 🎲 genera 50% DB + 50% random
- ✅ Admin puede gestionar usuarios (suspender, role)
- ✅ Admin puede ver favoritos de cualquier usuario
- ✅ Generador IA opcional (MiniMax, OpenAI, Anthropic)
- ✅ Auto-cleanup: 15 días o 50k respuestas
- ✅ Panel admin en Configuración

### Reglas de negocio establecidas

- Solo masculino o neutro (amor, mor, cariño, papi, bb, etc.)
- No comercial (precios, promos, packs, suscripciones)
- No plataformas externas (telegram, whatsapp, onlyfans)
- No videollamadas, transferencias, cripto
- No "tratos" comerciales, no país/envío
- La modelo NO se pregunta cosas a sí misma
- Solo cosas de Instagram (bio, destacadas, replies, lives, fotos, videos)
- Redirecciones SIN "?" (son comandos)
- Preguntas al cliente CON "?" al final
- 70-75% respuestas con max 3 palabras
- 1-2 emojis por respuesta, sin repetir

### Features removidas

- ❌ **Teams**: removido por complejidad de RLS. No compensaba el valor.
- ❌ **Picmo emoji picker**: reemplazado por picker custom (351 emojis curados). Más liviano, más control.
- ❌ **Infinite scroll**: removido por bugs. Todas las respuestas visibles via scroll nativo.
- ❌ **Count badges en tabs/categorías**: removido, info random no útil. Solo se mantiene count de Favoritos.

### Decisiones técnicas

- **Vanilla JS** sin build step (más simple para extension)
- **Supabase** free tier (compatible con el caso)
- **Picmo desinstalado** → picker custom (~22KB vs ~130KB)
- **Loading spinner** al inicio para evitar flash del login
- **Auto-fav** en respuestas manuales (lo que agrega el user, queda como favorito)

### Setup inicial

- SQL: `lib/SETUP_COMPLETO.sql` (idempotente, 1 sola corrida)
- Configurar Supabase: Email provider ON, "Confirm email" OFF
- Pegar URL + anon key en `config.js`
- Cargar extensión como unpacked en `chrome://extensions/`
- Hacer admin via SQL

### Iteraciones clave

1. **v0.1.0-alpha**: setup inicial, auth, banco básico
2. **v0.1.0-beta1**: emoji picker con picmo
3. **v0.1.0-beta2**: reemplazado picmo con picker custom WhatsApp-style
4. **v0.1.0-beta3**: bug fix scroll (sentinel)
5. **v0.1.0-beta4**: simplificado a "show only what fits" + dado 50/50 + favoritos
6. **v0.1.0-beta5**: agregada fila de categorías (Todo, Bio, Dest, Emoji)
7. **v0.1.0-rc1**: sistema de roles (admin/user) + gestión de usuarios
8. **v0.1.0-rc2**: teams (luego removido)
9. **v0.1.0-rc3**: sistema de favoritos con drag & drop entre tabs
10. **v0.1.0**: reset completo del banco, mayoría preguntas, redirecciones con conectores
11. **v0.1.0-final**: users normales sin acceso a Configuración

## Próximas features (ideas)

- [ ] Tests automatizados (Jest o similar)
- [ ] CI/CD con GitHub Actions
- [ ] Chrome Web Store publish ($5)
- [ ] Internacionalización (inglés/portugués)
- [ ] Más providers de IA (Gemini, Claude nuevo, etc.)
- [ ] Búsqueda de respuestas por texto
- [ ] Categorías personalizables por user
- [ ] Sincronización offline (Service Worker)
- [ ] Métricas: respuestas más usadas, hora del día, etc.
- [ ] Export/import de banco personal
- [ ] Themes personalizables
- [ ] Sonidos al copiar
- [ ] Notificaciones de updates

## Bugs resueltos

- ✅ Flash del login al abrir popup → loading spinner inicial
- ✅ Burbujas cortadas por FAB area → FABs en flow normal con border-top
- ✅ Scroll infinito no funcionaba → overflow:hidden + nada de sentinel
- ✅ Pico de emoji en esquina feo → centrado verticalmente inline con texto
- ✅ Error "Cannot read properties of null" al login → restaurado #br-admin-badge
- ✅ Texto "X en tu banco · 🎲" quitado (info random)
- ✅ Count badges quitados (info random)
- ✅ Login por username eliminado (no es info útil)

## Bugs conocidos

- Drag & drop puede fallar si arrastrás muy rápido (no es bloqueante)
- El dado no es criptográficamente aleatorio (Math.random es suficiente)
- Si tenés 50k+ respuestas, el performance del popup puede degradarse