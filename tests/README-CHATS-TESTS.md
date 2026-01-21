# Chats Page - Tests de Verificación de Overflow

## Tests Implementados

### 1. Verificación Estática (No requiere servidor)
**Archivo**: `tests/chats-static-verification.ts`

Este test verifica que todos los cambios de código están implementados correctamente:

```bash
npx tsx tests/chats-static-verification.ts
```

**Verifica**:
- ✅ AdminLayout tiene `h-[calc(100vh-80px)]` en main
- ✅ AdminLayout tiene `h-full` en motion.div
- ✅ ChatsPage tiene `break-words` y `whitespace-pre-wrap`
- ✅ ChatsPage tiene `min-w-0` en contenedores flex
- ✅ ChatsPage tiene `scrollAreaRef` implementado
- ✅ ChatsPage tiene lógica de auto-scroll mejorada
- ✅ Componentes skeleton existen
- ✅ Skeletons se usan en ChatsPage
- ✅ Automatizaciones usa `h-full`

### 2. Tests E2E con Playwright (Requiere servidor corriendo)
**Archivo**: `tests/chats-overflow-test.spec.ts`

Este test verifica la funcionalidad en el navegador:

```bash
# Terminal 1: Iniciar servidor de desarrollo
npm run dev

# Terminal 2: Ejecutar tests de Playwright
npm run test:chats-e2e

# O con UI interactiva
npm run test:chats-e2e-ui
```

**Verifica**:
- ✅ Interfaz de chats se muestra sin overflow horizontal
- ✅ Skeletons aparecen durante la carga
- ✅ Texto largo no hace overflow en burbujas de mensajes
- ✅ Áreas de scroll son independientes
- ✅ Layout responsive funciona en mobile
- ✅ Controles de pausa/resume se muestran
- ✅ URLs largas se rompen correctamente

## Configuración de Playwright

El archivo `playwright.config.ts` está configurado para:
- Ejecutar tests en Chromium
- Iniciar servidor automáticamente si no está corriendo
- Capturar screenshots en caso de fallo
- Generar reporte HTML

## Screenshots Generados

Los tests de Playwright generan screenshots en:
- `tests/screenshots/chats-initial.png` - Estado inicial
- `tests/screenshots/chats-messages.png` - Vista de mensajes
- `tests/screenshots/chats-mobile.png` - Vista mobile
- `tests/screenshots/overflow-message-{i}.png` - Si se detecta overflow

## Comandos Útiles

```bash
# Ejecutar tests estáticos
npm run test:chats-static

# Ejecutar tests E2E (con servidor)
npm run test:chats-e2e

# Ver reporte de Playwright
npx playwright show-report

# Ejecutar tests en modo debug
npx playwright test --debug

# Ejecutar tests en modo UI
npx playwright test --ui
```

## Credenciales de Testing

Los tests asumen credenciales por defecto:
- Email: `admin@test.com`
- Password: `admin123`

Ajusta en `tests/chats-overflow-test.spec.ts` si son diferentes.

## Casos de Test Manual Adicionales

Prueba estos escenarios manualmente:

1. **Palabras muy largas**:
   ```
   muuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuy
   ```

2. **URLs largas**:
   ```
   https://example.com/path/very/long/url/that/could/cause/overflow/problem/in/the/chat/interface
   ```

3. **Hashes o códigos**:
   ```
   df5h8d9f7h8sd9f7h8sd9f7h8sd9f7h8sdf98h7sdf98h7sdf98h7sd9f87hsd9f87hsd9f87hsd9f87h
   ```

4. **Emails largos**:
   ```
   usuario_con_nombre_muy_largo@dominio-muy-largo-tambien.com
   ```

## Resultados Esperados

✅ **Todos los tests deben pasar**
✅ **No debe haber overflow horizontal en ninguna vista**
✅ **Texto largo debe romperse en múltiples líneas**
✅ **Scroll debe funcionar independientemente en ambas columnas**
✅ **Layout debe ser responsive en mobile**

## Troubleshooting

### Test falla en login
- Verifica que las credenciales sean correctas
- Asegúrate que Supabase esté configurado
- Revisa que el servidor esté corriendo

### Screenshots muestran overflow
- Verifica que las clases `break-words` y `min-w-0` estén aplicadas
- Inspecciona el elemento en DevTools
- Revisa que no haya CSS custom que override las clases

### Servidor no inicia
- Puerto 3000 ocupado: usa `PORT=3001 npm run dev`
- Verifica variables de entorno en `.env.local`
