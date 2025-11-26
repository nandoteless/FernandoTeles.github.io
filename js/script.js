// Funções para abrir e fechar o sidebar
function openNav() {
  document.getElementById("sidebar").style.width = "250px";
  document.getElementById("main").style.marginLeft = "250px";
}

function closeNav() {
  document.getElementById("sidebar").style.width = "0";
  document.getElementById("main").style.marginLeft = "0";
}

// Função para trocar fonte e salvar no localStorage
function trocarFonte(fonte) {
  document.body.style.fontFamily = `'${fonte}', sans-serif`;
  localStorage.setItem("fonteSelecionada", fonte);
}

// Dados das imagens
const imagens = [
  {
    src: "img/sapo.webp",
    popupSrc: "img/saponinja.jpeg",
    titulo: "Ninja Frog",
    descricao: "É um jogo de plataforma 2D com visão lateral, desenvolvido na engine Unity para a disciplina de Programação 2. Nele, você controla um sapo ninja com o objetivo de coletar todas as moedas e estrelas de cada fase, desviando de obstáculos.",
    data: "2023"
  },
  {
    src: "img/TSS.png",
    popupSrc: "img/TCC.png",
    titulo: "Terra de Sol e Sangue",
    descricao: "É um jogo educativo 2D com visão de cima (top-down), feito na disciplina projeto de desenvolvimento de jogos como projeto de conclusão de curso, que explora a colonização do Brasil. Os jogadores embarcam em uma jornada interativa, aprendendo sobre os principais eventos, personagens e desafios desse período histórico de forma envolvente.",
    data: "2025 - Em curso"
  },
  {
    src: "img/fazendeiro.png",
    popupSrc: "img/fazenda.png",
    titulo: "Jogo do Fazendeiro",
    descricao: "É um jogo de fazenda 2D com visão de cima (top-down), desenvolvido na Unity para a disciplina de Programação 2. Nele, você controla um fazendeiro cujo objetivo é acertar animais com projéteis conforme eles aparecem na tela.",
    data: "2023"
  },
  {
    src: "img/game.avif",
    popupSrc: "img/snake.png",
    titulo: "Snake Game",
    descricao: "Versão simples do clássico Snake. Desenvolvido em C++ para a disciplina de Programação 1, o jogo desafia você a controlar uma cobra, expandindo seu tamanho ao coletar frutas e evitando colisões para sobreviver.",
    data: "2022"
  },
  // --- SEU NOVO JOGO AQUI ---
  {
    src: "img/youwin.png", // Ou use 'img/bee1.png' se preferir a abelha na capa
    titulo: "Jogo da Abelha",
    data: "Novembro de 2025",
    descricao: "Jogo simples em HTML,JavaScript e CSS. Use A/D para mover, desvie da aranha e colete 10 flores.",
    link: "jogo.html" // <--- O script vai detectar isso aqui
  }
];

let indiceAtual = 0;
const imagensPorTela = 3;

function exibirImagens() {
  const container = document.getElementById("carrossel-imagens");
  container.innerHTML = "";

  for (let i = 0; i < imagensPorTela; i++) {
    const index = (indiceAtual + i) % imagens.length;
    const imagemInfo = imagens[index];

    const img = document.createElement("img");
    img.src = imagemInfo.src;
    img.alt = imagemInfo.titulo;
    img.title = imagemInfo.descricao;
    img.style.cursor = "pointer";

    img.onclick = function () {
      
      // --- ALTERAÇÃO PRINCIPAL AQUI ---
      // 1. Verifica se existe a propriedade 'link' (para o jogo da abelha)
      if (imagemInfo.link) {
         // MUDANÇA AQUI: Aumentei para 1100x850 para caber a nova tela
         window.open(imagemInfo.link, "Jogo", "width=1120,height=850,resizable=yes,scrollbars=no");
      }
      // 2. Se não tiver link, abre o popup de descrição normal (seu código antigo)
      else {
        const popup = window.open("", `popup${index}`, "width=850,height=700,resizable=yes,scrollbars=yes");
        if (popup) {
          // Define largura padrão 100% caso não exista largura definida no objeto
          const widthStyle = imagemInfo.largura ? imagemInfo.largura : "100%";
          const heightStyle = imagemInfo.altura ? imagemInfo.altura : "auto";
          // Usa popupSrc se existir, senão usa a src normal
          const imgSrc = imagemInfo.popupSrc ? imagemInfo.popupSrc : imagemInfo.src;

          popup.document.write(`
            <html>
              <head>
                <title>${imagemInfo.titulo}</title>
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    text-align: center;
                  }
                  img {
                    width: ${widthStyle};
                    height: ${heightStyle};
                    border-radius: 8px;
                    display: block;
                    margin: 0 auto 15px auto;
                    max-width: 100%;
                  }
                  h1 { margin-top: 0; }
                  .info { margin-bottom: 10px; color: #555; }
                  p { text-align: justify; line-height: 1.6; }
                </style>
              </head>
              <body>
                <h1>${imagemInfo.titulo}</h1>
                <div class="info"><strong>Data de criação:</strong> ${imagemInfo.data}</div>
                <img src="${imgSrc}" alt="${imagemInfo.titulo}">
                <p><strong>Descrição:</strong> ${imagemInfo.descricao}</p>
                <button onclick="window.close()" style="padding:10px 20px; cursor:pointer; margin-top:20px;">Fechar</button>
              </body>
            </html>
          `);
          popup.document.close();
          popup.focus();
        } else {
          alert("Por favor, permita pop-ups para visualizar as informações.");
        }
      }
    };

    container.appendChild(img);
  }
}

function mudarImagens(direcao) {  
  indiceAtual = (indiceAtual + direcao * 1 + imagens.length) % imagens.length; // Mudei para 1 para rolar mais suave, se quiser pular 3 volte para 'imagensPorTela'
  exibirImagens();
}

// Ao carregar a página
window.onload = function () {
  const fonteSalva = localStorage.getItem("fonteSelecionada");
  if (fonteSalva) {
    document.body.style.fontFamily = `'${fonteSalva}', sans-serif`;
  }
  exibirImagens();
};