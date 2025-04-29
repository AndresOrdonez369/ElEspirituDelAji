document.addEventListener('DOMContentLoaded', () => {

    const sections = document.querySelectorAll('.story-section');
    const toggleButton = document.getElementById('audio-toggle-button'); // Referencia al botón
    let currentPlayingAudio = null; // Variable para rastrear el audio actual

    // Iconos para el botón (puedes usar texto, emojis, o clases de iconos)
    const playIcon = '▶';
    const pauseIcon = '❚❚';

    // --- Función para actualizar la apariencia y estado del botón ---
    function updateToggleButtonState() {
        if (currentPlayingAudio) {
            toggleButton.style.display = 'block'; // Mostrar botón
            if (currentPlayingAudio.paused) {
                toggleButton.innerHTML = playIcon;
                toggleButton.setAttribute('aria-label', 'Reproducir audio');
            } else {
                toggleButton.innerHTML = pauseIcon;
                toggleButton.setAttribute('aria-label', 'Pausar audio');
            }
        } else {
            toggleButton.style.display = 'none'; // Ocultar botón si no hay audio activo
        }
    }

    // --- Event Listener para el botón ---
    toggleButton.addEventListener('click', () => {
        if (currentPlayingAudio) {
            if (currentPlayingAudio.paused) {
                currentPlayingAudio.play().catch(e => console.error("Error al reproducir:", e));
            } else {
                currentPlayingAudio.pause();
            }
            // Actualizamos el botón inmediatamente después de la acción del usuario
            // El evento 'play'/'pause' del audio también lo actualizará por si acaso
            updateToggleButtonState();
        }
    });


    // --- Intersection Observer (Lógica principal) ---
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.6 // 60% visible para activar
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            const sectionId = entry.target.id;
            const audio = entry.target.querySelector('audio');

            if (entry.isIntersecting) {
                // --- Sección ENTRANDO ---
                // console.log(`Sección "${sectionId}" ENTRANDO.`);
                entry.target.classList.add('is-visible');

                if (audio) {
                    // Si hay otro audio sonando, páralo
                    if (currentPlayingAudio && currentPlayingAudio !== audio) {
                        // console.log(`   Parando audio anterior: ${currentPlayingAudio.id}`);
                        currentPlayingAudio.pause();
                        // No reiniciamos currentTime aquí, podría querer seguir donde estaba si vuelve rápido
                    }

                    // Si este audio no es el que ya está sonando (o no hay ninguno sonando)
                    if (audio !== currentPlayingAudio) {
                         // console.log(`   Intentando iniciar audio: ${audio.id}`);
                         // Ponemos el currentTime a 0 solo si NO estaba ya pausado (para reanudar)
                         if(audio.currentTime > 0 && !audio.paused) {
                             // No hacemos nada si ya estaba sonando
                         } else {
                             audio.currentTime = 0; // Empezar desde el principio
                         }

                         const playPromise = audio.play();
                         currentPlayingAudio = audio; // Asignamos como actual ANTES del then/catch

                         if (playPromise !== undefined) {
                            playPromise.then(_ => {
                                // console.log(`   Audio ${audio.id} reproduciendo.`);
                                updateToggleButtonState(); // Actualiza el botón al empezar a sonar
                            }).catch(error => {
                                console.error(`   Error al reproducir ${audio.id}:`, error);
                                // Si falla el play, podría ser bueno indicar estado pausado
                                currentPlayingAudio = audio; // Aseguramos que es el actual aunque fallara
                                updateToggleButtonState(); // Actualiza botón a estado 'play' (porque está pausado)
                            });
                         } else {
                             // Si playPromise es undefined, el navegador no lo soporta bien
                             // Asumimos que empezó y actualizamos
                              updateToggleButtonState();
                         }
                    } else {
                        // Si el audio que entra es el mismo que ya sonaba (raro, pero posible)
                        // Solo nos aseguramos que el botón esté correcto
                         updateToggleButtonState();
                    }
                } else {
                    // Si la sección no tiene audio, pero había uno sonando antes
                    if (currentPlayingAudio) {
                         // console.log(`   Sección sin audio entrando, parando audio anterior: ${currentPlayingAudio.id}`);
                         currentPlayingAudio.pause();
                         currentPlayingAudio = null; // Ya no hay audio activo
                         updateToggleButtonState(); // Oculta/Actualiza el botón
                    }
                }

            } else {
                // --- Sección SALIENDO ---
                if (entry.target.classList.contains('is-visible')) {
                    // console.log(`Sección "${sectionId}" SALIENDO.`);
                    entry.target.classList.remove('is-visible');

                    // Si el audio que está saliendo es el que estaba sonando, PÁRALO.
                    if (audio && audio === currentPlayingAudio) {
                        // console.log(`   Parando audio ${audio.id} al salir.`);
                        audio.pause();
                        currentPlayingAudio = null; // Ya no hay audio activo
                        updateToggleButtonState(); // Oculta/Actualiza el botón
                    }
                }
            }
        });
    };

    // Crear el observer
    const observer = new IntersectionObserver(observerCallback, options);

    // Observar cada sección y configurar audios
    sections.forEach(section => {
        observer.observe(section);
        const audio = section.querySelector('audio');
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            // Añadir listeners a cada audio para actualizar el botón si se pausa/reanuda externamente
            audio.addEventListener('play', updateToggleButtonState);
            audio.addEventListener('pause', updateToggleButtonState);
            audio.addEventListener('ended', () => { // Si no tiene loop y termina
                 if(audio === currentPlayingAudio && !audio.loop) {
                     currentPlayingAudio = null;
                     updateToggleButtonState();
                 }
            });
        }
    });

    // Estado inicial del botón (oculto)
    updateToggleButtonState();

}); // Fin del DOMContentLoaded