// public/js/quiz-logic.js

(function() {
    // Função para inicializar o quiz
    // Ela espera o ID do contêiner e os dados do quiz
    window.initializeQuiz = function(containerId, quizDataString) {
        const container = document.getElementById(containerId);
        let quizData;

        try {
            quizData = JSON.parse(quizDataString);
        } catch (e) {
            container.innerHTML = '<p style="color:red; text-align:center;">Erro: O código JSON do Quiz está inválido.</p>';
            console.error("Erro no JSON do Quiz:", e);
            return;
        }

        if (!quizData.steps || quizData.steps.length === 0) { 
            console.warn("Quiz sem etapas ou etapas vazias.");
            return; 
        }

        const settings = quizData.settings;
        let currentStepId = quizData.steps[0].id;
        
        function getMediaHtml(media, stepId) {
            if (!media || !media.src) return '';

            const src = media.src;
            const videoId = `video-${stepId}`;

            // As regexes aqui NÃO PRECISAM de escape para barras, pois estão em um arquivo .js
            if (src.startsWith('data:image/')) { 
                return `<img src="${src}" class="quiz-media-image" alt="Imagem do Quiz">`;
            }

            // Regex corrigida para YouTube (sem escape!)
            const youtubeMatch = src.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S+)?/);
            if (youtubeMatch && youtubeMatch[1]) { 
                return `<div class="quiz-media-aspect-ratio"><iframe src="https://www.youtube.com/embed/\${youtubeMatch[1]}?autoplay=1&mute=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`; 
            }

            // Regex corrigida para Vimeo (sem escape!)
            const vimeoMatch = src.match(/(?:https?:\/\/)?(?:www\.|player\.)?vimeo\.com\/(?:video\/|)(\d+)(?:\/?|\?|#|$)/);
            if (vimeoMatch && vimeoMatch[1]) { 
                return `<div class="quiz-media-aspect-ratio"><iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&dnt=1" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`; 
            }

            if (src.endsWith('.m3u8')) { 
                return `<video id="${videoId}" class="quiz-media-video" controls autoplay muted playsinline></video><script>if(typeof Hls!=='undefined'&&Hls.isSupported()){var v=document.getElementById('${videoId}'),h=new Hls();h.loadSource('${src}'),h.attachMedia(v)}else if(document.getElementById('${videoId}').canPlayType('application/vnd.apple.mpegurl'))document.getElementById('${videoId}').src='${src}'}<\\/script>`; 
            }

            if (src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.ogg')) { 
                return `<video id="${videoId}" src="${src}" class="quiz-media-video" controls autoplay muted playsinline></video>`; 
            }
            
            return `<img src="${src}" class="quiz-media-image" alt="Imagem do Quiz">`;
        }

        function renderStep(stepId) {
            const step = quizData.steps.find(s => s.id === stepId);
            if (!step) { 
                container.innerHTML = `<p style="color:red; text-align:center;">Erro: Etapa "${stepId}" não foi encontrada.</p>`; 
                console.error(`Etapa com ID "${stepId}" não encontrada no quizData.`);
                return; 
            }

            const mediaHtml = getMediaHtml(step.media, step.id);
            const bulletsHtml = step.bullets && step.bullets.length > 0 ? 
                '<ul class="quiz-bullets">' + step.bullets.map(item => `<li>${item}</li>`).join('') + '</ul>' : '';
            
            let answersHtml = '';
            if (step.type === 'result' && step.checkoutButton) {
                answersHtml = `<a href="${step.checkoutButton.url}" class="quiz-checkout-button">${step.checkoutButton.text}</a>`;
            } else if (step.answers && step.answers.length > 0) { 
                answersHtml = step.answers.map(answer => 
                    `<button class="quiz-answer-button" data-target="${answer.target}">${answer.text}</button>`
                ).join(''); 
            }

            container.innerHTML = `<div class="quiz-step-card ${settings.animation || 'fade-in'}">${mediaHtml}<h2 class="quiz-title">${step.title}</h2>${bulletsHtml}<div class="quiz-answers-grid">${answersHtml}</div></div>`;
            
            container.querySelectorAll('.quiz-answer-button').forEach(button => { 
                button.addEventListener('click', () => { 
                    renderStep(button.dataset.target); 
                }); 
            });
        }

        const styleId = `style-${containerId}`;
        if (!document.getElementById(styleId)) {
            const styleSheet = document.createElement("style");
            styleSheet.id = styleId;
            styleSheet.textContent = `
                #${containerId} { 
                    --bg: ${settings.backgroundColor}; 
                    --text: ${settings.textColor}; 
                    --btn: ${settings.buttonColor}; 
                    --btn-text: ${settings.buttonTextColor}; 
                    --border: ${settings.borderColor}; 
                    font-family: Arial, sans-serif;
                }
                .quiz-step-card { 
                    background: var(--bg); 
                    color: var(--text); 
                    border: 1px solid var(--border); 
                    border-radius: 12px; 
                    padding: 2rem; 
                    max-width: 600px; 
                    margin: 2rem auto; 
                    text-align: center; 
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
                }
                .quiz-media-image, .quiz-media-video { 
                    max-width: 100%; 
                    height: auto; 
                    border-radius: 8px; 
                    margin-bottom: 1.5rem; 
                }
                .quiz-media-aspect-ratio { 
                    position: relative; 
                    width: 100%; 
                    padding-top: 56.25%;
                    margin-bottom: 1.5rem; 
                    border-radius: 8px; 
                    overflow: hidden; 
                }
                .quiz-media-aspect-ratio iframe { 
                    position: absolute; 
                    top: 0; 
                    left: 0; 
                    width: 100%; 
                    height: 100%; 
                    border: none;
                }
                .quiz-bullets { 
                    list-style-position: inside; 
                    text-align: left; 
                    margin: 1.5rem 0; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 0.5rem; 
                    padding-left: 0;
                }
                .quiz-bullets li {
                    margin-left: 20px;
                }
                .quiz-title { 
                    font-size: 1.75rem; 
                    font-weight: 600; 
                    margin-bottom: 1.5rem; 
                }
                .quiz-answers-grid { 
                    display: grid; 
                    gap: 1rem; 
                }
                .quiz-answer-button, .quiz-checkout-button { 
                    background: var(--btn); 
                    color: var(--btn-text); 
                    border: none; 
                    width: 100%; 
                    padding: 1rem; 
                    border-radius: 8px; 
                    font-size: 1rem; 
                    font-weight: 500; 
                    cursor: pointer; 
                    transition: transform 0.2s, box-shadow 0.2s; 
                }
                .quiz-answer-button:hover, .quiz-checkout-button:hover { 
                    transform: scale(1.03); 
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
                }
                .quiz-checkout-button { 
                    text-decoration: none; 
                    display: block; 
                }
                .fade-in { animation: fadeIn 0.5s ease-in-out; }
                @keyframes fadeIn { 
                    from { opacity: 0; transform: translateY(10px); } 
                    to { opacity: 1; transform: translateY(0); } 
                }
            `;
            document.head.appendChild(styleSheet);
        }

        renderStep(currentStepId);
    }; // Fim da função initializeQuiz
})();
