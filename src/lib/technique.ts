/**
 * Guía breve de técnica por ejercicio: puntos clave y errores comunes.
 * Orientativa: no sustituye la supervisión de un entrenador.
 */
export interface Technique {
  cues: string[]
  errors: string[]
}

export const TECHNIQUE: Record<string, Technique> = {
  // Empuje horizontal
  bench: {
    cues: ['Escápulas juntas y hacia abajo, pecho arriba', 'Pies firmes en el piso', 'Baja la barra a la parte baja del pecho, codos a ~45°', 'Empuja hacia arriba y un poco hacia atrás'],
    errors: ['Rebotar la barra en el pecho', 'Abrir los codos a 90° (estresa el hombro)'],
  },
  'incline-db': {
    cues: ['Banco a 30–45°', 'Escápulas atrás y abajo', 'Baja las mancuernas a los lados del pecho', 'Sube juntándolas ligeramente arriba'],
    errors: ['Banco demasiado inclinado (se vuelve press de hombro)', 'Bajar sin control'],
  },
  dips: {
    cues: ['Hombros lejos de las orejas', 'Inclina un poco el torso hacia adelante para más pecho', 'Baja hasta que el brazo quede paralelo al piso', 'Sube sin bloquear de golpe'],
    errors: ['Bajar demasiado y forzar el hombro', 'Encoger los hombros'],
  },
  'db-bench': {
    cues: ['Escápulas juntas, pecho arriba', 'Codos a ~45° del torso', 'Baja hasta sentir estiramiento en el pecho', 'Sube con control'],
    errors: ['Chocar las mancuernas arriba', 'Perder la tensión abajo'],
  },
  'incline-bench': {
    cues: ['Banco a 30–45°', 'Baja la barra a la parte alta del pecho', 'Codos ligeramente por debajo de la barra', 'Glúteos apoyados todo el tiempo'],
    errors: ['Despegar la cadera del banco', 'Bajar la barra al cuello'],
  },
  'machine-chest': {
    cues: ['Ajusta el asiento: agarres a la altura del pecho', 'Espalda pegada al respaldo', 'Empuja sin bloquear los codos', 'Regresa lento'],
    errors: ['Asiento muy alto o bajo', 'Soltar el peso de golpe al regresar'],
  },
  pushup: {
    cues: ['Cuerpo recto de cabeza a talones', 'Manos un poco más abiertas que los hombros', 'Codos a ~45°', 'Pecho casi al piso'],
    errors: ['Cadera caída o muy arriba', 'Medias repeticiones'],
  },
  'db-fly': {
    cues: ['Codos ligeramente flexionados y fijos', 'Abre en arco hasta sentir estiramiento', 'Cierra como si abrazaras un árbol', 'Peso moderado'],
    errors: ['Doblar y estirar los codos (se vuelve press)', 'Bajar demasiado con mucho peso'],
  },
  'cable-fly': {
    cues: ['Un pie adelante para estabilidad', 'Codos ligeramente flexionados', 'Junta las manos frente al pecho', 'Regresa lento'],
    errors: ['Usar el impulso del cuerpo', 'Encoger los hombros'],
  },
  // Empuje vertical
  ohp: {
    cues: ['Glúteos y abdomen apretados', 'Barra desde la clavícula', 'Mete la cabeza para que pase la barra y vuelve a sacarla', 'Termina con la barra sobre la mitad del pie'],
    errors: ['Arquear mucho la espalda baja', 'Empujar la barra hacia adelante'],
  },
  'db-ohp': {
    cues: ['Sentado con respaldo o de pie con abdomen firme', 'Mancuernas a la altura de las orejas', 'Empuja hacia arriba sin chocarlas', 'Baja con control'],
    errors: ['Arquear la espalda', 'Bajar a medias'],
  },
  arnold: {
    cues: ['Empieza con palmas hacia ti a la altura del pecho', 'Gira las palmas hacia afuera mientras subes', 'Termina con brazos extendidos', 'Invierte el giro al bajar'],
    errors: ['Hacerlo rápido sin control', 'Usar demasiado peso'],
  },
  'machine-ohp': {
    cues: ['Ajusta el asiento: agarres a la altura de los hombros', 'Espalda pegada al respaldo', 'Empuja sin bloquear de golpe', 'Regresa lento'],
    errors: ['Despegar la espalda', 'Rebotar abajo'],
  },
  // Hombro lateral y posterior
  lateral: {
    cues: ['Codos ligeramente flexionados', 'Sube hacia los lados hasta la altura del hombro', 'Lidera con los codos, no con las manos', 'Baja lento'],
    errors: ['Balancear el cuerpo', 'Encoger los hombros (trabaja el trapecio)'],
  },
  'face-pull': {
    cues: ['Polea a la altura de la cara, cuerda', 'Jala hacia la frente separando las manos', 'Codos altos', 'Aprieta la parte de atrás del hombro'],
    errors: ['Jalar hacia el pecho', 'Inclinarse hacia atrás para ayudarse'],
  },
  'cable-lateral': {
    cues: ['Polea baja, cable por delante o por detrás del cuerpo', 'Sube hacia el lado hasta la altura del hombro', 'Tensión constante', 'Baja lento'],
    errors: ['Usar el torso para ayudar', 'Subir por encima del hombro'],
  },
  'rear-delt': {
    cues: ['Torso inclinado hacia adelante, espalda recta', 'Codos ligeramente flexionados', 'Abre los brazos hacia los lados', 'Peso ligero, sin impulso'],
    errors: ['Juntar las escápulas en exceso (trabaja la espalda)', 'Balancear el torso'],
  },
  // Jalón vertical
  pullup: {
    cues: ['Agarre un poco más abierto que los hombros', 'Empieza colgado con brazos casi extendidos', 'Lleva el pecho hacia la barra', 'Baja controlado'],
    errors: ['Medias repeticiones', 'Balancear las piernas para subir'],
  },
  'lat-pulldown': {
    cues: ['Muslos bien sujetos', 'Pecho arriba, ligera inclinación atrás', 'Jala la barra a la parte alta del pecho', 'Codos hacia abajo y atrás'],
    errors: ['Jalar detrás de la nuca', 'Echarse muy atrás para mover más peso'],
  },
  'assisted-pullup': {
    cues: ['Anota solo las reps; la asistencia escríbela en la nota', 'Igual que la dominada: pecho hacia la barra', 'Baja controlado', 'Al llegar a 12 reps, baja la asistencia'],
    errors: ['Usar tanta asistencia que no cueste', 'Medias repeticiones'],
  },
  'close-pulldown': {
    cues: ['Agarre cerrado o en V', 'Pecho arriba', 'Jala hacia la parte baja del pecho', 'Aprieta la espalda abajo'],
    errors: ['Jalar con los bíceps encorvando la espalda', 'Soltar sin control'],
  },
  // Remo
  row: {
    cues: ['Bisagra de cadera, torso a ~45°', 'Espalda neutra', 'Jala la barra al ombligo', 'Aprieta las escápulas arriba'],
    errors: ['Redondear la espalda', 'Levantar el torso para ayudarse'],
  },
  'db-row': {
    cues: ['Mano y rodilla apoyadas en el banco', 'Espalda plana', 'Jala la mancuerna hacia la cadera', 'Baja hasta estirar bien'],
    errors: ['Girar el torso', 'Jalar hacia el hombro'],
  },
  'cable-row': {
    cues: ['Pecho arriba, espalda neutra', 'Jala hacia el abdomen', 'Codos pegados al cuerpo', 'Estira los brazos al regresar sin redondear'],
    errors: ['Balancearse hacia atrás y adelante', 'Encoger los hombros'],
  },
  'machine-row': {
    cues: ['Pecho apoyado en el soporte', 'Jala con los codos hacia atrás', 'Aprieta las escápulas', 'Regresa lento'],
    errors: ['Despegar el pecho', 'Medias repeticiones'],
  },
  'inverted-row': {
    cues: ['Cuerpo recto como plancha', 'Barra a la altura de la cintura o más alta', 'Jala el pecho hacia la barra', 'Más horizontal = más difícil'],
    errors: ['Cadera caída', 'Jalar con el cuello'],
  },
  // Rodilla
  squat: {
    cues: ['Pies al ancho de hombros, puntas un poco afuera', 'Rodillas en dirección de las puntas', 'Pecho arriba, espalda neutra', 'Baja al menos hasta que la cadera llegue a la rodilla'],
    errors: ['Despegar los talones', 'Rodillas hacia adentro'],
  },
  'leg-press': {
    cues: ['Pies al ancho de hombros en la plataforma', 'Espalda y cadera pegadas al respaldo', 'Baja hasta ~90° de rodilla', 'Empuja con todo el pie'],
    errors: ['Bloquear las rodillas arriba', 'Despegar la cadera abajo'],
  },
  'leg-ext': {
    cues: ['Rodilla alineada con el eje de la máquina', 'Extiende por completo', 'Aprieta el cuádriceps arriba un segundo', 'Baja lento'],
    errors: ['Patear con impulso', 'Levantar la cadera del asiento'],
  },
  goblet: {
    cues: ['Mancuerna pegada al pecho', 'Codos entre las rodillas al bajar', 'Torso erguido', 'Baja profundo con talones en el piso'],
    errors: ['Inclinar el torso hacia adelante', 'Rodillas hacia adentro'],
  },
  bulgarian: {
    cues: ['Pie trasero apoyado en un banco', 'Paso suficientemente largo', 'Baja la rodilla trasera hacia el piso', 'Peso en el talón delantero'],
    errors: ['Paso demasiado corto (estresa la rodilla)', 'Perder el equilibrio por ir rápido'],
  },
  hack: {
    cues: ['Espalda pegada al respaldo', 'Pies al ancho de hombros', 'Baja controlado y profundo', 'Empuja con todo el pie'],
    errors: ['Bloquear las rodillas', 'Despegar los talones'],
  },
  lunge: {
    cues: ['Paso largo hacia adelante', 'Ambas rodillas a ~90°', 'Torso erguido', 'Empuja con el talón delantero para volver'],
    errors: ['Rodilla delantera hacia adentro', 'Paso muy corto'],
  },
  // Cadera
  deadlift: {
    cues: ['Barra sobre la mitad del pie, pegada a las espinillas', 'Espalda neutra, pecho arriba', 'Empuja el piso con las piernas', 'Termina de pie apretando glúteos'],
    errors: ['Redondear la espalda', 'Alejar la barra del cuerpo'],
  },
  rdl: {
    cues: ['Rodillas ligeramente flexionadas y fijas', 'Lleva la cadera hacia atrás', 'Barra pegada a los muslos', 'Baja hasta sentir estiramiento en los femorales'],
    errors: ['Redondear la espalda', 'Doblar las rodillas como en sentadilla'],
  },
  'hip-thrust': {
    cues: ['Parte alta de la espalda en el banco', 'Barra sobre la cadera (con protector)', 'Sube hasta que el torso quede paralelo al piso', 'Aprieta glúteos arriba, mentón abajo'],
    errors: ['Arquear la espalda baja arriba', 'Pies muy lejos o muy cerca'],
  },
  'db-rdl': {
    cues: ['Rodillas ligeramente flexionadas', 'Cadera hacia atrás', 'Mancuernas pegadas a las piernas', 'Baja hasta estirar los femorales'],
    errors: ['Redondear la espalda', 'Bajar las mancuernas lejos del cuerpo'],
  },
  'glute-bridge': {
    cues: ['Acostado, pies cerca de los glúteos', 'Empuja con los talones', 'Sube la cadera hasta alinear rodillas, cadera y hombros', 'Aprieta glúteos arriba'],
    errors: ['Arquear la espalda baja', 'Empujar con las puntas'],
  },
  'good-morning': {
    cues: ['Barra en la espalda como en sentadilla', 'Rodillas ligeramente flexionadas', 'Cadera hacia atrás con espalda neutra', 'Peso ligero a moderado'],
    errors: ['Redondear la espalda', 'Usar demasiado peso'],
  },
  // Femoral
  'leg-curl': {
    cues: ['Rodilla alineada con el eje de la máquina', 'Cadera pegada al banco', 'Flexiona por completo', 'Baja lento'],
    errors: ['Levantar la cadera', 'Usar impulso'],
  },
  'seated-leg-curl': {
    cues: ['Ajusta el respaldo y el rodillo sobre los tobillos', 'Muslos bien sujetos', 'Flexiona por completo', 'Regresa lento'],
    errors: ['Rango incompleto', 'Soltar el peso de golpe'],
  },
  // Bíceps
  curl: {
    cues: ['Codos pegados al cuerpo', 'Sube sin mover los hombros', 'Aprieta arriba', 'Baja completo y controlado'],
    errors: ['Balancear el torso', 'Adelantar los codos'],
  },
  hammer: {
    cues: ['Palmas mirándose entre sí', 'Codos pegados al cuerpo', 'Sube hasta el hombro', 'Baja lento'],
    errors: ['Balancear el cuerpo', 'Girar las muñecas'],
  },
  'cable-curl': {
    cues: ['Polea baja, de pie y firme', 'Codos fijos a los lados', 'Tensión constante', 'Baja hasta estirar el brazo'],
    errors: ['Inclinarse hacia atrás', 'Mover los codos'],
  },
  preacher: {
    cues: ['Axilas pegadas al borde del banco', 'Baja casi hasta extender el brazo', 'Sube sin despegar los brazos', 'Controla la bajada'],
    errors: ['Extender de golpe abajo (estresa el codo)', 'Levantar los codos del apoyo'],
  },
  // Tríceps
  pushdown: {
    cues: ['Codos pegados al cuerpo', 'Extiende por completo', 'Solo se mueve el antebrazo', 'Regresa hasta ~90°'],
    errors: ['Abrir los codos', 'Inclinarse encima para empujar con el cuerpo'],
  },
  skullcrusher: {
    cues: ['Acostado, brazos verticales', 'Baja la barra hacia la frente o detrás de la cabeza', 'Codos apuntando al techo', 'Extiende sin mover los hombros'],
    errors: ['Abrir los codos', 'Bajar muy rápido'],
  },
  'overhead-ext': {
    cues: ['Mancuerna sujeta con ambas manos detrás de la cabeza', 'Codos apuntando arriba y cerca de la cabeza', 'Extiende por completo', 'Abdomen firme'],
    errors: ['Abrir los codos', 'Arquear la espalda'],
  },
  // Pantorrilla
  calf: {
    cues: ['Punta del pie en el borde de un escalón', 'Baja el talón hasta estirar', 'Sube lo más alto posible', 'Pausa arriba un segundo'],
    errors: ['Rebotar abajo', 'Rango incompleto'],
  },
  'seated-calf': {
    cues: ['Rodillas bajo el soporte', 'Baja el talón hasta estirar', 'Sube al máximo', 'Pausa arriba'],
    errors: ['Movimientos cortos y rápidos', 'Rebotar'],
  },
  // Core
  'cable-crunch': {
    cues: ['De rodillas frente a la polea alta, cuerda junto a la cabeza', 'Flexiona el torso llevando los codos a los muslos', 'La cadera no se mueve', 'Exhala al bajar'],
    errors: ['Jalar con los brazos', 'Sentarse sobre los talones con la cadera'],
  },
  plank: {
    cues: ['Antebrazos bajo los hombros', 'Cuerpo recto de cabeza a talones', 'Aprieta abdomen y glúteos', 'Respira normal'],
    errors: ['Cadera caída', 'Cadera muy arriba'],
  },
  'hanging-leg-raise': {
    cues: ['Colgado con hombros activos', 'Sube las piernas con control', 'Enrolla la pelvis arriba', 'Baja sin balancearte'],
    errors: ['Balancearse para subir', 'Arquear la espalda baja'],
  },
  'ab-wheel': {
    cues: ['De rodillas, abdomen apretado', 'Rueda hacia adelante sin hundir la cadera', 'Llega hasta donde controles', 'Regresa con el abdomen'],
    errors: ['Arquear la espalda baja', 'Ir más lejos de lo que controlas'],
  },
  // Agarre y trapecio
  farmer: {
    cues: ['Mancuernas o barras pesadas a los lados', 'Hombros atrás, pecho arriba', 'Pasos cortos y firmes', 'Abdomen apretado'],
    errors: ['Encorvarse', 'Dejar que el peso balancee el cuerpo'],
  },
  'wrist-curl': {
    cues: ['Antebrazos apoyados en los muslos o un banco', 'Solo se mueve la muñeca', 'Rango completo', 'Peso ligero'],
    errors: ['Usar los brazos', 'Ir muy rápido'],
  },
  shrug: {
    cues: ['Brazos extendidos con el peso a los lados', 'Sube los hombros hacia las orejas', 'Pausa arriba', 'Baja lento'],
    errors: ['Girar los hombros en círculos', 'Doblar los codos'],
  },
}
