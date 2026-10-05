# Business Rules

# Sistema Web de Gestión y Asignación de Personal Eventual para UATRE

**Versión:** 2.0  
**Estado:** Consolidado con modelo de datos implementado  
**Propósito:** Fuente de verdad de las reglas de negocio vigentes del sistema.

---

# 1. Propósito del documento

Este documento contiene las reglas de negocio que gobiernan el funcionamiento del Sistema Web de Gestión y Asignación de Personal Eventual para UATRE.

Describe cómo funciona el dominio independientemente de la tecnología que posteriormente se utilice para implementarlo.

Las reglas de este documento deberán utilizarse como referencia antes de implementar funcionalidades relacionadas con:

- seccionales;
- empresas;
- trabajadores;
- lista de socios;
- rotación;
- asistencia;
- pedidos;
- nombramientos;
- sanciones;
- anotados;
- atrasados;
- inhabilitaciones;
- designaciones;
- pizarrón;
- historial.

Esta versión reemplaza las versiones anteriores cuando exista una diferencia explícitamente consolidada en este documento.

No deberán modificarse estas reglas para simplificar una implementación técnica.

## 1.1 Criterios estructurales consolidados en esta versión

A partir de esta versión:

- existe una única lista de rotación de socios por seccional;
- la lista mantiene permanentemente su orden numérico;
- el motor recorre la lista de manera circular desde una posición persistente;
- los atrasados se evalúan con prioridad antes de la rotación ordinaria;
- la designación de un socio elegible se realiza automáticamente;
- la cobertura excepcional trabaja sobre la misma lista única de socios;
- solamente el recorrido ordinario o un override explícito de UATRE modifican el punto normal de la rotación;
- **las habilitaciones funcionan por excepción: todos los trabajadores están habilitados para todas las empresas por defecto, y solo se registran las inhabilitaciones;**
- **el modelo de datos está completamente implementado en PostgreSQL.**

Los identificadores RN conservan, siempre que fue posible, la numeración histórica para facilitar la trazabilidad. Los identificadores correspondientes a reglas que dejaron de formar parte del modelo no se reutilizan salvo cuando una sección fue redefinida expresamente.

---

# 2. Organización multiseccional

## RN-001 — Sistema multiseccional

El sistema deberá contemplar múltiples seccionales UATRE correspondientes a distintas localidades.

## RN-002 — Independencia por seccional

Cada seccional tendrá independientemente:

- empresas;
- establecimientos;
- trabajadores;
- lista de socios;
- asistencia;
- pedidos;
- atrasados;
- sanciones;
- inhabilitaciones;
- historial.

La operación de una seccional no deberá modificar la rotación o información operativa perteneciente a otra.

**Actualización:** cada seccional tiene su propio usuario de acceso (1 usuario por seccional). El usuario administra exclusivamente su seccional.

---

# 3. Actores y registro

## RN-003 — Empresa

Las empresas afiliadas podrán utilizar el sistema para solicitar personal eventual.

La empresa podrá registrarse por sí misma.

La cuenta perteneciente a la empresa será compartida por los empleados que dicha empresa autorice para realizar pedidos.

## RN-004 — Personal UATRE

El personal autorizado de UATRE administrará la operación correspondiente a su seccional.

**Actualización:** el acceso al sistema se realiza a través de una cuenta de seccional (no de usuario individual). Cada seccional tiene su propio usuario.

## RN-005 — Trabajador

Todo trabajador operativo que participe del proceso de nombramiento será SOCIO.

Cada trabajador dispondrá de una cuenta personal.

## RN-138 — Registro de una seccional

Una seccional podrá registrarse desde el acceso inicial del sistema mediante un formulario y definir en este su rol.

El formulario deberá contemplar:

- número de seccional;
- localidad;
- provincia;
- email de la seccional;
- contraseña.

### Caso de uso asociado:

- UC-UATRE-001: Administrar seccional

## RN-139 — Registro de una empresa

Una empresa podrá registrarse desde el acceso inicial del sistema mediante un formulario y definir en este su rol.

El formulario deberá contemplar:

- nombre;
- localidad;
- provincia;
- seccional a la que se encuentra adherida;
- email;
- contraseña.

La seccional deberá seleccionarse mediante una lista desplegable de las seccionales registradas en el sistema.

**Actualización (consolidación Fase 4):** este autoregistro coexiste con el alta manual que UATRE puede realizar sobre una empresa (ver REQ-UATRE-010 y UC-UATRE-003). Ambas vías son válidas y equivalentes en resultado.

### Caso de uso asociado:

- UC-UATRE-003: Gestionar empresas
- UC-EMPRESA-001: Crear pedido de trabajadores (autoregistro previo)

## RN-140 — Registro de un trabajador (UATRE crea trabajador)

Un trabajador no se registra a sí mismo en el sistema.

La responsabilidad de crear un nuevo trabajador corresponde a UATRE (personal de la seccional autorizado).

### Flujo de creación:

1. **UATRE solicita datos al trabajador:**
   - Nombre (requerido)
   - Apellido (requerido)
   - Documento (requerido, único global)
   - Teléfono (opcional)
    - Email válido de Gmail (requerido, se guarda en USUARIOS.email). Validar formato no acredita titularidad ni existencia; el ingreso con Gmail se implementará después y su mecanismo requiere precisión (D-35).
   - Número de lista (UATRE selecciona de disponibles)

2. **UATRE completa el formulario de registro** dentro del sistema.

3. **Sistema valida:**
   - Documento no existe (UNIQUE global)
   - Email no existe en USUARIOS (UNIQUE global)
   - Número de lista está disponible

4. **Sistema crea trabajador:**
   - Inserta en TRABAJADORES con presente_hoy=FALSE, presente_ayer=FALSE, anotado=FALSE
   - Dispara Trigger 3 para crear ATRASOS iniciales

5. **Sistema genera contraseña temporal:**
   - 12 caracteres aleatorios (A-Z, a-z, 0-9, !@#$%)
   - Válida solamente para primer login

6. **Sistema crea usuario:**
   - email: proporcionado por trabajador (vía UATRE)
   - password: hash de contraseña temporal
   - tipo: TRABAJADOR
   - trabajador_id: FK al trabajador recién creado

7. **UATRE recibe credenciales:**
   - Email: {email del trabajador}
   - Contraseña temporal: {generada aleatoriamente}

8. **UATRE proporciona credenciales al trabajador** por medio seguro (impreso, SMS, en persona, etc.)

### Acceso inicial del trabajador:

- Trabajador accede con: email + contraseña temporal
- Sistema detecta que es primer login
- Sistema obliga cambio de contraseña (ver UC-TRABAJADOR-008 / RN-169)
- Cambio de contraseña es OBLIGATORIO, no opcional
- Trabajador solo puede continuar después de cambiar contraseña

### Postcondiciones:

✅ TRABAJADORES: nuevo registro con documento único
✅ LISTA_ROTACION: número asignado al trabajador
✅ USUARIOS: nuevo usuario con email único
✅ ATRASOS: inicializados con cantidad=0
✅ Trabajador puede loguear con email + password temporal
✅ Trabajador debe cambiar contraseña en primer login

### Reglas asociadas:

- RN-141: Unicidad del número ocupado
- RN-150: Modelo de usuarios centralizado
- RN-151: Documento único global
- RN-169: Cambio obligatorio de contraseña en primer login

### Casos de uso asociados:

- UC-UATRE-002: Registrar nuevo trabajador en la seccional
- UC-TRABAJADOR-008: Cambiar contraseña en primer login

## RN-141 — Unicidad del número ocupado

Cada número de la lista solamente podrá tener un trabajador asignado simultáneamente.

Un número ocupado no podrá asignarse al mismo tiempo a otro trabajador.

## RN-149 — Usuario único por seccional

Cada seccional tendrá un único usuario de acceso que administra todas las operaciones de esa seccional.

**Nota:** en el futuro se podrá extender a múltiples usuarios por seccional sin migrar el modelo.

## RN-150 — Modelo de usuarios centralizado

Todos los usuarios (seccionales, empresas, trabajadores) se almacenan en una tabla `USUARIOS` con un campo `tipo` que determina el rol y una referencia (FK) a la entidad correspondiente.

Esto permite:

- login único para todos los actores;
- email único global;
- escalabilidad a múltiples usuarios por entidad.

---

# 4. Socios e identidad

## RN-006 — Socio

Un socio participa de la lista de socios correspondiente a su seccional.

## RN-007 — Seccional única

Un trabajador no puede pertenecer a más de una seccional.

## RN-008 — Número de lista

El número utilizado dentro de la lista no representa la identidad permanente del trabajador.

## RN-009 — Número reutilizable

Cuando un socio deja de ocupar un número, ese número puede quedar libre y posteriormente ser asignado a otro socio.

La reutilización del número no deberá alterar la identidad histórica de trabajadores anteriores.

## RN-151 — Documento único global

El documento del trabajador es único a nivel global. No puede haber dos trabajadores con el mismo documento.

---

# 5. Lista de rotación

## RN-011 — Lista fija y recorrido circular

La lista de socios mantendrá permanentemente su orden numérico.

Los números no se moverán de posición como consecuencia de una designación, una ausencia, una sanción o cualquier otra condición operativa.

El motor recorrerá la lista de manera circular.

Cuando alcance el último número deberá continuar nuevamente desde el primero.

## RN-012 — Posición actual de la rotación ordinaria

La rotación ordinaria mantendrá una posición que indica el próximo número desde el cual deberá comenzar el recorrido.

Esta posición deberá persistir entre pedidos.

**Actualización:** el punto de rotación se almacena en la tabla `SECCIONALES` (campo `punto_rotacion`).

## RN-013 — Continuidad del recorrido ordinario

Cuando un pedido requiera utilizar la rotación ordinaria y termine antes de completar una vuelta total, el próximo pedido que necesite la rotación ordinaria comenzará en el número siguiente al último número recorrido.

## RN-014 — Evaluación y avance del recorrido

Evaluar a un socio no altera su número ni su ubicación dentro de la lista.

Durante la rotación ordinaria, el motor deberá:

1. evaluar el número correspondiente;
2. consultar los estados y condiciones aplicables;
3. designar o no designar al socio según corresponda;
4. aplicar los efectos específicos definidos para esas condiciones;
5. continuar con el siguiente número cuando sea necesario.

**Actualización:** la rotación ordinaria requiere `presente_hoy = TRUE` Y `presente_ayer = TRUE`.

**Evaluación detallada en rotación ordinaria:**

Cuando se evalúa un número de la lista:
1. Si `trabajador_id IS NULL` (número libre/inactivo) → SALTAR (no se puede designar).
2. Verificar condiciones del trabajador:
   - ¿Está PRESENTE hoy? ¿Estuvo PRESENTE ayer?
   - ¿Está ANOTADO?
   - ¿Tiene sanciones pendientes?
   - ¿Está habilitado para la empresa del pedido?
   - ¿Está DESIGNADO o TRABAJANDO?
3. Si no cumple TODAS las condiciones → CONTINUAR con el siguiente número.
4. Si cumple todas las condiciones → DESIGNAR automáticamente.

## RN-142 — Vuelta completa de la rotación ordinaria

Si la rotación ordinaria completa una vuelta total sin lograr cubrir el pedido, el punto normal de inicio quedará nuevamente en el mismo número desde el cual comenzó esa vuelta.

## RN-143 — Override del punto de rotación

El personal autorizado de UATRE podrá definir manualmente mediante override el número desde el cual deberá comenzar o continuar la rotación ordinaria.

### Caso de uso asociado:

- UC-UATRE-005: Override de rotación

## RN-152 — Cantidad de números configurable

Cada seccional define la cantidad de números que tendrá su lista al momento del alta, y puede ajustarla desde configuración.

El total de números se almacena en `SECCIONALES.cantidad_numeros`.

Al reducir el total:

1. Se rechaza la operación si un número por encima del nuevo límite está ocupado.
2. Se rechaza la operación si `punto_rotacion` queda fuera del nuevo rango; UATRE
   debe ajustarlo explícitamente antes.
3. Los números libres fuera del nuevo límite se desactivan sin borrar su fila
   histórica.

Al aumentar el total, se activan primero los números libres históricos dentro del
nuevo rango y se crean posiciones nuevas solo cuando no existan.

## RN-153 — Liberación de número

Un número se libera cuando un trabajador renuncia o es despedido. UATRE realiza esta acción manualmente desde su cuenta de seccional.

Al liberar un número:
1. Se actualiza `lista_rotacion.trabajador_id = NULL` (desvincula al trabajador).
2. Se marca `activo = FALSE` (indicando que el número está inactivo).
3. Se desactivan el trabajador y su usuario, conservando su identidad e
   historial.
4. Se reinician sus atrasos y sanciones pendientes.

El número inactivo no será considerado en las consultas de la lista de rotación (motor y rotación ordinaria solo consultan `activo = TRUE`).

El mismo trabajador puede reactivarse en el futuro, sin crear una identidad nueva,
con un número libre elegido por UATRE —incluido su número liberado si se lo vuelve
a activar—. La reactivación conserva la contraseña que tenía la cuenta.
No se permite liberar el número mientras el trabajador tenga una designación o
trabajo activo.

### Caso de uso asociado:

- UC-UATRE-001: Administrar seccional

## RN-154 — Histórico de la lista se conserva

La lista de rotación nunca borra filas. Los números históricos se conservan con `activo = FALSE`.

---

# 6. Asistencia

## RN-015 — La asistencia no crea una nueva lista

La toma de asistencia no genera una lista persistente separada de trabajadores aptos.

Los socios continúan perteneciendo a la lista de rotación original.

La asistencia registra información sobre los trabajadores existentes.

## RN-016 — Lista vs. condición

La lista determina:

> qué número corresponde evaluar durante el recorrido.

Los estados y condiciones determinan:

> si la persona asociada a ese número puede ser designada para un pedido.

No deberán confundirse ambos conceptos.

## RN-017 — Registro diario

La asistencia correspondiente a cada jornada deberá conservarse.

## RN-018 — Horario habitual de cierre

El cierre de asistencia deberá realizarse **manualmente por el personal autorizado de UATRE** después de las **07:40 hs** (Zona Horaria Argentina UTC-3).

El sistema proporcionará un botón "CERRAR ASISTENCIA" que solamente estará disponible después de las 07:40.

Si a esa hora la asistencia aún no fue cerrada, los pedidos que dependen de esa
actualización esperan el cierre manual; no se procesan con la última asistencia
cerrada.

## RN-019 — Llegada tarde

Una persona que llegue después del horario límite será considerada ausente a efectos del nombramiento correspondiente.

Esta regla aplica a los socios.

## RN-020 — Asistencia del día anterior

Cuando una regla de elegibilidad requiera haber asistido el día anterior, el sistema deberá consultar el registro correspondiente a esa jornada.

**Actualización:** la asistencia del día anterior es la última jornada cerrada,
no necesariamente el día calendario anterior, y se almacena en
`TRABAJADORES.presente_ayer` para consultas rápidas. Una seccional sin jornada
cerrada anterior no habilita la rotación ordinaria.

## RN-021 — La designación excepcional no modifica la asistencia

Cuando un trabajador registrado como AUSENTE sea utilizado mediante una cobertura excepcional, su registro de asistencia deberá permanecer como AUSENTE.

## RN-022 — Ausencia de un trabajador con atrasos

Si al **cerrar la asistencia** de la jornada un trabajador se encuentra AUSENTE y posee turnos atrasados pendientes, se deberá descontar automáticamente **1 turno atrasado**.

El descuento se ejecuta mediante un trigger (`trg_descuento_atraso_ausencia`) que se dispara al cerrar la asistencia (AFTER UPDATE ON asistencia WHERE cerrado = TRUE).

El descuento por ausencia podrá ocurrir como máximo **una vez por trabajador y por jornada**.

## RN-155 — Modelo híbrido de asistencia

La asistencia se almacena de dos formas complementarias:

1. **Tabla `ASISTENCIA`:** historial completo de cada jornada (fecha, presente,
   verificado, cerrado). Un registro con `verificado=FALSE` no representa una
   ausencia confirmada.
2. **Flags en `TRABAJADORES`:** `presente_hoy` y `presente_ayer` para consultas rápidas del motor.

Los flags se sincronizan automáticamente mediante triggers al cerrar la asistencia.

---

# 7. Cuadrícula de asistencia

## RN-023 — Representación

La asistencia se gestionará mediante una cuadrícula de trabajadores/números.

## RN-024 — Toque simple

Un toque simple sobre el casillero permite marcar:

`PRESENTE`.

## RN-025 — Pulsación sostenida

Una pulsación sostenida permite seleccionar manualmente otro estado disponible.

## RN-026 — Representación visual confirmada

| Condición | Representación |
|---|---|
| PRESENTE | Verde |
| AUSENTE | Rojo |
| TRABAJANDO | Amarillo |
| ATRASADO | Azul |
| ANOTADO | Gris |
| SANCIONADO | Gris oscuro con letras blancas |

La forma de representar visualmente combinaciones simultáneas de condiciones deberá resolverse durante el diseño de interfaz si fuese necesario.

---

# 8. Estados y condiciones simultáneas

## RN-027 — Las condiciones no son necesariamente excluyentes

No deberá asumirse que un trabajador posee un único estado global.

Pueden coexistir diferentes condiciones.

**Actualización:** las condiciones se almacenan en tablas separadas:

- `presente_hoy` / `presente_ayer` → flags en `TRABAJADORES`.
- `anotado` → flag en `TRABAJADORES`.
- `ATRASOS` → tabla con cantidad.
- `SANCIONES` → tabla con turnos pendientes.
- `DESIGNACIONES` → tabla con estado y relación al pedido.
- `INHABILITACIONES` → tabla con relación trabajador-empresa.

ANOTADO y presencia son condiciones independientes: marcar ANOTADO no modifica
el valor de asistencia elegido para el trabajador.

---

# 9. Ausencia en la rotación ordinaria

## RN-028 — Ausencia al ser evaluado por la rotación ordinaria

Si la rotación ordinaria llega a un trabajador que no cumple la condición de asistencia requerida:

- no podrá ser designado mediante el proceso ordinario;
- su número no cambiará de posición;
- el recorrido continuará con el siguiente número.

**Actualización:** la condición de asistencia requerida para rotación ordinaria es `presente_hoy = TRUE` Y `presente_ayer = TRUE`.

---

# 10. ANOTADO

## RN-029 — Significado

ANOTADO representa la necesidad del trabajador de no ser considerado para una designación cuando su número vuelva a ser alcanzado por la rotación ordinaria.

## RN-030 — Acción ANOTARME

El trabajador podrá seleccionar ANOTARME desde su cuenta cuando cumpla las condiciones requeridas.

## RN-031 — Restricciones para anotarse

No podrá utilizar ANOTARME cuando:

- ya esté DESIGNADO;
- esté TRABAJANDO;
- se encuentre SANCIONADO.

## RN-032 — Formas de finalizar ANOTADO

ANOTADO puede finalizar:

1. cuando la rotación ordinaria alcanza nuevamente el número del trabajador;
2. cuando el trabajador utiliza LIBERAR antes de que su número sea alcanzado;
3. cuando el personal autorizado de UATRE libera manualmente la condición antes de que el número sea alcanzado.

## RN-033 — Liberación anticipada

Si el trabajador utiliza LIBERAR o UATRE libera manualmente ANOTADO antes de que la rotación ordinaria alcance su número:

- deja de estar ANOTADO;
- vuelve a estar disponible según sus demás condiciones;
- conserva sus turnos atrasados pendientes, si los tuviera.

## RN-034 — ANOTADO al llegar la rotación ordinaria

Si la rotación ordinaria llega al trabajador mientras continúa ANOTADO:

- no podrá ser designado en esa evaluación ordinaria;
- ANOTADO finaliza;
- su número permanece en su posición fija;
- el recorrido continúa con el siguiente número.

## RN-156 — ANOTADO como flag booleano

ANOTADO se almacena como flag booleano en `TRABAJADORES.anotado`.

Se cambia manualmente por:

- el trabajador (ANOTARME / LIBERAR);
- UATRE (liberación manual).

**No se resetea automáticamente** al cerrar la asistencia.

---

# 11. ANOTADO + ATRASADO

## RN-035 — Un atrasado puede anotarse

Un trabajador ATRASADO puede utilizar ANOTARME siempre que no exista otra restricción que se lo impida.

## RN-036 — Prioridad lógica de ANOTADO

Mientras un trabajador se encuentre:

`ATRASADO + ANOTADO`

ANOTADO tiene prioridad lógica e impide temporalmente que utilice su prioridad de atrasado.

## RN-037 — El atraso no desaparece

ANOTARSE no elimina, cancela ni consume los turnos atrasados pendientes.

## RN-038 — Salida de ANOTADO

Cuando finaliza ANOTADO:

- el trabajador continúa ATRASADO si aún posee turnos atrasados pendientes;
- vuelve a encontrarse disponible para asignación según sus demás condiciones;
- conserva la cantidad de atrasos y la prioridad que correspondan.

---

# 12. Sanciones

## RN-039 — Modalidades de sanción

Las sanciones podrán aplicarse de dos maneras:

1. mediante **turnos de sanción**;
2. mediante la **quita de una cantidad determinada de turnos atrasados**.

No se definen sanciones por cantidad de días en esta especificación.

## RN-040 — Turnos de sanción pendientes

Cuando una sanción se exprese en turnos, el trabajador mantendrá una cantidad de turnos de sanción pendientes.

## RN-041 — Descuento de un turno de sanción

Se descontará exactamente **1 turno de sanción** cuando el trabajador:

- haya estado PRESENTE el día anterior;
- esté PRESENTE en la jornada actual;
- cumpla las demás condiciones necesarias para ser designado;
- sea evaluado por el motor;
- y la condición SANCIONADO sea la que impida su designación.

## RN-042 — Sanciones de varios turnos

Si quedan varios turnos de sanción pendientes, cada futura evaluación en la que se cumplan las condiciones de RN-041 descontará un turno.

## RN-043 — Fin de sanción por turnos

Cuando la cantidad de turnos de sanción llega a cero, el trabajador deja de estar bloqueado por esa sanción.

## RN-044 — Sanción mediante quita de atrasos

Si el trabajador posee turnos atrasados, una sanción podrá aplicarse reduciendo directamente una cantidad determinada de esos turnos atrasados.

## RN-045 — ATRASADO + sanción por turnos

Cuando un trabajador tenga simultáneamente turnos atrasados y turnos de sanción pendientes:

- la sanción bloqueará temporalmente el aprovechamiento de su prioridad como atrasado;
- sus atrasos permanecerán sin cambios mientras la sanción continúe vigente;
- cuando sea evaluado y se cumplan las condiciones de RN-041, se descontará 1 turno de sanción;
- al agotarse la sanción podrá volver a utilizar su prioridad como atrasado.

## RN-046 — Designación excepcional de un sancionado

Cuando un trabajador con turnos de sanción pendientes sea designado excepcionalmente mientras se encuentra PRESENTE:

- podrá cumplir el trabajo;
- la designación excepcional no consumirá ni descontará ningún turno de sanción;
- conservará la totalidad de los turnos de sanción que tuviera pendientes.

## RN-157 — Sanciones acumulables

Un trabajador puede tener varios turnos de sanción pendientes. Las nuevas sanciones se **suman** a los turnos existentes.

### Caso de uso asociado:

- UC-UATRE-007: Aplicar sanción

## RN-158 — Cierre de sanción

Una sanción se cierra cuando:

- `turnos_pendientes = 0` (automático, por el trigger `trg_gestionar_sancion_al_llegar_a_cero`);
- UATRE la quita manualmente.

### Caso de uso asociado:

- UC-UATRE-007: Aplicar sanción

## RN-159 — Sin motivo registrado

La tabla `SANCIONES` no contempla un campo de motivo. Solo se registran `turnos_pendientes`, `fecha_inicio` y `fecha_fin` (ver esquema en `BD/bd_uatre.sql`).

**Actualización (consolidación Fase 4):** se precisó la redacción para reflejar exactamente el esquema implementado (no existe columna de motivo, ni siquiera opcional).

### Caso de uso asociado:

- UC-UATRE-007: Aplicar sanción

---

# 13. Habilitaciones

## RN-047 — Habilitación general UATRE

Un trabajador activo registrado en el sistema se considera habilitado de manera general dentro de UATRE.

## RN-048 — Habilitación específica por empresa

**Actualización:** por defecto, TODOS los trabajadores están habilitados para TODAS las empresas de su seccional.

Solo se registran las **inhabilitaciones** (excepciones).

## RN-049 — Falta de habilitación durante la rotación ordinaria

Cuando la rotación ordinaria alcance a un socio que cumple las demás condiciones para ser designado pero **está inhabilitado** para la empresa solicitante:

- no podrá ser designado para ese pedido;
- si no posee ya atrasos pendientes, se agregará **1 turno atrasado**;
- el recorrido ordinario continuará con el siguiente número;
- su número no cambiará de posición.

Mientras el trabajador conserve atrasos pendientes, una nueva evaluación ordinaria en la que vuelva a estar impedido por falta de habilitación no agregará otro atraso por esa misma situación.

## RN-050 — Habilitación obligatoria en toda designación

La habilitación específica para la empresa es una restricción obligatoria también durante las intervenciones manuales del encargado.

Un trabajador no habilitado para la empresa no podrá ser designado para ese pedido, ni automática ni manualmente.

## RN-160 — Modelo de inhabilitaciones por excepción

Las inhabilitaciones se almacenan en la tabla `INHABILITACIONES`:

- `trabajador_id` FK
- `empresa_id` FK
- `fecha_inhabilitacion` TIMESTAMP
- UNIQUE(trabajador_id, empresa_id)

**Consulta en el motor:** un trabajador está habilitado si NO existe registro en `INHABILITACIONES` para el par (trabajador, empresa).

**Escala esperada:** En el contexto de este sistema (una seccional con ~50-100 trabajadores y ~20-50 empresas), el máximo de registros en INHABILITACIONES será aproximadamente **100** (considerando que UATRE realiza inhabilitaciones puntuales de forma selectiva, no masiva).

El índice parcial `idx_inhabilitaciones (trabajador_id, empresa_id)` optimiza las consultas de habilitación durante la ejecución del motor.

### Caso de uso asociado:

- UC-UATRE-006: Inhabilitar/Rehabilitar trabajador

## RN-161 — Solo UATRE puede inhabilitar

Solo el usuario de la seccional puede inhabilitar o rehabilitar trabajadores para empresas.

### Caso de uso asociado:

- UC-UATRE-006: Inhabilitar/Rehabilitar trabajador

## RN-162 — Sin motivo registrado

El modelo de datos implementado (tabla `INHABILITACIONES`) no contempla un campo de motivo. La inhabilitación se registra únicamente como el par (`trabajador_id`, `empresa_id`) con su `fecha_inhabilitacion`, sin texto libre asociado.

**Actualización (consolidación Fase 4):** esta regla reemplaza una versión anterior que preveía motivo libre en texto; se corrigió para reflejar el esquema real implementado en PostgreSQL (`BD/bd_uatre.sql`), que no posee dicha columna.

### Caso de uso asociado:

- UC-UATRE-006: Inhabilitar/Rehabilitar trabajador

## RN-163 — Sin historial de inhabilitaciones

No se registra historial de cambios de inhabilitaciones. Solo el estado actual.

### Caso de uso asociado:

- UC-UATRE-006: Inhabilitar/Rehabilitar trabajador

## RN-164 — Inhabilitación solo afecta futuras designaciones

Si un trabajador ya está designado para una empresa y se lo inhabilita, la designación vigente se mantiene. La inhabilitación solo afecta a futuras designaciones.

### Caso de uso asociado:

- UC-UATRE-006: Inhabilitar/Rehabilitar trabajador

---

# 14. Empresas y establecimientos

## RN-051 — Asociación con seccional

Una empresa afiliada deberá asociarse con una seccional/localidad.

**Actualización:** una empresa no puede estar adherida a más de una seccional.

## RN-052 — Múltiples establecimientos

Una empresa podrá registrar una o múltiples direcciones o establecimientos.
La empresa administra sus propios establecimientos.

No se puede desactivar un establecimiento mientras exista un pedido futuro que
lo referencie.

## RN-053 — Pedido con múltiples establecimientos

Cuando una empresa posea varias ubicaciones, deberá indicar en el pedido a cuál deben concurrir los trabajadores.

---

# 15. Tareas

## RN-054 — Tareas configurables por empresa

El personal autorizado de UATRE podrá configurar los tipos de trabajo correspondientes a cada empresa.

No se puede desactivar una tarea mientras exista un pedido futuro que la
referencie.

La configuración de tareas no determina una lista de origen, ya que el sistema trabaja con una única lista de socios por seccional.

---

# 16. Pedidos

## RN-057 — Creación de pedidos

En la versión actual solamente las empresas pueden crear pedidos.

UATRE no crea pedidos en nombre de una empresa.

## RN-058 — Información mínima

Un pedido deberá especificar al menos:

- empresa;
- fecha;
- horario de ingreso;
- cantidad requerida;
- tipo de tarea;
- establecimiento cuando corresponda.

## RN-059 — Tipos temporales de pedido

Un pedido puede ser:

- programado;
- inmediato.

## RN-060 — Pedido inmediato

Si no se programa para un horario futuro, utilizará como referencia temporal la hora actual.

## RN-061 — Pedido programado

Un pedido puede crearse con anticipación para una fecha y horario posteriores.

---

# 17. Momento de procesamiento de pedidos

## RN-062 — Estado válido de la lista

Las asignaciones siempre se determinarán utilizando el estado válido de la lista correspondiente al momento en que deba realizarse la designación.

## RN-063 — Decisión de procesamiento: Lógica completa

El sistema deberá determinar si un pedido se procesa inmediatamente o se envía a la cola basándose en el siguiente árbol de decisión:

### Paso 1: Determinar próxima actualización de estados
```
SI hora_actual < 07:40 hs:
    próxima_actualización = HOY 07:40
SINO:
    próxima_actualización = MAÑANA 07:40
```

### Paso 2: Evaluar fecha y horario del pedido
```
SI fecha_pedido = HOY:
    SI ya pasó 07:40 hs:
        SI asistencia de HOY está cerrada:
            → PROCESAR INMEDIATO (RN-065)
        SINO:
            → ENVIAR A COLA (esperar cierre manual)
        Razón: La actualización válida solo existe tras el cierre real
    SINO:
        SI horario_pedido < 07:40 hs:
            → PROCESAR INMEDIATO (RN-063)
            Razón: El pedido comienza antes del cierre de asistencia
        SINO:
            → ENVIAR A COLA (RN-064)
            Razón: El pedido comienza después del cierre, esperar actualización

SINO SI fecha_pedido = MAÑANA Y horario_pedido < 07:40 hs:
    → PROCESAR INMEDIATO (RN-063)
    Razón: El ingreso es anterior a la próxima actualización de su jornada

SINO (fecha_pedido > HOY):
    → ENVIAR A COLA (RN-064)
    Razón: El pedido es para un día futuro, esperar su actualización
```

### Ejemplo 1: Procesamiento inmediato (actualización ya pasó)
```
Hora actual: 09:00 (ya pasó 07:40)
Pedido: Hoy 14:00
Decisión: INMEDIATO
Razón: Asistencia ya cerrada, se usa estado válido actual
```

### Ejemplo 2: Cola (próxima actualización antes del pedido)
```
Hora actual: 06:30 (antes de 07:40)
Pedido: Hoy 08:00
Próxima actualización: Hoy 07:40 (en 1h 10m)
Decisión: COLA
Razón: El pedido comienza después de la próxima actualización, esperar esa actualización
```

### Ejemplo 3: Procesamiento inmediato (mañana antes de la actualización)
```
Hora actual: Hoy 09:00
Pedido: Mañana 07:00
Próxima actualización: Mañana 07:40
Decisión: INMEDIATO
Razón: El ingreso es anterior a la próxima actualización de su jornada
```

## RN-064 — Pedido posterior a una futura actualización

(Consolidado en RN-063)

## RN-065 — Actualización ya válida

(Consolidado en RN-063)

## RN-066 — Cierre de asistencia

Cuando se cierre la asistencia de una jornada, el sistema deberá comenzar automáticamente a procesar los pedidos pendientes que correspondan utilizar dicha actualización.

## RN-067 — Orden entre pedidos habilitados simultáneamente

Cuando dos o más pedidos queden habilitados para ser procesados al mismo tiempo, tendrá prioridad el pedido que haya ingresado primero al sistema.

El criterio de desempate es el **momento de creación del pedido**: primer pedido ingresado, primer pedido procesado.

**Actualización:** el orden se almacena en `COLA_PEDIDOS.orden` (FIFO).

---

# 18. Modificación de pedidos

## RN-068 — Responsabilidad de edición

La responsabilidad de modificar los datos de un pedido corresponde exclusivamente a la empresa que lo creó.

## RN-069 — Campos modificables

Antes de que existan trabajadores asignados, la empresa podrá modificar:

- cantidad;
- horario;
- tipo de tarea.

## RN-070 — Bloqueo posterior a asignación

Una vez que se asigna personal al pedido:

**el pedido ya no podrá modificarse.**

---

# 19. Cancelación de pedidos

## RN-071 — Actores autorizados

Un pedido podrá ser cancelado por:

- la empresa;
- personal autorizado de UATRE.

## RN-072 — Límite temporal

La cancelación solamente podrá realizarse antes del horario de inicio del pedido.

## RN-073 — Pedido iniciado

Una vez alcanzado/comenzado el horario de inicio:

**el pedido ya no podrá cancelarse.**

## RN-074 — Cancelación con designados

Si se cancela antes del inicio y ya existen trabajadores designados:

- las designaciones correspondientes dejan de estar vigentes;
- cada trabajador afectado recibe **1 turno atrasado**;
- queda disponible nuevamente según las demás condiciones que le correspondan.

Si el trabajador había utilizado previamente uno de sus atrasos para obtener esa designación, la cancelación devuelve ese turno atrasado.

---

# 20. Estados de pedido

## RN-075 — Estados internos confirmados

Un pedido podrá mantener internamente:

- PENDIENTE;
- EN PROCESO;
- CUBIERTO;
- NO CUBIERTO;
- CANCELADO.

**Actualización:** la empresa solo ve el estado **COMPLETO** cuando el pedido está cubierto. Los estados internos son para uso del sistema y UATRE.

---

# 21. Motor de nombramiento

## RN-077 — Atrasados antes de la rotación ordinaria

Antes de utilizar la rotación ordinaria deberán evaluarse los trabajadores con atrasos pendientes que estén en condiciones de aprovechar su prioridad.

Para utilizar la prioridad de ATRASADO el trabajador deberá:

- estar PRESENTE en la jornada actual;
- haber estado PRESENTE el día anterior.

**Actualización:** el orden de prioridad es:

1. Mayor cantidad de atrasos (DESC).
2. Menor `fecha_primer_atraso` (ASC).

## RN-078 — Recorrer la lista original

El motor deberá recorrer la lista permanente de socios.

## RN-079 — Validaciones

Según corresponda, deberá considerar:

- asistencia actual;
- asistencia anterior;
- ANOTADO;
- sanciones;
- habilitación por empresa;
- designaciones vigentes;
- trabajo actual;
- turnos atrasados.

---

# 22. Designación automática

## RN-080 — Designación sin confirmación previa

La selección realizada por el motor no requerirá una acción posterior del trabajador para confirmar la designación.

## RN-081 — Designación automática

Cuando el motor determine que un socio debe cubrir un puesto y cumpla las condiciones aplicables:

- quedará DESIGNADO automáticamente para ese pedido;
- quedará indisponible para otra designación mientras la designación continúe vigente.

## RN-082 — Información de la designación

Cuando un trabajador quede DESIGNADO, el sistema mostrará la designación en las
vistas correspondientes. **D-26 (consolidada):** en esta etapa no se envían
notificaciones; las designaciones y las faltas de cobertura se informan
exclusivamente en las vistas.

## RN-083 — Trabajador designado que informa previamente que no podrá concurrir

Un trabajador DESIGNADO no dispondrá dentro de su cuenta de una acción para cancelar por sí mismo la designación.

Si informa por fuera de la aplicación que no podrá concurrir:

- UATRE resolverá el reemplazo manualmente;
- el trabajador originalmente designado recibirá **1 turno de sanción**.

## RN-084 — Reemplazo manual de un designado

Cuando UATRE deba reemplazar manualmente a un trabajador designado, deberá seleccionar otro número de la lista.

## RN-085 — Paso automático de DESIGNADO a TRABAJANDO

Si el trabajador DESIGNADO no informó previamente que no podrá concurrir, el sistema asumirá que se presentó al trabajo.

Al alcanzarse el horario de ingreso indicado en el pedido:

`DESIGNADO → TRABAJANDO`

deberá producirse automáticamente.

**Actualización:** el paso se realiza mediante un job periódico o manualmente desde UATRE.

---

# 23. Cobertura ordinaria y excepcional

## RN-086 — Falta de cobertura mediante el proceso ordinario

Si el procesamiento ordinario de la lista de socios no consigue cubrir completamente un pedido después de evaluar a los trabajadores según las reglas aplicables, los puestos restantes deberán continuar mediante el proceso de cobertura excepcional.

## RN-087 — Inicio de cobertura excepcional

Cuando el procesamiento ordinario no consiga cubrir completamente el pedido, el encargado de UATRE podrá intervenir manualmente para completar los puestos faltantes.

La cobertura excepcional no modifica el punto de la rotación ordinaria.

## RN-088 — Primera ampliación manual: presentes hoy, ausentes ayer

Como primera ampliación manual, el encargado podrá considerar socios que:

- estén PRESENTES en la jornada actual;
- hayan estado AUSENTES el día anterior;
- no tengan turnos de sanción pendientes;
- no posean atrasos pendientes que deban esperar a cumplir el presentismo requerido;
- estén habilitados para la empresa;
- no estén ANOTADOS;
- no estén DESIGNADOS;
- no estén TRABAJANDO.

## RN-089 — Segunda ampliación manual: sancionados presentes

Si el pedido continúa incompleto después de la instancia anterior, el encargado podrá considerar socios que:

- tengan turnos de sanción pendientes;
- estén PRESENTES en la jornada actual;
- estén habilitados para la empresa;
- no estén ANOTADOS;
- no estén DESIGNADOS;
- no estén TRABAJANDO.

Un trabajador que esté PRESENTE hoy, haya estado AUSENTE el día anterior y además esté SANCIONADO deberá esperar hasta esta etapa.

Si un sancionado es designado mediante esta instancia:

- podrá cumplir el trabajo;
- no se descontará ningún turno de sanción;
- conservará la totalidad de sus turnos de sanción pendientes.

## RN-090 — Tercera ampliación manual: ausentes hoy

Si el pedido continúa incompleto después de las instancias anteriores, el encargado podrá considerar socios registrados como AUSENTES durante la jornada actual.

Para poder ser designados deberán:

- estar habilitados para la empresa;
- no estar ANOTADOS;
- no estar DESIGNADOS;
- no estar TRABAJANDO.

Solamente el trabajador AUSENTE que sea efectivamente designado mediante esta instancia recibirá una sanción de **1 turno**.

La sanción se acumulará con cualquier cantidad de turnos de sanción que ya tuviera pendientes.

La designación excepcional no modificará su asistencia: continuará registrado como AUSENTE durante esa jornada.

## RN-091 — ANOTADO no puede ignorarse manualmente

ANOTADO continúa siendo una prohibición para la designación incluso durante la cobertura excepcional.

## RN-092 — Restricciones absolutas de cobertura

La cobertura manual no podrá utilizarse para designar a un trabajador que:

- no esté habilitado para la empresa;
- continúe ANOTADO;
- ya esté DESIGNADO;
- esté TRABAJANDO.

## RN-144 — Orden dentro de cada etapa excepcional

Dentro de cada etapa de cobertura excepcional, los trabajadores deberán evaluarse respetando el orden numérico circular de la lista.

---

# 24. Designación y trabajo

## RN-093 — Designado implica compromiso

Desde el momento en que un trabajador queda DESIGNADO, deja de encontrarse disponible para otra designación mientras dicha designación continúe vigente.

## RN-094 — Designado no es igual a trabajando

Debe diferenciarse conceptualmente:

`DESIGNADO`

de:

`TRABAJANDO`.

---

# 25. Bloqueo laboral

## RN-095 — Inicio del bloqueo

El bloqueo laboral comienza en el horario de inicio especificado por la empresa.

## RN-096 — Duración máxima

El bloqueo tendrá una duración máxima de:

**12 horas.**

## RN-097 — Finalización anticipada

El trabajador podrá marcar la tarea como finalizada antes del vencimiento de las 12 horas.

## RN-098 — Liberación automática

Si no se registra una finalización anticipada, el sistema deberá liberar automáticamente al trabajador al cumplirse las 12 horas desde el inicio.

---

# 26. Turnos atrasados

## RN-099 — Generación de un turno atrasado

Se agregará **1 turno atrasado** cuando la rotación ordinaria alcance a un trabajador y este no pueda ser utilizado porque:

- continúa DESIGNADO para otro trabajo;
- está esperando el horario de ingreso de una designación;
- se encuentra TRABAJANDO;
- cumple las demás condiciones para ser designado pero está **inhabilitado** para la empresa solicitante.

## RN-100 — Atrasos acumulables

Un trabajador puede acumular más de un turno atrasado.

## RN-101 — Evaluación prioritaria de atrasados

Antes de realizar una designación mediante la rotación ordinaria, el sistema deberá comprobar si existen trabajadores con atrasos pendientes que cumplan las condiciones para utilizar su prioridad.

## RN-102 — Los atrasados no modifican la posición ordinaria

La evaluación y designación de trabajadores mediante prioridad de ATRASADO no modificará el punto de la rotación ordinaria.

## RN-103 — Prioridad por cantidad de atrasos

Entre los trabajadores atrasados que cumplan las condiciones necesarias tendrá prioridad quien posea la **mayor cantidad de turnos atrasados pendientes**.

## RN-104 — Desempate por antigüedad

Si dos o más trabajadores poseen la misma cantidad de turnos atrasados pendientes, tendrá prioridad quien tenga la **fecha_primer_atraso más antigua**.

## RN-105 — Requisitos para utilizar la prioridad de ATRASADO

Los trabajadores atrasados tendrán prioridad sobre la rotación ordinaria solamente cuando:

- estén PRESENTES en la jornada actual;
- hayan estado PRESENTES el día anterior;
- estén habilitados para la empresa;
- no continúen ANOTADOS;
- no estén bloqueados por una sanción pendiente;
- no estén DESIGNADOS;
- no estén TRABAJANDO.

## RN-106 — Descuento de un atraso al obtener trabajo

Cuando un trabajador sea DESIGNADO, se deberá descontar exactamente **1 turno atrasado** si tenía atrasos pendientes.

**Actualización:** el descuento se realiza automáticamente mediante trigger al insertar la designación.

## RN-107 — Persistencia después de una designación

Si, después de descontar el atraso utilizado, el trabajador todavía posee uno o más turnos atrasados, mantiene la condición ATRASADO.

## RN-108 — Fin de la condición ATRASADO

Cuando la cantidad de turnos atrasados pendientes llega a cero, el trabajador deja de mantener la condición ATRASADO.

## RN-109 — Persistencia de atrasos no utilizados

Si un trabajador atrasado no puede utilizar su prioridad o no existen suficientes puestos, conserva los turnos atrasados que permanezcan pendientes.

## RN-110 — Separación entre atrasos y rotación ordinaria

La lógica de atrasos deberá tratarse separadamente del recorrido ordinario de la lista.

---

# 27. Interacciones de ATRASADO con otras condiciones

## RN-111 — ATRASADO + AUSENTE

Cuando al registrar o cerrar la asistencia diaria un trabajador se encuentre AUSENTE y posea atrasos pendientes, se descontará automáticamente 1 turno atrasado.

## RN-112 — ATRASADO + ANOTADO

ANOTADO bloquea temporalmente la utilización de la prioridad del trabajador, pero no reduce ni elimina sus atrasos pendientes.

## RN-113 — ATRASADO + sanción por turnos

Cuando un trabajador tenga simultáneamente atrasos y turnos de sanción pendientes:

- no podrá utilizar su prioridad de atrasado mientras la sanción siga vigente;
- los atrasos permanecerán sin cambios;
- los turnos de sanción podrán disminuir conforme a RN-041;
- cuando la sanción llegue a cero podrá volver a utilizar su prioridad.

## RN-114 — Sanción mediante quita de atrasos

La única situación en la que una sanción reduce directamente atrasos pendientes es cuando la sanción fue definida específicamente como una quita de turnos atrasados.

---

# 28. Pizarrón digital

## RN-115 — Pizarrón operativo

El sistema mantendrá un pizarrón digital con los pedidos operativos.

## RN-116 — Vista interna UATRE

El personal autorizado podrá visualizar los pedidos y los números designados correspondientes cuando proceda.

## RN-117 — Empresa

La empresa podrá saber si su pedido fue cubierto.

No podrá visualizar:

- identidad de trabajadores;
- números designados;
- lista de socios;
- posiciones de rotación.

## RN-145 — Consulta del pizarrón actual por trabajadores

Los trabajadores podrán consultar el pizarrón correspondiente a la jornada actual.

## RN-146 — Aviso de pedido cancelado

Cuando un pedido sea cancelado, el pizarrón deberá indicar que dicho pedido fue CANCELADO.

---

# 29. Cambio de jornada

## RN-118 — Renovación a las 00:00

A las 00:00 se renovará el pizarrón correspondiente a la jornada.

## RN-119 — Pedidos que permanecen

No deberán eliminarse del pizarrón los pedidos que:

- todavía no hayan sido designados;
- tengan un horario de ingreso que todavía no se haya cumplido.

## RN-120 — Registro único

Un mismo pedido deberá incorporarse al historial una sola vez aunque permanezca activo al atravesar un cambio de día.

---

# 30. Historial

## RN-121 — Pizarrón histórico

Deberá conservarse el pizarrón correspondiente a jornadas anteriores.

### Caso de uso asociado:

- UC-UATRE-009: Historial de pizarrón

## RN-122 — Consulta UATRE

El personal autorizado de la seccional podrá consultar pizarrones históricos.

### Caso de uso asociado:

- UC-UATRE-009: Historial de pizarrón

## RN-123 — Consulta histórica del trabajador

Los socios podrán consultar el pizarrón histórico día por día.

## RN-124 — Historial personal

Cada trabajador podrá consultar sus propias designaciones históricas.

## RN-125 — Estadísticas futuras

Las estadísticas sobre el historial podrán incorporarse en una etapa posterior.

## RN-165 — Historial simplificado

**Actualización:** solo se conserva la tabla `PEDIDO_HISTORIAL` como foto del pedido al cierre de jornada.

**No se registran:**

- ATRASOS_HISTORIAL;
- SANCIONES_HISTORIAL;
- HABILITACIONES_HISTORIAL;
- DESIGNACIONES_HISTORIAL;
- acciones manuales de UATRE.

### Caso de uso asociado:

- UC-UATRE-009: Historial de pizarrón

---

# 31. Overrides administrativos

## RN-126 — Override puntual de asignación

El encargado de UATRE podrá modificar manualmente qué trabajador quedó asignado dentro de un pedido.

**Decisión aprobada:** el trabajador reemplazado recibe 1 turno de sanción,
conforme a RN-083. Este reemplazo no aplica por analogía los efectos de cancelación
del pedido de RN-074. La cancelación del pedido conserva su tratamiento separado.

### Caso de uso asociado:

- UC-UATRE-010: Override puntual de asignación

## RN-127 — Override de rotación

El encargado podrá modificar manualmente el punto desde el cual continuará la lista.

### Caso de uso asociado:

- UC-UATRE-005: Override de rotación

## RN-128 — Sin auditoría del override

La acción administrativa utilizada para realizar un override no deberá conservarse como un evento de auditoría específico.

El historial conserva el resultado final resumido del pedido, pero no la identidad
del trabajador finalmente designado ni el detalle de las designaciones individuales.

### Casos de uso asociados:

- UC-UATRE-005: Override de rotación
- UC-UATRE-010: Override puntual de asignación

---

# 32. Principios transversales

## RN-129 — No duplicar la lista para asistencia

## RN-130 — Separar recorrido y elegibilidad

## RN-131 — Separar identidad y número

## RN-132 — Separar asistencia y situación operativa

## RN-133 — Separar designación y trabajo

## RN-134 — Condiciones simultáneas

## RN-135 — ATRASADO es cuantificable

## RN-136 — ANOTADO prevalece temporalmente sobre ATRASADO

## RN-137 — Sanción por turnos prevalece temporalmente sobre ATRASADO

## RN-147 — La lista no se desestructura

## RN-148 — Solo la rotación ordinaria modifica el punto normal

---

# 33. Modelo de datos

## 33.1 Tablas del sistema

| Tabla | Propósito |
|-------|-----------|
| `SECCIONALES` | Sedes UATRE |
| `EMPRESAS` | Empresas afiliadas |
| `ESTABLECIMIENTOS` | Lugares de trabajo administrados por una empresa |
| `TAREAS_EMPRESA` | Tipos de trabajo configurados por empresa |
| `TRABAJADORES` | Socios con flags de asistencia y anotado |
| `USUARIOS` | Usuarios centralizados (seccional, empresa, trabajador) |
| `LISTA_ROTACION` | Números fijos por seccional |
| `ASISTENCIA` | Historial diario de asistencia |
| `ATRASOS` | Cantidad de turnos atrasados |
| `SANCIONES` | Turnos de sanción pendientes |
| `INHABILITACIONES` | Excepciones de habilitación |
| `PEDIDOS` | Solicitudes de personal |
| `COLA_PEDIDOS` | Pedidos que esperan procesamiento |
| `DESIGNACIONES` | Asignación de trabajadores a pedidos |
| `PEDIDO_HISTORIAL` | Foto del pedido al cierre de jornada |

> **C-05 subsanada (2026-10-02):** lista completa con las 15 tablas de
> `BD/bd_uatre.sql`. Las migraciones de Prisma añaden además `sesiones`.

## 33.2 Estructura detallada

### SECCIONALES
id PK
numero INTEGER UNIQUE
localidad VARCHAR
provincia VARCHAR
punto_rotacion INTEGER DEFAULT 1
cantidad_numeros INTEGER DEFAULT 0
activo BOOLEAN DEFAULT TRUE


### EMPRESAS
id PK
seccional_id FK
nombre VARCHAR
localidad VARCHAR
provincia VARCHAR
activa BOOLEAN DEFAULT TRUE


### TRABAJADORES
id PK
seccional_id FK
nombre VARCHAR
apellido VARCHAR
documento VARCHAR UNIQUE
telefono VARCHAR
activo BOOLEAN DEFAULT TRUE
presente_hoy BOOLEAN DEFAULT FALSE
presente_ayer BOOLEAN DEFAULT FALSE
anotado BOOLEAN DEFAULT FALSE


### USUARIOS
id PK
email VARCHAR UNIQUE
password_hash VARCHAR
tipo VARCHAR CHECK (SECCIONAL | EMPRESA | TRABAJADOR)
seccional_id FK NULL
empresa_id FK NULL
trabajador_id FK NULL
activo BOOLEAN DEFAULT TRUE
primera_vez_login BOOLEAN DEFAULT FALSE
fecha_creacion TIMESTAMP


### LISTA_ROTACION
id PK
seccional_id FK
numero INTEGER
trabajador_id FK NULL
activo BOOLEAN DEFAULT TRUE
UNIQUE(seccional_id, numero)


### ASISTENCIA
id PK
trabajador_id FK
fecha DATE
presente BOOLEAN
verificado BOOLEAN DEFAULT FALSE
cerrado BOOLEAN DEFAULT FALSE
UNIQUE(trabajador_id, fecha)


### ATRASOS
id PK
trabajador_id FK UNIQUE
cantidad INTEGER DEFAULT 0
fecha_primer_atraso TIMESTAMP NULL


### SANCIONES
id PK
trabajador_id FK UNIQUE
turnos_pendientes INTEGER
fecha_inicio TIMESTAMP
fecha_fin TIMESTAMP NULL


### INHABILITACIONES
id PK
trabajador_id FK
empresa_id FK
fecha_inhabilitacion TIMESTAMP
UNIQUE(trabajador_id, empresa_id)


### PEDIDOS
id PK
empresa_id FK
seccional_id FK
fecha DATE
horario_inicio TIME
cant_requerida INTEGER
tarea_id FK (TAREAS_EMPRESA)
establecimiento_id FK NULL (ESTABLECIMIENTOS)
estado VARCHAR CHECK (PENDIENTE | EN_PROCESO | CUBIERTO | NO_CUBIERTO | CANCELADO)
fecha_creacion TIMESTAMP


### COLA_PEDIDOS
id PK
pedido_id FK UNIQUE
fecha_encolamiento TIMESTAMP
fecha_procesamiento_programado TIMESTAMP
orden INTEGER
estado VARCHAR


### DESIGNACIONES
id PK
pedido_id FK
trabajador_id FK
estado VARCHAR
horario_inicio TIMESTAMP
horario_fin TIMESTAMP NULL
es_excepcional BOOLEAN DEFAULT FALSE
fecha_designacion TIMESTAMP
UNIQUE(pedido_id, trabajador_id)


### PEDIDO_HISTORIAL
id PK
pedido_id FK
empresa_id FK
seccional_id FK
fecha DATE
horario_inicio TIME
cantidad_requerida INTEGER
cantidad_designados INTEGER
tarea VARCHAR
establecimiento VARCHAR
estado_final VARCHAR(20)
fecha_creacion TIMESTAMP
fecha_cierre_jornada TIMESTAMP



## 33.3 Vistas del motor

| Vista | Propósito |
|-------|-----------|
| `v_trabajadores_elegibles` | Base: presentes hoy + ayer, no anotados |
| `v_atrasados_elegibles` | Atrasados con prioridad |
| `v_rotacion_disponible` | Rotación ordinaria |
| `v_excepcional_etapa1` | Presentes hoy, ausentes ayer |
| `v_excepcional_etapa2` | Sancionados presentes hoy |
| `v_excepcional_etapa3` | Ausentes hoy |
| `v_estado_trabajador` | Estado completo para UI |

## 33.4 Triggers

| # | Trigger | Función |
|---|---------|---------|
| 1 | `trg_sync_presente_flags` | Sincroniza `presente_hoy` y `presente_ayer` al cerrar asistencia |
| 2 | `trg_crear_atraso_inicial` | Crea registro en `atrasos` al insertar trabajador |
| 3 | `trg_gestionar_fecha_primer_atraso` | Setea/resetea `fecha_primer_atraso` |
| 4 | `trg_descontar_atraso_al_designar` | Descuenta 1 atraso al designar |
| 5 | `trg_gestionar_sancion_al_llegar_a_cero` | Marca `fecha_fin` cuando sanción llega a 0 |
| 6 | `trg_paso_a_trabajando` | Calcula `horario_fin` (+12h) al pasar a TRABAJANDO |
| 7 | `trg_liberar_designacion` | Marca `horario_fin` al finalizar |
| 8 | `trg_descuento_atraso_ausencia` | Descuenta 1 atraso si AUSENTE + atrasos al cerrar asistencia |
| 9 | `trg_decidir_procesamiento_pedido` | Decide cola vs. inmediato al insertar pedido (RN-063) |

Nota (A-28): el antiguo `trg_reset_presente_hoy` fue eliminado; los flags se
sincronizan solo al cierre (D-02).

---

# 33.5 Nuevas reglas de consolidación (Fase 3 actualizada)

## RN-166 — Validación de cierre de asistencia

Antes de permitir que UATRE cierre la asistencia, el sistema deberá verificar que:

- Todos los números activos de la lista (`activo = TRUE`) tengan un registro en ASISTENCIA para la jornada actual.
- Todos esos registros estén marcados como `verificado = TRUE`; recién entonces
  `presente = TRUE` o `presente = FALSE` representa un estado definido.

Si algún número no ha sido verificado (su registro de asistencia está sin marcar), el botón "CERRAR ASISTENCIA" deberá permanecer deshabilitado.

Una vez verificados todos los números, UATRE podrá hacer clic en "CERRAR ASISTENCIA" (disponible solamente después de las 07:40).

## RN-167 — Motor de nombramiento en PostgreSQL

El motor de nombramiento (`fn_ejecutar_motor()`) se implementa como una función PL/pgSQL en PostgreSQL.

Al cerrar la asistencia, el caso de uso transaccional invoca el procesamiento de la
cola habilitada y la función del motor. No depende de un trigger temporal: PostgreSQL
solo ejecuta triggers como respuesta a una operación sobre datos.

El worker también puede invocarlo cuando:
- Un pedido ingresa a COLA_PEDIDOS y su `fecha_procesamiento_programado` es alcanzada.
- Se necesita reprocesar un pedido manualmente.

## RN-168 — Zona horaria del sistema

El sistema utiliza **Zona Horaria Argentina (UTC-3)** como referencia temporal global.

Todas las comparaciones de tiempo (`hora_actual < 07:40`, `CURRENT_TIMESTAMP`) utilizan la zona del servidor sin conversión adicional.

En el modelo de base de datos, se utiliza `CURRENT_TIMESTAMP` que respeta la configuración de zona horaria de PostgreSQL.

El cierre de asistencia a las 07:40 se evalúa en hora Argentina local.

---


## RN-169 — Cambio obligatorio de contraseña en primer login

Cuando un trabajador o una empresa dada de alta manualmente por UATRE accede
por primera vez con la contraseña temporal generada en su registro
(UC-UATRE-002 o UC-UATRE-003, flujo B):

1. **El sistema detecta primer login:**
   - Consulta campo `primera_vez_login` o similar en tabla USUARIOS
   - Si no existe esta validación en BD, debe implementarse

2. **El sistema obliga cambio de contraseña:**
   - El actor NO puede acceder a ninguna funcionalidad operativa
   - Se presenta pantalla OBLIGATORIA de cambio de contraseña
   - No existe opción "skip" o "recordar después"
   - No permite navegar a otra sección

3. **Validación de nueva contraseña:**
   - Mínimo 8 caracteres
   - Debe ser diferente de la contraseña temporal
    - Obligatoriamente al menos una mayúscula, una minúscula, un número y un símbolo (decisión aprobada por el usuario)

4. **Flujo:**
   ```
   Actor accede con email + password temporal
       ↓
   Sistema verifica: ¿Primera vez login?
       ↓ SÍ
   Presentar pantalla obligatoria de cambio
   Actor ingresa nueva contraseña
   Sistema valida y actualiza USUARIOS.password_hash
   Sistema marca USUARIOS.primera_vez_login = FALSE
       ↓
   Actor accede al sistema normalmente
   ```

5. **Postcondiciones:**
   - USUARIOS.password_hash: actualizado con nueva contraseña
   - USUARIOS.primera_vez_login: FALSE
   - El actor puede usar la nueva contraseña en siguientes accesos
   - Contraseña temporal queda invalidada

### Regla asociada:

- RN-140: Registro de un trabajador (UATRE crea trabajador)
- UC-UATRE-003, flujo B: Alta manual de empresa

### Casos de uso asociados:

- UC-TRABAJADOR-008: Cambiar contraseña en primer login

---

# 34. Diagramas de flujo

Los diagramas existentes en `docs/` son cuatro:

1. **`diagrama-motor.md`** — motor de asignación (atrasados, rotación,
   cobertura excepcional). ⚠️ C-04: omite ANOTADO y sanciones.
2. **`diagrama-asistencia.md`** — toma de asistencia y cierre.
3. **`diagrama-cola-vs-inmediato.md`** — gestión de pedidos (cola vs inmediato).
4. **`diagrama-ER.md`** — modelo entidad-relación.

Sin diagrama propio (aún no diseñados): registro de actores, pizarrón digital
e historial/reportes.

---

# 35. Reglas no definidas completamente

## ND-001 — Representación visual de condiciones simultáneas

## ND-002 — Múltiples usuarios por seccional (futuro)

## ND-003 — Múltiples usuarios por empresa (futuro)

## ND-004 — Tipos de usuario adicionales (super-admin, etc.)

## ND-005 — Múltiples seccionales por trabajador (descartado por ahora)

## ND-006 — Múltiples seccionales por empresa (descartado por ahora)

---

# 36. Regla para futuras modificaciones

Cuando una nueva decisión cambie alguna regla de este documento:

1. identificar las reglas afectadas;
2. actualizar este archivo;
3. actualizar `requirements.md` si corresponde;
4. comprobar si existen casos de uso o diseños posteriores afectados;
5. recién entonces modificar la implementación.

No deberán mantenerse simultáneamente reglas contradictorias como si ambas continuaran vigentes.

---

# 37. Regla final

Ante una situación del dominio no contemplada en este documento:

**NO asumir comportamiento.**

La situación deberá documentarse como duda y solicitarse una decisión antes de implementarla.
